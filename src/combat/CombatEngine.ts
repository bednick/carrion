import type { CombatState, EnemyState, HeroState, SummonPlan } from './types';
import { BOARD_SLOTS, placementAnchor } from './types';
import type { EnemySpec, SummonRef, MobDefense } from '../zones/types';
import type { SlotType, ItemInstance } from '../items/types';
import type { CombatView } from '../items/behavior';
import type { GameEvent, Side } from './events';
import { UNARMED_DAMAGE } from './events';
import { getItemBehavior } from '../items/registry';
import type { ChannelContribution } from './channels';
import { aggregateChannels, type ChannelSet } from './channels';
import { authorAttack, resolveDefense } from './resolution';
import { buildTriggerState, runTriggers, type InvulnState, type EmergencyHealState } from './triggers';
import { stochasticRound } from './mitigation';
import { unseededRng, type Rng } from '../core/rng';

const UNARMED_INTERVAL = 1500;

// Упреждение анимации удара (мс реального времени): анимацию замаха надо стартовать
// раньше применения урона, чтобы кадр «контакта» меча совпал с цифрой/вспышкой/звуком.
// Подбирается под спрайт-лист атаки (где в нём кадр контакта). Капается долей интервала,
// чтобы у быстрого оружия замах не начинался раньше предыдущего удара.
const ATTACK_WINDUP_MS = 160;

// Предохранитель от каскада/петель на одно исходное событие (напр. шипы моба и героя,
// отражающие друг друга — гасится флагом `thorns`, но предохранитель остаётся на всякий случай).
const MAX_CASCADE = 64;

// Канонический порядок слотов для детерминированной сборки таймеров/каналов/стейт-бэга.
// Каналы сами по себе порядок-независимы (сумма/произведение коммутативны) — порядок тут только
// ради стабильности вывода (порядок weaponTimers[] и т.п.), не влияет на исход боя.
const SLOT_ORDER: SlotType[] = ['hand_right', 'hand_left', 'head', 'body', 'legs', 'ring', 'amulet'];

export interface CombatCallbacks {
  onDamageDealt: (target: 'hero' | 'enemy', amount: number, enemyIdx: number, crit?: boolean) => void;
  // Урон полностью отклонён: щит героя (target='hero') или флэт-броня врага в ноль (target='enemy', enemyIdx).
  onBlock: (target: 'hero' | 'enemy', enemyIdx: number) => void;
  // Враг уклонился — входящий удар погашен (enemyIdx — кто уклонился).
  onDodge?: (enemyIdx: number) => void;
  // Герой вылечен (heal с target=hero); amount уже округлён и не выходит за maxHp-прирост.
  onHeal?: (amount: number) => void;
  // Неуязвимость героя полностью погасила удар (docs/content.items.amulet.md); тратит один заряд.
  // Не вызывается, если зарядов не осталось.
  onInvulnHit?: () => void;
  // Контрудар героя: damage(enemy) порождён событием, целью которого был герой (блок/удар) —
  // отличает ответный удар от обычной атаки по расписанию стамины.
  onCounterAttack?: () => void;
  // willReuseSlot=true — противник переходит в следующую форму, графику слота надо сохранить.
  onEnemyDied: (enemy: EnemyState, enemyIdx: number, willReuseSlot: boolean) => void;
  onHeroDied: () => void;
  onFightEnd: () => void;
  onEnemyAttack?: (enemyIdx: number) => void;
  // Замах героя «созрел» — за ATTACK_WINDUP_MS до удара. Презентация: старт анимации атаки.
  onHeroWindup?: () => void;
  // Призван новый враг (по таймеру/порогу HP); сцена дорисовывает его графику.
  onEnemySummoned?: (enemy: EnemyState, enemyIdx: number) => void;
}

/** Разрешает ссылку призыва (`mob_id` + override) в готовый EnemySpec. Движок не лезет в конфиги. */
export type SummonResolver = (ref: SummonRef) => EnemySpec;

/** Каналы героя, построенные один раз из экипировки — единственный источник правды по числовым
 *  статам (крит/блок/броня/шипы/лайфстил/cross-slot модификаторы таймера). */
function buildHeroChannels(equipment: Partial<Record<SlotType, ItemInstance>>): ChannelSet {
  const contributions: ChannelContribution[] = [];
  for (const slot of SLOT_ORDER) {
    const inst = equipment[slot];
    if (!inst) continue;
    contributions.push(...(getItemBehavior(inst.item_id).channels?.(inst.rarity, slot) ?? []));
  }
  return aggregateChannels(contributions);
}

/** Каналы моба, построенные один раз из `MobDefense` (config.json) — тот же резолвер урона
 *  (`resolution.ts:resolveDefense`), что и у героя, параметризованный «чьими каналами». */
function buildEnemyChannels(defense?: MobDefense): ChannelSet {
  const contributions: ChannelContribution[] = [];
  if (defense?.armor) contributions.push({ channel: 'armor_flat', tier: 'flat', value: defense.armor });
  if (defense?.dodge) contributions.push({ channel: 'dodge_chance', tier: 'flat', value: defense.dodge });
  if (defense?.thorns) contributions.push({ channel: 'thorns_flat', tier: 'flat', value: defense.thorns });
  return aggregateChannels(contributions);
}

/**
 * Потоки стамины героя: по одному на надетое оружие (предмет с `weapon()`). `weapon_interval_mult`/
 * `weapon_first_tick_ratio` — cross-slot каналы (напр. перчатки `hand_left` → `hand_right`,
 * см. `docs/content.items.hand_left.md`), читаются из уже собранных каналов героя.
 */
function buildWeaponTimers(equipment: Partial<Record<SlotType, ItemInstance>>, channels: ChannelSet): HeroState['weaponTimers'] {
  // Ни один текущий cross-slot модификатор таймера не зависит от HP/врагов — бутстрап-вью
  // достаточно (см. ChannelContribution.value, динамические вклады сюда пока не заводились).
  const view: CombatView = { heroHp: 100, heroMaxHp: 100, enemies: [], equipment };
  const timers: HeroState['weaponTimers'] = [];
  for (const slot of SLOT_ORDER) {
    const inst = equipment[slot];
    if (!inst) continue;
    const weapon = getItemBehavior(inst.item_id).weapon?.(inst.rarity);
    if (!weapon) continue;
    const intervalMult = channels.query('weapon_interval_mult', view, slot);
    const firstTickRatio = channels.query('weapon_first_tick_ratio', view, slot);
    const interval = weapon.interval * 1000 * intervalMult;
    timers.push({ slot, interval, elapsed: interval * firstTickRatio });
  }
  return timers;
}

export class CombatEngine {
  state: CombatState;
  private cb: CombatCallbacks;
  private phases?: EnemySpec[];
  private currentPhaseIdx = 0;
  private resolveSummon: SummonResolver;
  private rng: Rng;

  constructor(
    state: CombatState,
    callbacks: CombatCallbacks,
    resolveSummon: SummonResolver,
    phases?: EnemySpec[],
    // Единственный сиженный рандом внутри движка — шанс перехода в следующую фазу (см. applyKill).
    // Сцена передаёт сюда сид похода, чтобы рестарт не рероллил переход; симулятору баланса
    // детерминизм не нужен, поэтому дефолт — Math.random.
    rng: Rng = unseededRng,
  ) {
    this.state = state;
    this.cb = callbacks;
    this.resolveSummon = resolveSummon;
    this.phases = phases;
    this.rng = rng;
  }

  update(deltaMs: number) {
    const { state } = this;
    if (state.phase !== 'fighting') return;

    const dt = deltaMs * state.speedMultiplier;

    this.tickHero(dt);
    this.tickEnemies(dt);
  }

  // Цель героя: живой враг в крайней левой занятой ячейке (ближайший к герою).
  // idx — индекс в state.enemies (графика параллельна массиву), выбор — по slot.
  private firstAliveEnemy(): { enemy: EnemyState; idx: number } | null {
    const { enemies } = this.state;
    let best: { enemy: EnemyState; idx: number } | null = null;
    let bestSlot = Infinity;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.hp > 0 && e.slot < bestSlot) { best = { enemy: e, idx: i }; bestSlot = e.slot; }
    }
    return best;
  }

  /** Занятые ячейки доски (живыми врагами). */
  private occupiedSlots(): Set<number> {
    const occ = new Set<number>();
    for (const e of this.state.enemies) if (e.hp > 0) occ.add(e.slot);
    return occ;
  }

  /** Ближайшая свободная ячейка от `from` (тай — левее); null — доска заполнена. */
  private nearestFreeSlot(from: number): number | null {
    const occ = this.occupiedSlots();
    let best: number | null = null;
    let bestDist = Infinity;
    for (let s = 0; s < BOARD_SLOTS; s++) {
      if (occ.has(s)) continue;
      const d = Math.abs(s - from);
      if (d < bestDist) { best = s; bestDist = d; } // ascending s ⇒ при равенстве остаётся левый
    }
    return best;
  }

  // Порог, на котором надо запустить замах: за ATTACK_WINDUP_MS реального времени до удара.
  // elapsed копит уже масштабированное время, поэтому упреждение домножаем на скорость
  // (так зазор замах→удар в реальном времени постоянен), но не больше 60% интервала.
  private windupThreshold(interval: number): number {
    const lead = Math.min(ATTACK_WINDUP_MS * this.state.speedMultiplier, interval * 0.6);
    return interval - lead;
  }

  private tickHero(dt: number) {
    const { hero } = this.state;

    if (hero.weaponTimers.length === 0) {
      const prev = hero.unarmedTimer;
      hero.unarmedTimer += dt;
      const thr = this.windupThreshold(UNARMED_INTERVAL);
      if (prev < thr && hero.unarmedTimer >= thr) this.cb.onHeroWindup?.();
      if (hero.unarmedTimer >= UNARMED_INTERVAL) {
        hero.unarmedTimer = 0;
        const target = this.firstAliveEnemy();
        if (target) {
          this.dispatch({
            type: 'attack_ready',
            source: { side: 'hero' },
            target: { side: 'enemy', id: target.enemy.id, idx: target.idx },
            origin: { from: 'engine' },
          });
        }
      }
      return;
    }

    for (const wt of hero.weaponTimers) {
      const prev = wt.elapsed;
      wt.elapsed += dt;
      const thr = this.windupThreshold(wt.interval);
      if (prev < thr && wt.elapsed >= thr) this.cb.onHeroWindup?.();
      if (wt.elapsed < wt.interval) continue;
      wt.elapsed = 0;
      const target = this.firstAliveEnemy();
      if (!target) continue;
      this.dispatch({
        type: 'attack_ready',
        source: { side: 'hero', slot: wt.slot },
        target: { side: 'enemy', id: target.enemy.id, idx: target.idx },
        origin: { from: 'engine' },
      });
    }
  }

  private tickEnemies(dt: number) {
    const { enemies } = this.state;

    // Кэшируем длину: призыв во время тика дописывает врага в конец, его тикаем уже со след. кадра.
    const n = enemies.length;
    for (let idx = 0; idx < n; idx++) {
      const enemy = enemies[idx];
      if (enemy.hp <= 0) continue;

      for (const timer of enemy.attackTimers) {
        timer.elapsed += dt;
        if (timer.elapsed < timer.interval) continue;
        timer.elapsed = 0;
        this.cb.onEnemyAttack?.(idx);
        // Движок — автор атак врага (предметов у врага нет): эмитим attack напрямую.
        this.dispatch({
          type: 'attack',
          source: { side: 'enemy', id: enemy.id, idx },
          target: { side: 'hero' },
          amount: timer.damage,
          origin: { from: 'engine' },
        });
      }

      this.tickSummons(dt, idx, enemy);
    }
  }

  /** Тик планов призыва живого моба: interval по таймеру, hp по порогу (однократно). */
  private tickSummons(dt: number, idx: number, enemy: EnemyState) {
    for (const plan of enemy.summonPlans) {
      if (plan.trigger.type === 'interval') {
        plan.elapsed += dt;
        if (plan.elapsed >= plan.trigger.every * 1000) {
          plan.elapsed = 0;
          this.fireSummon(idx, enemy, plan);
        }
      } else if (plan.trigger.type === 'hp') {
        if (!plan.fired && enemy.hp <= plan.trigger.at * enemy.maxHp) {
          plan.fired = true;
          this.fireSummon(idx, enemy, plan);
        }
      }
    }
  }

  /** Эмитит `count` отдельных summon-событий (каждое садится в свою свободную ячейку). */
  private fireSummon(idx: number, enemy: EnemyState, plan: SummonPlan) {
    for (let i = 0; i < plan.count; i++) {
      this.dispatch({
        type: 'summon',
        source: { side: 'enemy', id: enemy.id, idx },
        spec: plan.spec,
        position: plan.position,
        origin: { from: 'engine' },
      });
    }
  }

  private buildView(): CombatView {
    const { hero, enemies } = this.state;
    const mainWeapon = hero.equipment.hand_right;
    const mainWeaponBaseDamage = mainWeapon
      ? getItemBehavior(mainWeapon.item_id).weapon?.(mainWeapon.rarity)?.baseDamage
      : undefined;
    return {
      heroHp: hero.hp,
      heroMaxHp: hero.maxHp,
      enemies: enemies.map(e => ({ id: e.id, hp: e.hp, maxHp: e.maxHp, slot: e.slot, isBoss: e.isBoss })),
      equipment: hero.equipment,
      mainWeaponBaseDamage,
    };
  }

  /** Прогоняет событие и весь его каскад: apply(терминал) → follow-up обратно в очередь.
   *  `view` строится один раз на весь каскад одного корневого события (как и раньше) —
   *  хуки/каналы видят снимок HP на МОМЕНТ старта каскада, не обновлённый по ходу. */
  private dispatch(initial: GameEvent) {
    const view = this.buildView();
    const rng = Math.random;
    const queue: GameEvent[] = [initial];

    let iterations = 0;
    while (queue.length > 0) {
      if (++iterations > MAX_CASCADE) {
        console.warn('[combat] event cascade overflow');
        break;
      }
      const event = queue.shift()!;
      queue.push(...this.apply(event, view, rng));
    }
  }

  /** Применяет одно событие к состоянию + UI; возвращает порождённые follow-up события. */
  private apply(e: GameEvent, view: CombatView, rng: () => number): GameEvent[] {
    switch (e.type) {
      case 'attack_ready':
        return this.authorFromReady(e, view, rng);

      case 'attack':
        return [{ type: 'damage', source: e.source, target: e.target, amount: e.amount, raw: e.amount, armorPierce: e.armorPierce, splash: e.splash, crit: e.crit, origin: e.origin }];

      case 'damage':
        return this.handleDamage(e, view, rng);

      case 'block':
        this.cb.onBlock(e.target.side === 'hero' ? 'hero' : 'enemy', e.target.side === 'enemy' ? e.target.idx : -1);
        return [];

      case 'dodge':
        this.cb.onDodge?.(e.target.side === 'enemy' ? e.target.idx : -1);
        return [];

      // Чисто презентационное событие (как block/dodge) — HP не трогает, только UI-колбэк.
      // Спавнится явно триггером buckler рядом с настоящей атакой (см. content.items.hand_left.md).
      case 'counter':
        this.cb.onCounterAttack?.();
        return [];

      case 'heal': {
        if (e.target.side === 'hero') {
          const hero = this.state.hero;
          const requested = Math.max(0, Math.round(e.amount));
          const applied = Math.min(requested, hero.maxHp - hero.hp);
          hero.hp += applied;
          if (applied > 0) this.cb.onHeal?.(applied);
        }
        return [];
      }

      case 'kill':
        return this.applyKill(e.source, e.target);

      case 'summon':
        return this.applySummon(e.source, e.spec, e.position);

      case 'fight_start':
      case 'fight_end':
        return [];
    }
  }

  /** Авторит атаку по `attack_ready`: оружие надетого слота (форма+крит, `resolution.ts`) —
   *  либо дефолт-автор движка (безоружный герой / слот без `weapon()`). */
  private authorFromReady(e: Extract<GameEvent, { type: 'attack_ready' }>, view: CombatView, rng: () => number): GameEvent[] {
    if (e.source.side !== 'hero') return []; // враги никогда не эмитят attack_ready (см. tickEnemies)

    const slot = e.source.slot;
    const inst = slot ? this.state.hero.equipment[slot] : undefined;
    const weapon = inst ? getItemBehavior(inst.item_id).weapon?.(inst.rarity) : undefined;

    if (!weapon) {
      return [{ type: 'attack', source: e.source, target: e.target, amount: UNARMED_DAMAGE, origin: e.origin }];
    }

    const hits = authorAttack(weapon, this.state.hero.channels, e.target, view, rng);
    return hits.map(h => ({
      type: 'attack', source: e.source, target: h.target, amount: h.amount,
      armorPierce: h.armorPierce, splash: h.splash, crit: h.crit, origin: e.origin,
    }));
  }

  /**
   * Резолюция входящего урона: именованные стадии (`resolveDefense`) вместо порядка слотов —
   * dodge → block → % митигация → округление → HP-гейты (инвулн/аварийный хил) → применение к HP
   * → реактивная стадия (шипы/лайфстил/кастомные триггеры). Один путь для обеих сторон
   * (`target.side` выбирает, чьи каналы считать), см. `docs/combat-events.md`.
   */
  private handleDamage(e: Extract<GameEvent, { type: 'damage' }>, view: CombatView, rng: () => number): GameEvent[] {
    const target = e.target;
    const isHero = target.side === 'hero';

    let defenderChannels: ChannelSet;
    if (target.side === 'hero') {
      defenderChannels = this.state.hero.channels;
    } else {
      const enemy = this.state.enemies[target.idx];
      if (!enemy || enemy.hp <= 0) return [];
      defenderChannels = enemy.channels;
    }

    const outcome = resolveDefense(e.amount, e.armorPierce, defenderChannels, isHero, view, rng);
    const rider = !!(e.thorns || e.splash);

    const events: GameEvent[] = [];

    if (outcome.kind === 'dodge') {
      // Дюдж гасит вообще всё для этого удара, включая реактивную стадию (шипы/лайфстил не текут).
      events.push({ type: 'dodge', source: e.source, target: e.target, origin: { from: 'engine' } });
      return events;
    }

    let dealt = 0;

    if (outcome.kind === 'blocked') {
      events.push({ type: 'block', source: e.source, target: e.target, prevented: outcome.prevented, thorns: e.thorns, origin: { from: 'engine' } });
    } else {
      const scaled = isHero && this.state.hero.damageTakenMult !== 1
        ? outcome.amount * this.state.hero.damageTakenMult
        : outcome.amount;
      const dmg = Math.max(0, stochasticRound(scaled, rng));

      if (dmg <= 0) {
        // Пола в 1 урон нет: полностью съеденный удар — «Блок» (кроме риддеров — те гаснут молча,
        // см. stochasticRound doc / было в старом applyDamage).
        if (scaled > 0 && !rider) {
          events.push({ type: 'block', source: e.source, target: e.target, prevented: scaled, origin: { from: 'engine' } });
        }
      } else if (target.side === 'hero' && this.consumeInvuln()) {
        this.cb.onInvulnHit?.();
      } else {
        dealt = dmg;
        if (target.side === 'hero') {
          const hero = this.state.hero;
          hero.hp = Math.max(0, hero.hp - dmg);
          this.cb.onDamageDealt('hero', dmg, -1, e.crit);
        } else {
          const enemy = this.state.enemies[target.idx];
          enemy.hp = Math.max(0, enemy.hp - dmg);
          this.cb.onDamageDealt('enemy', dmg, target.idx, e.crit);
          if (enemy.hp <= 0) {
            events.push({ type: 'kill', source: e.source, target: e.target, origin: { from: 'engine' } });
            const killPct = this.state.hero.channels.query('lifesteal_on_kill_pct', view);
            if (killPct > 0) {
              const heal = Math.round((view.enemies[target.idx]?.maxHp ?? 0) * killPct);
              if (heal > 0) events.push({ type: 'heal', source: { side: 'hero' }, target: { side: 'hero' }, amount: heal, origin: { from: 'engine' } });
            }
          }
        }
      }
    }

    // Реактивная стадия — шипы/лайфстил-за-удар/кастомные триггеры реагируют на сам факт удара
    // независимо от того, что случится с HP защищавшегося дальше (напр. добивающий удар всё равно
    // получает отражение шипов).
    events.push(...this.runReactiveStage(e, dealt, view, rng));

    if (isHero) {
      const hero = this.state.hero;
      if (hero.hp <= 0) {
        this.state.phase = 'dead';
        this.cb.onHeroDied();
      } else {
        this.applyEmergencyHealIfNeeded();
      }
    }

    return events;
  }

  /** Шипы (герой/моб, унаследованный `raw`, анти-цикл `thorns`), лайфстил-за-удар героя и любые
   *  кастомные триггеры экипировки (напр. контрудар `buckler`) — все читают ИСХОДНОЕ событие `e`,
   *  ничего в нём не мутируя (порядок между ними на числовой исход не влияет). */
  private runReactiveStage(e: Extract<GameEvent, { type: 'damage' }>, dealt: number, view: CombatView, rng: () => number): GameEvent[] {
    const events: GameEvent[] = [];
    const raw = e.raw ?? e.amount;
    const target = e.target;
    const isHero = target.side === 'hero';

    if (!e.thorns && raw > 0) {
      if (target.side === 'hero') {
        const flat = this.state.hero.channels.query('thorns_flat', view);
        if (flat > 0) {
          events.push({ type: 'damage', source: { side: 'hero' }, target: e.source, amount: flat, thorns: true, origin: { from: 'engine' } });
        }
      } else if (e.source.side === 'hero') {
        const enemy = this.state.enemies[target.idx];
        const flat = enemy?.channels.query('thorns_flat', view) ?? 0;
        if (flat > 0 && enemy) {
          events.push({ type: 'damage', source: target, target: e.source, amount: flat, thorns: true, origin: { from: 'enemy', id: enemy.id } });
        }
      }
    }

    if (!isHero && e.source.side === 'hero' && dealt > 0 && !e.splash) {
      if (this.state.hero.channels.roll('lifesteal_on_hit_chance', rng, view)) {
        const heal = this.state.hero.channels.query('lifesteal_on_hit_flat', view);
        if (heal > 0) events.push({ type: 'heal', source: e.source, target: { side: 'hero' }, amount: heal, origin: { from: 'engine' } });
      }
    }

    events.push(...runTriggers(this.state.hero.equipment, this.state.hero.triggerState, e, view, rng));
    return events;
  }

  /** Тратит один заряд неуязвимости (первый слот с зарядом>0) — суммарный пул, как раньше
   *  (см. `getInvulnStatus` в triggers.ts для UI-суммы по всей экипировке). */
  private consumeInvuln(): boolean {
    for (const slot of SLOT_ORDER) {
      const inv = this.state.hero.triggerState[slot]?.invuln as InvulnState | undefined;
      if (inv && inv.charges > 0) {
        inv.charges--;
        return true;
      }
    }
    return false;
  }

  private applyEmergencyHealIfNeeded() {
    const hero = this.state.hero;
    for (const slot of SLOT_ORDER) {
      const eh = hero.triggerState[slot]?.emergency_heal as EmergencyHealState | undefined;
      if (!eh || eh.used) continue;
      if (hero.hp / hero.maxHp >= eh.config.thresholdRatio) continue;
      eh.used = true;
      const heal = Math.min(hero.maxHp - hero.hp, Math.round(hero.maxHp * eh.config.healPercent));
      if (heal > 0) {
        hero.hp += heal;
        this.cb.onHeal?.(heal);
      }
      return; // один аварийный хил за бой суммарно (несколько источников не предполагается)
    }
  }

  /**
   * Сажает призванного врага. Ячейка выбирается по явной `position` призыва (приоритет),
   * иначе по стратегии `summonPlacement` призывателя; далее берётся ближайшая свободная
   * к опорной ячейке. Нет свободных ячеек — призыв гасится (лимит доски достигнут).
   */
  private applySummon(source: Side, spec: EnemySpec, position?: number): GameEvent[] {
    const summoner = source.side === 'enemy' ? this.state.enemies[source.idx] : undefined;
    const anchor = position ?? placementAnchor(summoner?.summonPlacement ?? 'nearest', summoner?.slot ?? 0);
    const slot = this.nearestFreeSlot(anchor);
    if (slot === null) return []; // доска заполнена — лимит достигнут
    const enemy = CombatEngine.buildEnemy(spec, slot, this.resolveSummon);
    this.state.enemies.push(enemy);
    this.cb.onEnemySummoned?.(enemy, this.state.enemies.length - 1);
    return [];
  }

  private applyKill(_source: Side, target: Side): GameEvent[] {
    const enemyIdx = target.side === 'enemy' ? target.idx : -1;
    const enemy = this.state.enemies[enemyIdx];
    if (!enemy) return [];

    // Многофазный противник: при «смерти» с шансом переходит в следующую форму.
    if (this.phases) {
      const nextPhaseIdx = (this.currentPhaseIdx ?? 0) + 1;
      const nextPhase = nextPhaseIdx < this.phases.length ? this.phases[nextPhaseIdx] : undefined;
      if (nextPhase && this.rng.frac() < (nextPhase.chance ?? 1)) {
        this.activatePhase(nextPhaseIdx, enemy, enemyIdx);
        return [];
      }
    }

    this.cb.onEnemyDied(enemy, enemyIdx, false);
    // Призывы по смерти: моб «рассыпается» на своём (уже освободившемся) месте.
    // Ставим их синхронно ДО checkFightEnd, иначе доска на миг пуста и бой завершится раньше.
    this.fireDeathSummons(enemyIdx, enemy);
    this.checkFightEnd();
    return [];
  }

  /** Разворачивает планы призыва с триггером `death` павшего моба (каждый — сразу в ячейку). */
  private fireDeathSummons(idx: number, enemy: EnemyState) {
    for (const plan of enemy.summonPlans) {
      if (plan.trigger.type !== 'death') continue;
      for (let i = 0; i < plan.count; i++) {
        this.applySummon({ side: 'enemy', id: enemy.id, idx }, plan.spec, plan.position);
      }
    }
  }

  private activatePhase(phaseIdx: number, oldEnemy: EnemyState, enemyIdx: number) {
    if (!this.phases) return;
    this.currentPhaseIdx = phaseIdx;
    // Новая форма встаёт в ту же ячейку, что и павшая.
    const newEnemy = CombatEngine.buildEnemy(this.phases[phaseIdx], oldEnemy.slot, this.resolveSummon);
    newEnemy.phaseIndex = phaseIdx;
    this.state.enemies[enemyIdx] = newEnemy;
    this.cb.onEnemyDied(oldEnemy, enemyIdx, true);
    this.cb.onDamageDealt('enemy', 0, enemyIdx);
  }

  private checkFightEnd() {
    if (this.state.phase !== 'fighting') return;
    const allDead = this.state.enemies.every(e => e.hp <= 0);
    if (allDead) {
      this.state.phase = 'done';
      this.cb.onFightEnd();
    }
  }

  rebuildWeaponTimers() {
    const hero = this.state.hero;
    hero.channels = buildHeroChannels(hero.equipment);
    hero.weaponTimers = buildWeaponTimers(hero.equipment, hero.channels);
    hero.unarmedTimer = 0;
  }

  static buildInitialHero(equipment: Partial<Record<SlotType, ItemInstance>>, damageTakenMult = 1): HeroState {
    const channels = buildHeroChannels(equipment);
    return {
      maxHp: 100,
      hp: 100,
      equipment,
      weaponTimers: buildWeaponTimers(equipment, channels),
      unarmedTimer: 0,
      channels,
      triggerState: buildTriggerState(equipment),
      damageTakenMult,
    };
  }

  /**
   * Единая сборка противника из нормализованного описания (intervalы в секундах).
   * `slot` — ячейка доски. `resolveSummon` разрешает ссылки призыва в планы (interval/hp);
   * `start`-призывы здесь не разворачиваются — их ставит сцена при старте боя.
   */
  static buildEnemy(spec: EnemySpec, slot: number, resolveSummon: SummonResolver): EnemyState {
    const summonPlans: SummonPlan[] = [];
    for (const ref of spec.summons ?? []) {
      if (ref.trigger.type === 'start') continue;
      summonPlans.push({
        spec: resolveSummon(ref),
        trigger: ref.trigger,
        count: ref.count ?? 1,
        position: ref.position,
        elapsed: 0,
        fired: false,
      });
    }
    return {
      id: spec.id,
      name: spec.name,
      maxHp: spec.health,
      hp: spec.health,
      slot,
      attackTimers: spec.attacks.map(a => ({ damage: a.damage, interval: a.interval * 1000, elapsed: 0 })),
      summonPlans,
      summonPlacement: spec.summon_placement ?? 'nearest',
      defense: spec.defense,
      channels: buildEnemyChannels(spec.defense),
      triggerState: {},
      isBoss: spec.isBoss,
    };
  }
}
