import type { CombatState, EnemyState, HeroState, SummonPlan } from './types';
import { BOARD_SLOTS, placementAnchor } from './types';
import type { EnemySpec, SummonRef } from '../zones/types';
import type { SlotType, ItemInstance } from '../items/types';
import type { CombatView } from '../items/behavior';
import type { GameEvent, Side, Origin, EventResult } from './events';
import { getItemBehavior } from '../items/registry';
import { HANDLER_ORDER, MAX_CASCADE, runPass, stampOrigin } from './dispatcher';

const UNARMED_DAMAGE = 1;
const UNARMED_INTERVAL = 3000;

// Упреждение анимации удара (мс реального времени): анимацию замаха надо стартовать
// раньше применения урона, чтобы кадр «контакта» меча совпал с цифрой/вспышкой/звуком.
// Подбирается под спрайт-лист атаки (где в нём кадр контакта). Капается долей интервала,
// чтобы у быстрого оружия замах не начинался раньше предыдущего удара.
const ATTACK_WINDUP_MS = 160;

export interface CombatCallbacks {
  onDamageDealt: (target: 'hero' | 'enemy', amount: number, enemyIdx: number) => void;
  // Урон полностью отклонён: щит героя (target='hero') или флэт-броня врага в ноль (target='enemy', enemyIdx).
  onBlock: (target: 'hero' | 'enemy', enemyIdx: number) => void;
  // Враг уклонился — входящий удар погашен (enemyIdx — кто уклонился).
  onDodge?: (enemyIdx: number) => void;
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

/** Потоки стамины героя: по одному на надетое оружие (предмет с `attackInterval`). */
function buildWeaponTimers(equipment: Partial<Record<SlotType, ItemInstance>>) {
  const timers: HeroState['weaponTimers'] = [];
  for (const slot of HANDLER_ORDER) {
    const inst = equipment[slot];
    if (!inst) continue;
    const beh = getItemBehavior(inst.item_id);
    if (!beh.attackInterval) continue;
    timers.push({ slot, interval: beh.attackInterval(inst.rarity) * 1000, elapsed: 0 });
  }
  return timers;
}

export class CombatEngine {
  state: CombatState;
  private cb: CombatCallbacks;
  private phases?: EnemySpec[];
  private currentPhaseIdx = 0;
  private resolveSummon: SummonResolver;

  constructor(
    state: CombatState,
    callbacks: CombatCallbacks,
    resolveSummon: SummonResolver,
    phases?: EnemySpec[],
  ) {
    this.state = state;
    this.cb = callbacks;
    this.resolveSummon = resolveSummon;
    this.phases = phases;
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
    return {
      heroHp: hero.hp,
      heroMaxHp: hero.maxHp,
      enemies: enemies.map(e => ({ id: e.id, hp: e.hp, maxHp: e.maxHp, isBoss: e.isBoss })),
      equipment: hero.equipment,
    };
  }

  /** Прогоняет событие и весь его каскад: runPass → apply(терминал) → follow-up в очередь. */
  private dispatch(initial: GameEvent) {
    const equipment = this.state.hero.equipment;
    const ctx = { view: this.buildView(), rng: Math.random };
    const queue: GameEvent[] = [stampOrigin(initial, { from: 'engine' })];

    let iterations = 0;
    while (queue.length > 0) {
      if (++iterations > MAX_CASCADE) {
        console.warn('[combat] event cascade overflow');
        break;
      }
      const event = queue.shift()!;
      const terminals = runPass(event, equipment, ctx, queue, (e, c) => this.enemyDefend(e, c.rng));
      for (const t of terminals) {
        const followups = this.apply(t);
        for (const f of followups) queue.push(stampOrigin(f, { from: 'engine' }, t));
      }
    }
  }

  /**
   * Защита моба-цели на входящий `damage`. Порядок: dodge → armor → thorns.
   * Возвращает `null`, если это не урон по живому врагу с защитой.
   */
  private enemyDefend(e: GameEvent, rng: () => number): { result: EventResult; origin: Origin } | null {
    if (e.type !== 'damage' || e.target.side !== 'enemy') return null;
    const enemy = this.state.enemies[e.target.idx];
    const def = enemy?.defense;
    if (!enemy || enemy.hp <= 0 || !def) return null;

    const origin: Origin = { from: 'enemy', id: enemy.id };

    // dodge — полностью гасит удар (спавнит `dodge` для UI); armor/thorns не применяются.
    if (def.dodge && rng() < def.dodge) {
      return {
        result: { replace: [], spawn: [{ type: 'dodge', source: e.source, target: e.target, origin }] },
        origin,
      };
    }

    // armor — флэт-срез входящего урона.
    const before = e.amount;
    let amount = before;
    if (def.armor) amount = Math.max(0, amount - def.armor);

    const spawn: GameEvent[] = [];

    // Броня свела реальный удар в ноль → полное отклонение (событие `block` для UI «Отражено»).
    if (def.armor && before > 0 && amount === 0) {
      spawn.push({ type: 'block', source: e.source, target: e.target, prevented: before, origin });
    }

    // thorns — отражает фикс в героя за сам факт удара (только на удар героя).
    if (def.thorns && e.source.side === 'hero') {
      spawn.push({
        type: 'damage',
        source: { side: 'enemy', id: enemy.id, idx: e.target.idx },
        target: { side: 'hero' },
        amount: def.thorns,
        origin,
      });
    }

    return {
      result: { replace: [{ ...e, amount }], spawn: spawn.length ? spawn : undefined },
      origin,
    };
  }

  /** Применяет терминальное событие к состоянию + UI; возвращает порождённые follow-up события. */
  private apply(e: GameEvent): GameEvent[] {
    switch (e.type) {
      case 'attack_ready':
        // Дошло до движка нетронутым → дефолт-автор (безоружный герой).
        if (e.source.side === 'hero') {
          return [{ type: 'attack', source: e.source, target: e.target, amount: UNARMED_DAMAGE, origin: e.origin }];
        }
        return [];

      case 'attack':
        return [{ type: 'damage', source: e.source, target: e.target, amount: e.amount, origin: e.origin }];

      case 'damage':
        return this.applyDamage(e.source, e.target, e.amount);

      case 'block':
        this.cb.onBlock(e.target.side === 'hero' ? 'hero' : 'enemy', e.target.side === 'enemy' ? e.target.idx : -1);
        return [];

      case 'dodge':
        this.cb.onDodge?.(e.target.side === 'enemy' ? e.target.idx : -1);
        return [];

      case 'heal':
        if (e.target.side === 'hero') {
          const hero = this.state.hero;
          hero.hp = Math.min(hero.maxHp, hero.hp + Math.max(0, Math.round(e.amount)));
        }
        return [];

      case 'kill':
        return this.applyKill(e.source, e.target);

      case 'summon':
        return this.applySummon(e.source, e.spec, e.position);

      case 'fight_start':
      case 'fight_end':
        return [];
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

  private applyDamage(source: Side, target: Side, rawAmount: number): GameEvent[] {
    const amount = Math.max(0, Math.round(rawAmount));

    if (target.side === 'enemy') {
      const enemy = this.state.enemies[target.idx];
      if (!enemy || enemy.hp <= 0) return [];
      if (amount > 0) {
        enemy.hp = Math.max(0, enemy.hp - amount);
        this.cb.onDamageDealt('enemy', amount, target.idx);
      }
      if (enemy.hp <= 0) {
        return [{ type: 'kill', source, target, origin: { from: 'engine' } }];
      }
      return [];
    }

    // target = hero
    if (amount <= 0) return [];
    const hero = this.state.hero;
    hero.hp = Math.max(0, hero.hp - amount);
    this.cb.onDamageDealt('hero', amount, -1);
    if (hero.hp <= 0) {
      this.state.phase = 'dead';
      this.cb.onHeroDied();
    }
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
      if (nextPhase && Math.random() < (nextPhase.chance ?? 1)) {
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
    this.state.hero.weaponTimers = buildWeaponTimers(this.state.hero.equipment);
    this.state.hero.unarmedTimer = 0;
  }

  static buildInitialHero(equipment: Partial<Record<SlotType, ItemInstance>>): HeroState {
    return {
      maxHp: 100,
      hp: 100,
      equipment,
      weaponTimers: buildWeaponTimers(equipment),
      unarmedTimer: 0,
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
      isBoss: spec.isBoss,
    };
  }
}
