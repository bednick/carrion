import Phaser from 'phaser';
import { FONT_FAMILY } from '../ui/theme';
import { MetaStore } from '../core/MetaStore';
import { EventBus } from '../core/EventBus';
import { getZoneConfig, zoneBgKey, ZONE_BG_VARIANTS, BG_LAYERS, type BgLayer, ZONE_BG_OBJECTS, zoneObjKey, type ScatterLayer } from '../zones/registry';
import { CombatEngine } from '../combat/CombatEngine';
import { rollLootTable, buildRewardOptions, type RewardOption } from '../combat/loot';
import { getInvulnStatus } from '../combat/triggers';
import { getItemBehavior } from '../items/registry';
import { sumMeta } from '../items/meta';
import { spawnFloater } from '../ui/Floater';
import { SoundManager } from '../core/SoundManager';
import { Tooltip } from '../ui/Tooltip';
import { RARITY_COLORS, RARITY_HEX as RARITY_TEXT_COLORS } from '../items/rarity';
import type { CombatState, EnemyState, SummonPlan } from '../combat/types';
import { BOARD_SLOTS, placementAnchor } from '../combat/types';
import type { ItemInstance, SlotId } from '../core/MetaStore';
import { ARMOR_STAND_COUNT } from '../core/MetaStore';
import type { SlotType, EssenceTier } from '../items/types';
import type { ZoneConfig, MobConfig, EnemySpec, PhaseOverride, SummonRef } from '../zones/types';
import { getMobConfig } from '../mobs/registry';
import { slotSilhouetteKey, zoneDecorKey } from '../ui/silhouettes';
import { MOB_MECHANIC_DEFS, MOB_MECHANIC_COLOR_NUM, mobMechanicIconKey, type MechanicId } from '../ui/mobMechanics';
import { addItemIcon, ItemIconView } from '../ui/itemIcon';
import { essenceTag } from '../ui/priceTag';
import { newBadge } from '../ui/newBadge';
import { ESSENCE_TIERS } from '../items/craft';
import { LootPopupStack } from '../ui/LootPopup';
import { QuestTracker } from '../ui/QuestTracker';
import { ResourceHUD } from '../ui/ResourceHUD';
import { VolumeControl } from '../ui/VolumeControl';
import { CX, DX, GAME_W, GAME_H, rightX, panelScale } from '../ui/layout';
import { makeRunSeed, rngFor, type Rng } from '../core/rng';

// Боевая арена выверена в дизайновых 1280 (герой слева, 4 слота мобов справа) — её не пересобираем
// под ширину экрана, а целиком сдвигаем в новый центр на DX. Функция, а не константа: DX
// пересчитывается при ресайзе окна (src/ui/layout.ts).
function heroX(): number {
  return 560 + DX;
}

// Та же палитра, что у характеристик предметов в тултипе (src/items/factories.ts,
// src/items/spiked_cuirass/behavior.ts) — тултип моба должен выглядеть единообразно с ними.
const DMG_COLOR = '#ffcc44';
// Броня/уклон/шипы — тот же цвет, что и у одноимённых гнёзд механик правой колонки
// (единственный источник — MOB_MECHANIC_DEFS, см. src/ui/mobMechanics), чтобы палитра не разъезжалась.
const DEF_COLOR = MOB_MECHANIC_DEFS.find(d => d.id === 'armor')!.color;
const THORNS_COLOR = MOB_MECHANIC_DEFS.find(d => d.id === 'thorns')!.color;

/** Нормализует моба (или его форму-override) в EnemySpec для движка. */
function resolveSpec(ref: PhaseOverride, isBoss: boolean): EnemySpec {
  const base = getMobConfig(ref.id);
  return {
    id: ref.id,
    name: ref.name ?? base.name,
    health: ref.health ?? base.health,
    attacks: ref.attacks ?? base.attacks,
    defense: ref.defense ?? base.defense,
    summons: ref.summons ?? base.summons,
    chance: ref.chance,
    position: base.position,
    summon_placement: base.summon_placement,
    isBoss,
  };
}

/** Полная цепочка форм моба: базовая форма + объявленные в `phases[]`. */
function resolvePhases(rootMobId: string, isBoss: boolean): EnemySpec[] {
  const root = getMobConfig(rootMobId);
  const specs = [resolveSpec({ id: rootMobId }, isBoss)];
  for (const phase of root.phases ?? []) specs.push(resolveSpec(phase, isBoss));
  return specs;
}

/** Разрешает ссылку призыва (`mob_id` + override статов) в готовый EnemySpec. */
function resolveSummonSpec(ref: SummonRef): EnemySpec {
  const base = getMobConfig(ref.mob_id);
  return {
    id: ref.mob_id,
    name: ref.name ?? base.name,
    health: ref.health ?? base.health,
    attacks: ref.attacks ?? base.attacks,
    defense: ref.defense ?? base.defense,
    summons: base.summons,
    summon_placement: base.summon_placement,
    isBoss: false,
  };
}

/**
 * Расставляет противников по ячейкам доски: корневой моб в свою `position` (по умолчанию 0),
 * затем стартовые призывы (`trigger.type === 'start'`) — по явной `position` призыва либо по
 * стратегии `summon_placement` корневого моба, в ближайшую свободную ячейку к опорной.
 * Остальные триггеры (interval/hp) станут планами призыва внутри `buildEnemy`.
 */
function buildBoardEnemies(spec: EnemySpec): EnemyState[] {
  const rootSlot = Math.max(0, Math.min(BOARD_SLOTS - 1, spec.position ?? 0));
  const enemies = [CombatEngine.buildEnemy(spec, rootSlot, resolveSummonSpec)];
  const occupied = new Set<number>([rootSlot]);

  const placement = spec.summon_placement ?? 'nearest';
  for (const summon of spec.summons ?? []) {
    if (summon.trigger.type !== 'start') continue;
    const count = summon.count ?? 1;
    for (let i = 0; i < count; i++) {
      const anchor = summon.position ?? placementAnchor(placement, rootSlot);
      const slot = nearestFreeSlotFrom(anchor, occupied);
      if (slot === null) break; // доска заполнена
      occupied.add(slot);
      enemies.push(CombatEngine.buildEnemy(resolveSummonSpec(summon), slot, resolveSummonSpec));
    }
  }
  return enemies;
}

/** Ближайшая свободная ячейка от `from` среди не занятых в `occupied` (тай — левее). */
function nearestFreeSlotFrom(from: number, occupied: Set<number>): number | null {
  let best: number | null = null;
  let bestDist = Infinity;
  for (let s = 0; s < BOARD_SLOTS; s++) {
    if (occupied.has(s)) continue;
    const d = Math.abs(s - from);
    if (d < bestDist) { best = s; bestDist = d; }
  }
  return best;
}


/**
 * Механики этого моба для гнёзд правой колонки (docs/ui.md «Механики»): защита (`dodge`/`armor`/
 * `thorns`) берётся из уже разрешённого `EnemyState.defense` (тот же источник, что у тултипа моба
 * выше), призыв/фаза — статически из конфига по `id`, т.к. `EnemyState.summonPlans` не хранит
 * `start`-триггеры (их уже развернула сцена при сборке доски) и не хранит `phases` вовсе.
 *
 * Призыв только с `trigger.type: 'start'` в счёт не идёт: такие враги уже стоят на доске в начале
 * боя — с точки зрения игрока это просто «бой начался с несколькими мобами», а не механика призыва
 * посреди боя. Иконка загорается, только если есть хотя бы один интервальный/по HP/посмертный призыв.
 */
function getMobMechanics(e: EnemyState): MechanicId[] {
  const cfg = getMobConfig(e.id);
  const present = new Set<MechanicId>();
  if (e.defense?.dodge) present.add('evade');
  if (e.defense?.armor) present.add('armor');
  if (e.defense?.thorns) present.add('thorns');
  if (cfg.summons?.some(s => s.trigger.type !== 'start')) present.add('summon');
  if (cfg.phases?.length) present.add('phase');
  return MOB_MECHANIC_DEFS.map(d => d.id).filter(id => present.has(id));
}

const EQUIP_SLOTS: SlotId[] = ['head', 'body', 'legs', 'hand_left', 'hand_right', 'ring', 'amulet'];

type EnemyGraphic = {
  baseX: number;
  shadowOuter: Phaser.GameObjects.Ellipse;
  shadowInner: Phaser.GameObjects.Ellipse;
  sprite: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite;
  nameText: Phaser.GameObjects.Text;
  hpBar: Phaser.GameObjects.Rectangle;
  hpFill: Phaser.GameObjects.Rectangle;
  hpText: Phaser.GameObjects.Text;
  atkBars: { fill: Phaser.GameObjects.Rectangle; bg: Phaser.GameObjects.Rectangle }[];
  // Вертикальные полосы призыва (по одной на interval-триггер), заполняются снизу вверх.
  summonBars: { fill: Phaser.GameObjects.Rectangle; bg: Phaser.GameObjects.Rectangle; plan: SummonPlan }[];
};

// Число кадров боевых анимаций (docs/art-spec.md). Ширина кадра считается как width / count.
const CHAR_ANIM_FRAMES: Record<string, number> = {
  idle: 6, walk: 8, attack: 6, hit: 3, block: 3, death: 6,
};

export class ExpeditionScene extends Phaser.Scene {
  private zoneId!: string;
  private zoneCfg!: ZoneConfig;
  private engine: CombatEngine | undefined;

  private fightPlan: ('mob' | 'boss')[] = [];
  private currentFightIdx = 0;
  private totalFights = 0;
  private speedMult = 1;
  private isWalking = false;
  private walkTimer = 0;
  private readonly WALK_DURATION = 1500;
  // Шаги в реальном времени (анимация ходьбы идёт на фиксированных fps, не масштабируется
  // скоростью боя). На событие SoundManager берёт случайный из walking.* вариантов.
  private walkStepTimer = 0;
  private readonly STEP_INTERVAL = 300;

  // Экипировка героя — снимок выбранной стойки, только для просмотра (без drag).
  private equipment: Partial<Record<SlotId, ItemInstance>> = {};
  // Рюкзак похода: всё найденное копится здесь и неприменимо до возвращения в лагерь. При любом
  // выходе из похода (победа/смерть/отступление) содержимое уезжает в сундук — см. dumpBackpackToChest.
  private backpack: ItemInstance[] = [];

  private questTracker!: QuestTracker;
  private resourceHUD!: ResourceHUD;
  private heroHpFill!: Phaser.GameObjects.Rectangle;
  private heroHpText!: Phaser.GameObjects.Text;
  private heroInvulnOverlay!: Phaser.GameObjects.Rectangle;
  private heroInvulnText!: Phaser.GameObjects.Text;
  private heroSprite!: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite;
  private heroAnimPrefix: string | null = null;
  private progressFill!: Phaser.GameObjects.Rectangle;
  private progressText!: Phaser.GameObjects.Text;
  // Текст «Проклятие: N%» по центру под прогресс-баром — только у endless-зон (см. buildProgressBar).
  private curseText?: Phaser.GameObjects.Text;
  private speedBtns: Phaser.GameObjects.Rectangle[] = [];
  private isPaused = false;
  // Отдельно от isPaused: не даёт открыть второй диалог поверх первого повторным кликом
  // по "В лагерь", в т.ч. когда игра уже была на паузе кнопкой/SPACE до этого клика.
  private retreatDialogOpen = false;
  // Награда драфта берётся ровно один раз: scene.start внутри обработчика откладывается до конца
  // кадра, и повторный pointerdown по карточке успел бы начислить предмет второй раз.
  private rewardClaimed = false;
  // Отложенный переход (бой→ходьба, победа, смерть). Тикается в update() и завязан только на
  // isPaused — в отличие от this.time.delayedCall, не замораживается при рассинхроне часов.
  private delayed: { remaining: number; fn: () => void } | null = null;
  private pauseBtn: Phaser.GameObjects.Rectangle | null = null;
  private pauseIcon: Phaser.GameObjects.Text | null = null;
  private bgLayers: { sprite: Phaser.GameObjects.TileSprite; scrollFactor: number; offset: number; layer: BgLayer }[] = [];
  // mid/fore, собранные из отдельных объектов общего пула (см. buildScatterLayer). Каждый объект
  // рендерится двумя копиями (imgA/imgB), сдвинутыми на worldWidth, чтобы скролл был бесшовным без TileSprite.
  private scatterLayers: {
    layer: ScatterLayer; scrollFactor: number; offset: number; worldWidth: number;
    entries: { imgA: Phaser.GameObjects.Image; imgB: Phaser.GameObjects.Image; localX: number }[];
  }[] = [];
  private foreMaskRT: Phaser.GameObjects.RenderTexture | null = null;

  private enemyGraphics: (EnemyGraphic | null)[] = [];

  // Гнёзда механик боя (правая колонка нижней панели, docs/ui.md «Механики»): у каждой механики —
  // своё постоянное место (индекс = позиция в MOB_MECHANIC_DEFS), сбрасываются в onFightEnd/onHeroDeath.
  private mechanicSlots: { bg: Phaser.GameObjects.Rectangle; icon: Phaser.GameObjects.Image }[] = [];
  private discoveredMechanics: Set<MechanicId> = new Set();

  private equipSlotObjs: { bg: Phaser.GameObjects.Rectangle; icon: ItemIconView }[] = [];
  // Заливка перезарядки оружия снизу вверх поверх иконки руки. Child внутри ItemIconView —
  // уничтожается вместе с иконкой в refreshEquipSlots(), поэтому словарь пересобирается
  // целиком в начале buildEquipSlots().
  private weaponChargeOverlays: Partial<Record<SlotId, Phaser.GameObjects.Rectangle>> = {};
  // Ячейки сетки рюкзака (левая колонка нижней панели) — пересобираются на каждую находку.
  private backpackCellObjs: Phaser.GameObjects.GameObject[] = [];
  // Иконки занятых ячеек по индексу предмета в рюкзаке — по ним подсвечивается свежая находка.
  private backpackIconViews: ItemIconView[] = [];
  // Табы смены стойки прямо в походе (1/2/3): выбор активной стойки на лету.
  private standTabs: { bg: Phaser.GameObjects.Rectangle; lbl: Phaser.GameObjects.Text }[] = [];
  private tooltip!: Tooltip;
  private statusText!: Phaser.GameObjects.Text;
  private victoryContainer!: Phaser.GameObjects.Container;
  // Попапы находок над сеткой рюкзака: показывают выпавший предмет, не останавливая поход.
  private lootPopups!: LootPopupStack;

  constructor() {
    super({ key: 'ExpeditionScene' });
  }

  // Кэрриовер при рестарте сцены без выхода из похода — рюкзак и HP. Сейчас единственный
  // такой рестарт — перекладка под новый размер окна, см. relayoutOnResize.
  private carryoverBackpack: ItemInstance[] = [];
  // Текущее здоровье героя переносится при рестарте (не восстанавливается).
  private carryoverHp: number | null = null;
  // План боёв и номер текущего боя — иначе generateFightPlan заново бросит кубик на длину зоны.
  private carryoverPlan: ('mob' | 'boss')[] | null = null;
  private carryoverFightIdx: number | null = null;
  // true — сцена перезапущена внутри уже идущего похода (не новый заход в зону).
  private resumed = false;
  // Сид похода: из него выводятся моб, лут, драфт, фазы, длина зоны и фон (src/core/rng.ts).
  // Переживает рестарт сцены — иначе F11 посреди боя рероллил бы противника и добычу.
  private runSeed = '';
  // Индекс стойки-пресета, с которой герой ушёл в поход (0..2).
  private standIndex = 0;

  init(data: {
    zoneId: string; standIndex?: number; speedMult?: number;
    carryoverBackpack?: ItemInstance[]; carryoverHp?: number;
    carryoverPlan?: ('mob' | 'boss')[]; carryoverFightIdx?: number; resumed?: boolean;
    seed?: string;
  }) {
    this.zoneId = data.zoneId ?? 'dead-fields';
    // Заходим с последней выбранной стойкой (на стенде или в прошлом бою); её можно сменить в бою.
    this.standIndex = data.standIndex ?? MetaStore.getActiveStand();
    // Свежий поход стартует с ускорением прошлого забега; на переходе между зонами
    // приходит явный speedMult (carryover) и имеет приоритет.
    this.speedMult = data.speedMult ?? MetaStore.getRunSpeed();
    this.carryoverBackpack = data.carryoverBackpack ?? [];
    this.carryoverHp = data.carryoverHp ?? null;
    this.carryoverPlan = data.carryoverPlan ?? null;
    this.carryoverFightIdx = data.carryoverFightIdx ?? null;
    this.resumed = data.resumed ?? false;
    this.runSeed = data.seed ?? makeRunSeed();
    this.retreatDialogOpen = false;
  }

  /**
   * Ресайз окна (чаще всего F11) сменил ширину холста — пересобираем сцену под новую раскладку,
   * не выбрасывая игрока из похода. Переживают рестарт: рюкзак, открытая модалка находки, HP героя,
   * скорость, стойка, длина зоны, номер боя и сид. Текущий бой начинается заново, но противник,
   * его лут и фон зоны те же — они выводятся из сида (src/core/rng.ts), рероллить их нельзя.
   */
  relayoutOnResize() {
    this.scene.restart({
      zoneId: this.zoneId,
      standIndex: this.standIndex,
      speedMult: this.speedMult,
      carryoverBackpack: [...this.backpack],
      carryoverHp: this.engine?.state.hero.hp,
      carryoverPlan: this.fightPlan,
      carryoverFightIdx: this.currentFightIdx,
      resumed: true,
      seed: this.runSeed,
    });
  }

  create() {
    this.engine = undefined;
    this.isWalking = false;
    this.walkTimer = 0;
    this.walkStepTimer = 0;
    this.backpack = [];
    this.backpackCellObjs = [];
    this.backpackIconViews = [];
    this.equipSlotObjs = [];
    this.standTabs = [];
    this.enemyGraphics = [];
    this.curseText = undefined;
    this.isPaused = false;
    this.rewardClaimed = false;
    // Часы сцены переживают её рестарт — не оставляем this.time замороженным между прогонами.
    this.time.paused = false;
    this.delayed = null;
    this.pauseBtn = null;
    this.pauseIcon = null;
    this.bgLayers = [];
    this.scatterLayers = [];
    this.foreMaskRT = null;

    this.zoneCfg = getZoneConfig(this.zoneId);
    EventBus.emit('expedition_started');
    // Счётчик заходов: рестарт сцены внутри идущего похода (перекладка под новый размер окна) —
    // это та же экспедиция, повторно не считаем.
    if (!this.resumed) MetaStore.recordZoneEntered(this.zoneId);

    // Фоновый эмбиент похода (один и тот же для всех зон). Заменяет лагерные слои;
    // при возврате в лагерь CampScene перебьёт его своим набором.
    SoundManager.playMusicLayers([{ key: 'amb_draft', volume: 0.2 }]);

    this.events.once('shutdown', () => {
      // На случай выхода из сцены в состоянии паузы — не оставляем глобальный
      // менеджер анимаций замороженным для следующей сцены.
      this.anims.resumeAll();
      EventBus.off('quest_completed', this.onQuestCompleted, this);
      this.resourceHUD.destroy();
      this.lootPopups.destroy();
    });
    this.input.keyboard!.on('keydown-SPACE', () => {
      if (this.isPaused) this.resume(); else this.pause();
    });
    const speeds = [1, 2, 4];
    ['ONE', 'TWO', 'THREE'].forEach((key, i) => {
      this.input.keyboard!.on(`keydown-${key}`, () => {
        this.speedMult = speeds[i];
        MetaStore.setRunSpeed(speeds[i]);
        if (this.engine) this.engine.state.speedMultiplier = speeds[i];
        this.speedBtns.forEach((b, idx) => b.setFillStyle(idx === i ? 0x2244aa : 0x222233));
      });
    });
    this.initEquipmentFromStand();
    this.generateFightPlan();
    this.buildUI();
    new VolumeControl(this);
    this.resourceHUD = new ResourceHUD(this, this.tooltip);
    this.questTracker = new QuestTracker(this);
    EventBus.on('quest_completed', this.onQuestCompleted, this);
    // Перенос рюкзака при рестарте под новый размер окна.
    this.backpack = [...this.carryoverBackpack];
    this.carryoverBackpack = [];
    this.refreshBackpackGrid();

    this.startNextFight();
  }

  private initEquipmentFromStand() {
    const stand = MetaStore.getResolvedArmorStand(this.standIndex);
    for (const slot of EQUIP_SLOTS) {
      this.equipment[slot] = stand[slot] ?? undefined;
    }
  }

  private generateFightPlan() {
    // Рестарт внутри идущего похода (перекладка под новый размер окна) — план и номер боя пришли
    // готовыми, кубик на длину зоны бросать заново нельзя. Для endless-зоны план пуст, но номер боя
    // (глубина и уровень проклятья) всё равно переносится.
    if (this.carryoverFightIdx !== null) {
      this.fightPlan = this.carryoverPlan ?? [];
      this.totalFights = this.zoneCfg.endless ? 0 : this.fightPlan.length;
      this.currentFightIdx = this.carryoverFightIdx;
      this.carryoverPlan = null;
      this.carryoverFightIdx = null;
      return;
    }

    // Endless-зона (см. docs/content.zones.format.md) — рядовые бои идут без предела, fightPlan
    // не строим вовсе (см. startNextFight/beginFight/onFightEnd, ветка this.zoneCfg.endless).
    if (this.zoneCfg.endless) {
      this.totalFights = 0;
      this.fightPlan = [];
      this.currentFightIdx = 0;
      return;
    }

    // Boss-only зона (пустой mob_pool или нет mob_loot) ⇒ рядовых боёв нет, сразу босс.
    const hasMobs = (this.zoneCfg.mob_pool?.length ?? 0) > 0 && !!this.zoneCfg.mob_loot;
    let count = 0;
    if (hasMobs && this.zoneCfg.fights) {
      const { min, max } = this.zoneCfg.fights;
      const base = rngFor(this.runSeed, 'plan').int(min, max);
      // Длина забега ± модификатор обуви (фиксируется при старте), минимум 1 рядовой бой (§4.D).
      count = Math.max(1, base + sumMeta(this.equipment).fightDelta);
    }
    this.totalFights = count + 1;
    this.fightPlan = [...Array(count).fill('mob'), 'boss'] as ('mob' | 'boss')[];
    this.currentFightIdx = 0;
  }

  private buildUI() {
    this.add.rectangle(CX, 400, GAME_W, GAME_H, 0x111122).setDepth(-10);
    this.tooltip = new Tooltip(this);
    this.buildProgressBar();
    this.buildBattleArea();
    this.buildBottomPanel();
    this.buildSpeedControls();
    this.buildStatusText();
    this.victoryContainer = this.add.container(0, 0).setDepth(100).setVisible(false);
  }

  private buildProgressBar() {
    this.add.text(CX, 10, this.zoneCfg.name, {
      fontSize: '16px', fontFamily: FONT_FAMILY, color: '#cccccc',
    }).setOrigin(0.5, 0).setDepth(2);

    const barW = 864;
    const barX = CX - barW / 2;
    const barY = 44;
    const barH = 16;

    this.add.rectangle(barX + barW / 2, barY + barH / 2, barW, barH, 0x222233).setStrokeStyle(1, 0x444455).setDepth(2);
    this.progressFill = this.add.rectangle(barX, barY + barH / 2, 4, barH - 4, 0x4488cc).setOrigin(0, 0.5).setDepth(2);
    this.progressText = this.add.text(CX, barY + barH / 2, '', {
      fontSize: '12px', fontFamily: FONT_FAMILY, color: '#aaaaaa',
    }).setOrigin(0.5).setDepth(2);

    // Уровень проклятья зоны (endless, docs/content.zones.format.md) — по центру, под прогрессом.
    if (this.zoneCfg.endless) {
      const curseY = barY + barH + 14;
      this.curseText = this.add.text(CX, curseY, '', {
        fontSize: '12px', fontFamily: FONT_FAMILY, color: '#cc88ff',
      }).setOrigin(0.5).setDepth(2).setInteractive({ useHandCursor: false });
      this.curseText.on('pointerover', () => {
        const pct = Math.round(this.zoneCfg.endless!.curse_per_fight * this.currentFightIdx);
        this.tooltip.showLines([
          { text: 'Уровень проклятья зоны', color: '#cc88ff' },
          { text: `Входящий по персонажу урон увеличен на ${pct}%`, color: '#bbbbbb' },
        ], CX - 110, curseY + 10);
      });
      this.curseText.on('pointerout', () => this.tooltip.hide());
      this.updateCurseReadout();
    }
  }

  private updateProgressBar() {
    if (this.zoneCfg.endless) {
      // Нет предела длины — заливку прогресса скрываем (делить не на что), только счётчик боёв.
      this.progressFill.setVisible(false);
      this.progressText.setText(`Бой ${this.currentFightIdx} из ???`);
      return;
    }
    const maxW = 864;
    // Босс не входит в счётчик рядовых боёв: полоска заполняется целиком, текст меняется.
    const isBossFight = this.fightPlan[this.currentFightIdx] !== 'mob';
    if (isBossFight) {
      this.progressFill.setSize(maxW, 14);
      this.progressText.setText('Босс локации!');
      return;
    }
    const mobTotal = this.totalFights - 1;
    const progress = this.currentFightIdx / mobTotal;
    this.progressFill.setSize(Math.max(4, progress * maxW), 14);
    this.progressText.setText(`Бой ${this.currentFightIdx} / ${mobTotal}`);
  }

  private buildBattleArea() {
    const folder = this.zoneCfg.id;
    if (ZONE_BG_VARIANTS[folder] && this.textures.exists(zoneBgKey(folder, 'far', 1))) {
      this.buildParallaxBackground(folder);
    } else {
      this.add.rectangle(CX, 200, GAME_W, 320, 0x8899aa).setDepth(-3);
    }
    // Дно арены = верх нижней панели (PANEL_TOP): своя линия не нужна, границу рисует рамка панели.
    const hx = heroX();
    // Двухслойная тень героя — та же схема, что у мобов (см. addEnemyGraphic). Ширина от HERO_W=100.
    const heroShW = 100 * 0.8;
    this.add.ellipse(hx, 287, heroShW * 1.1, 16 * 1.1, 0x000000, 0.22).setDepth(4);
    this.add.ellipse(hx, 287, heroShW * 0.9, 16 * 0.9, 0x000000, 0.45).setDepth(4);
    // Единственный герой — Силач.
    const animPrefix = 'char-strongman';
    if (this.textures.exists(`${animPrefix}-idle`)) {
      if (!this.anims.exists(`${animPrefix}-idle`)) {
        for (const [anim, count] of Object.entries(CHAR_ANIM_FRAMES)) {
          if (this.textures.exists(`${animPrefix}-${anim}`)) this.sliceCharSheet(`${animPrefix}-${anim}`, count);
        }
        this.anims.create({ key: `${animPrefix}-idle`,   frames: this.anims.generateFrameNumbers(`${animPrefix}-idle`,   {}), frameRate: 8,  repeat: -1 });
        this.anims.create({ key: `${animPrefix}-walk`,   frames: this.anims.generateFrameNumbers(`${animPrefix}-walk`,   {}), frameRate: 10, repeat: -1 });
        // frameRate ×2 относительно «естественного» 12 — держит замах короче COMBAT_TIME_SCALE-
        // укороченных интервалов оружия (см. src/combat/CombatEngine.ts), иначе быстрое оружие на
        // высокой редкости перезапускает анимацию на середине свинга.
        this.anims.create({ key: `${animPrefix}-attack`, frames: this.anims.generateFrameNumbers(`${animPrefix}-attack`, {}), frameRate: 24, repeat: 0 });
        this.anims.create({ key: `${animPrefix}-hit`,    frames: this.anims.generateFrameNumbers(`${animPrefix}-hit`,    {}), frameRate: 10, repeat: 0 });
        if (this.textures.exists(`${animPrefix}-death`))
          this.anims.create({ key: `${animPrefix}-death`, frames: this.anims.generateFrameNumbers(`${animPrefix}-death`, {}), frameRate: 9, repeat: 0 });
      }
      const HERO_W = 100, HERO_H = 140;
      const spr = this.add.sprite(hx, 219, `${animPrefix}-idle`).setDisplaySize(HERO_W, HERO_H).setDepth(5);
      spr.play(`${animPrefix}-idle`);
      spr.on('animationcomplete', (anim: Phaser.Animations.Animation) => {
        // death — терминальная: остаётся на последнем кадре, не возвращаемся в idle
        if (anim.key !== `${animPrefix}-idle` && anim.key !== `${animPrefix}-death`) {
          spr.play(`${animPrefix}-idle`);
          spr.setDisplaySize(HERO_W, HERO_H);
        }
      });
      this.heroSprite = spr;
      this.heroAnimPrefix = animPrefix;
    } else {
      this.heroSprite = this.add.rectangle(hx, 219, 64, 90, 0x4488aa).setDepth(5);
      this.add.text(hx, 219, 'С', {
        fontSize: '28px', fontFamily: FONT_FAMILY, color: '#ffffff',
      }).setOrigin(0.5).setDepth(6);
    }

    this.add.rectangle(hx, 310, 80, 10, 0x333333).setOrigin(0.5);
    this.heroHpFill = this.add.rectangle(hx - 40, 310, 80, 10, 0x44aa44).setOrigin(0, 0.5);
    // Неуязвимость (docs/content.items.amulet.md) — полупрозрачный оверлей поверх HP-бара, видна
    // только пока остались заряды; счётчик ударов — слева от бара.
    this.heroInvulnOverlay = this.add.rectangle(hx - 40, 310, 0, 10, 0x66ccff, 0.45).setOrigin(0, 0.5);
    this.heroHpText = this.add.text(hx, 323, '', { fontSize: '12px', fontFamily: FONT_FAMILY, color: '#aaffaa' }).setOrigin(0.5);
    this.heroInvulnText = this.add.text(hx - 46, 310, '', { fontSize: '14px', fontFamily: FONT_FAMILY, color: '#66ccff' }).setOrigin(1, 0.5);

    this.updateHeroHpBar();
  }

  // Параллакс-фон зоны боя. Слои уложены по глубине ниже бойцов (отрицательная depth),
  // чтобы не трогать depth существующих HP/ATK-баров. Позиции/высоты — подбираемые.
  // Параметры рендера каждого слоя (позиция/высота/глубина/скорость/масштаб/передний план).
  // far — небо (медленно, сзади); mid — дальние силуэты за героем; near — пол (скорость героя);
  // fore — передний план перед всем (быстро, прячется в бою).
  // fitH — высота, под которую масштабируется текстура (по умолчанию = h). Если задана и больше h,
  // слой рисуется в полную «глубину» fitH, но окно высотой h показывает только верхнюю часть, обрезая низ.
  private static readonly LAYER_RENDER: Record<BgLayer, {
    cy: number; h: number; depth: number; scroll: number; scale?: number; fitH?: number;
  }> = {
    // far поднят над землёй (низ ≈ near.top=256) и масштабируется целиком под высоту окна (216px),
    // пропорции сохраняются (tileScaleX==tileScaleY), низ не обрезается — картинка просто меньше.
    far:  { cy: 148, h: 216, depth: -3, scroll: 0.20 },
    mid:  { cy: 210, h: 150, depth: -2, scroll: 0.50 },
    near: { cy: 308, h: 104, depth: -1, scroll: 1.00, scale: 0.36 },
    // Низ fore = 285+75 = 360 = дно арены (PANEL_TOP, литерал — статик-поле объявлено ниже и на этот
    // момент ещё не инициализировано). Это же значение — «линия земли» для scatter-силуэтов
    // (buildScatterLayer: groundY = cy + h/2), поэтому они стоят на полу, а не висят над панелью.
    fore: { cy: 285, h: 150, depth:  8, scroll: 1.50 },
  };

  // Пер-зональный оверрайд скорости параллакса слоёв (по умолчанию берётся scroll из LAYER_RENDER).
  // Склеп — интерьер: стены вплотную, поэтому дальний слой едет со скоростью земли (без параллакса),
  // создавая ощущение замкнутого помещения, а не открытого пространства.
  private static readonly ZONE_LAYER_SCROLL: Record<string, Partial<Record<BgLayer, number>>> = {
    crypt: { far: 1.0 },
  };

  private buildParallaxBackground(folder: string) {
    const variants = ZONE_BG_VARIANTS[folder];
    if (!variants) return;
    // Вариант слоя — из сида похода: при рестарте сцены зона не должна перерисовываться другой.
    const bgRng = rngFor(this.runSeed, 'bg');
    for (const layer of BG_LAYERS) {
      const count = variants[layer];
      if (!count) continue;
      const variant = bgRng.int(1, count);
      const key = zoneBgKey(folder, layer, variant);
      if (!this.textures.exists(key)) continue;

      const r = ExpeditionScene.LAYER_RENDER[layer];
      const scroll = ExpeditionScene.ZONE_LAYER_SCROLL[folder]?.[layer] ?? r.scroll;
      const src = this.textures.get(key).getSourceImage() as HTMLImageElement;
      const scale = r.scale ?? (r.fitH ?? r.h) / src.height;
      const ts = this.add.tileSprite(CX, r.cy, GAME_W, r.h, key).setDepth(r.depth);
      ts.tileScaleX = scale;
      ts.tileScaleY = scale;
      this.bgLayers.push({ sprite: ts, scrollFactor: scroll, offset: 0, layer });
    }

    const objLayers = ZONE_BG_OBJECTS[folder];
    if (objLayers) {
      for (const layer of ['mid', 'fore'] as ScatterLayer[]) {
        if (objLayers[layer]) this.buildScatterLayer(folder, layer);
      }
    }

    const foreSprites: (Phaser.GameObjects.TileSprite | Phaser.GameObjects.Image)[] = [
      ...this.bgLayers.filter(l => l.layer === 'fore').map(l => l.sprite),
      ...this.scatterLayers.filter(l => l.layer === 'fore').flatMap(l => l.entries.flatMap(e => [e.imgA, e.imgB])),
    ];
    this.buildForeMask(foreSprites);
  }

  // Диапазон числа объектов и целевой высоты (доля от h слоя) на mid/fore-полосу — случайного размера
  // и расстояния между силуэтами добиваемся тасовкой пула и джиттером позиций (см. buildScatterLayer).
  private static readonly SCATTER_COUNT: Record<ScatterLayer, [number, number]> = {
    mid: [5, 7],
    fore: [4, 6],
  };
  private static readonly SCATTER_SCALE: Record<ScatterLayer, [number, number]> = {
    mid: [0.5, 0.9],
    fore: [0.55, 1.0],
  };
  // Период бесшовного повтора scatter-слоёв (аналог тайлинга TileSprite, но руками — см. scrollBackground).
  // Должен быть заметно шире экрана, иначе на широком холсте виден период повтора. Метод, а не константа:
  // GAME_W пересчитывается при ресайзе окна (src/ui/layout.ts).
  private scatterWorldWidth(): number {
    return Math.max(1600, GAME_W + 320);
  }

  // Раскладывает пул объектов зоны (ZONE_BG_OBJECTS) в случайную последовательность: тасовка, случайный
  // размер (в пределах SCATTER_SCALE от h слоя) и случайный джиттер расстояния между объектами.
  // Каждый объект — 2 Image (imgA/imgB, сдвинутые на worldWidth) для бесшовного скролла без TileSprite.
  private buildScatterLayer(folder: string, layer: ScatterLayer) {
    const slugs = ZONE_BG_OBJECTS[folder]?.[layer];
    if (!slugs || slugs.length === 0) return;

    const r = ExpeditionScene.LAYER_RENDER[layer];
    const scroll = ExpeditionScene.ZONE_LAYER_SCROLL[folder]?.[layer] ?? r.scroll;
    const worldWidth = this.scatterWorldWidth();
    const [minCount, maxCount] = ExpeditionScene.SCATTER_COUNT[layer];
    // Раскладка силуэтов — тоже из сида, чтобы рестарт сцены не перетасовал пейзаж под игроком.
    const rng = rngFor(this.runSeed, 'scatter', layer);
    const count = rng.int(minCount, maxCount);
    const [minScale, maxScale] = ExpeditionScene.SCATTER_SCALE[layer];
    const groundY = r.cy + r.h / 2; // нижняя граница слоя — «линия земли» для силуэтов
    const baseSpacing = worldWidth / count;

    const sequence = this.pickScatterSequence(slugs, count, layer === 'mid', rng);
    const entries: { imgA: Phaser.GameObjects.Image; imgB: Phaser.GameObjects.Image; localX: number }[] = [];

    sequence.forEach((slug, i) => {
      const key = zoneObjKey(layer, slug);
      if (!this.textures.exists(key)) return;
      const src = this.textures.get(key).getSourceImage() as HTMLImageElement;
      const targetH = rng.float(minScale, maxScale) * r.h;
      const scale = targetH / src.height;
      const jitter = rng.float(-0.3, 0.3) * baseSpacing;
      const localX = i * baseSpacing + baseSpacing / 2 + jitter;

      const imgA = this.add.image(localX, groundY, key).setOrigin(0.5, 1).setScale(scale).setDepth(r.depth);
      const imgB = this.add.image(localX - worldWidth, groundY, key).setOrigin(0.5, 1).setScale(scale).setDepth(r.depth);
      entries.push({ imgA, imgB, localX });
    });

    this.scatterLayers.push({ layer, scrollFactor: scroll, offset: 0, worldWidth, entries });
  }

  // Тасует пул в последовательность длины count. mid — без соседних повторов (силуэты на горизонте
  // не должны дублироваться, style-guide), fore — повторы допустимы (объекты ближе, пул может быть меньше).
  private pickScatterSequence(slugs: string[], count: number, avoidAdjacentRepeat: boolean, rng: Rng): string[] {
    const seq: string[] = [];
    let pool = rng.shuffle(slugs);
    let idx = 0;
    for (let i = 0; i < count; i++) {
      if (idx >= pool.length) { pool = rng.shuffle(slugs); idx = 0; }
      if (avoidAdjacentRepeat && seq.length > 0 && seq[seq.length - 1] === pool[idx] && idx + 1 < pool.length) {
        [pool[idx], pool[idx + 1]] = [pool[idx + 1], pool[idx]];
      }
      seq.push(pool[idx]);
      idx++;
    }
    return seq;
  }

  // Радиальная кисть-«дыра» (создаётся один раз): альфа 0.9 в центре → 0 к краю.
  private ensureHoleBrush() {
    const R = 256, STRENGTH = 0.9;
    if (this.textures.exists('fore-hole-brush')) return;
    const cv = this.textures.createCanvas('fore-hole-brush', R * 2, R * 2);
    if (!cv) return;
    const ctx = cv.getContext();
    const g = ctx.createRadialGradient(R, R, 0, R, R, R);
    g.addColorStop(0, `rgba(255,255,255,${STRENGTH})`);
    g.addColorStop(0.5, `rgba(255,255,255,${STRENGTH * 0.7})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, R * 2, R * 2);
    cv.refresh();
  }

  // Маска переднего плана: fore почти прозрачен (~10%) в мягких овалах вокруг героя и врагов,
  // оставаясь видимым по краям. fore скроллится сквозь статичную маску.
  private buildForeMask(foreSprites: (Phaser.GameObjects.TileSprite | Phaser.GameObjects.Image)[]) {
    if (foreSprites.length === 0) return;
    this.ensureHoleBrush();
    const rt = this.add.renderTexture(CX, 400, GAME_W, GAME_H).setVisible(false);
    this.foreMaskRT = rt;
    const mask = rt.createBitmapMask();
    for (const fs of foreSprites) fs.setMask(mask);
    this.updateForeMask();
  }

  // Перерисовывает «дыры»: вокруг героя (heroX) и каждого живого врага.
  private updateForeMask() {
    const rt = this.foreMaskRT;
    if (!rt) return;
    const HOLE_Y = 250, HOLE_RX = 120, HOLE_RY = 150, R = 256;
    rt.fill(0xffffff, 1);
    const stamp = (x: number) => {
      const brush = this.make.image({ key: 'fore-hole-brush', add: false }).setScale(HOLE_RX / R, HOLE_RY / R);
      rt.erase(brush, x, HOLE_Y);
      brush.destroy();
    };
    stamp(heroX());
    for (const g of this.enemyGraphics) {
      if (g) stamp(g.sprite.x);
    }
  }

  // Скролл слоёв во время ходьбы. Скорость — в экранных px/с (база для near=1.0), делится на
  // tileScaleX (tilePositionX — в пикселях текстуры). tilePositionX округляем до целого, иначе
  // дробная выборка даёт мельтешение даже при NEAREST.
  private scrollBackground(dtMs: number) {
    const BASE_PX_PER_SEC = 120;
    for (const l of this.bgLayers) {
      l.offset += (BASE_PX_PER_SEC * l.scrollFactor * (dtMs / 1000)) / l.sprite.tileScaleX;
      l.sprite.tilePositionX = Math.round(l.offset);
    }
    // Scatter-слои (mid/fore) — координаты уже в экранных пикселях (без tileScaleX), заворачиваем
    // каждый объект по модулю worldWidth и рисуем два сдвинутых экземпляра для бесшовности.
    for (const l of this.scatterLayers) {
      l.offset += BASE_PX_PER_SEC * l.scrollFactor * (dtMs / 1000);
      for (const e of l.entries) {
        const wrapped = Phaser.Math.Wrap(e.localX - l.offset, 0, l.worldWidth);
        e.imgA.x = wrapped;
        e.imgB.x = wrapped - l.worldWidth;
      }
    }
  }

  private updateHeroHpBar() {
    if (!this.engine) return;
    const { hp, maxHp, triggerState } = this.engine.state.hero;
    const ratio = hp / maxHp;
    this.heroHpFill.setSize(80 * ratio, 10);
    this.heroHpText.setText(`${hp}/${maxHp}`);

    const { hits: invulnHits, max: invulnHitsMax } = getInvulnStatus(triggerState);
    const hasInvuln = invulnHitsMax > 0 && invulnHits > 0;
    this.heroInvulnOverlay.setVisible(hasInvuln);
    if (hasInvuln) this.heroInvulnOverlay.setSize(this.heroHpFill.width, 10);
    this.heroInvulnText.setText(hasInvuln ? String(invulnHits) : '');
  }

  // Заливка снизу вверх поверх иконки оружия в руке — прогресс до следующей атаки этим
  // оружием. Независимая для hand_left/hand_right (два кинжала считаются раздельно).
  private updateWeaponChargeOverlays() {
    // engine.update() выше по кадру мог синхронно завершить бой (onFightEnd/onHeroDeath →
    // resetWeaponChargeOverlays), но сам вызов этого метода уже был запланирован в этом же
    // кадре — без проверки фазы он тут же перезаписал бы свежий сброс старыми weaponTimers.
    if (this.engine!.state.phase !== 'fighting') return;
    const { hero } = this.engine!.state;
    (['hand_left', 'hand_right'] as const).forEach(slot => {
      const overlay = this.weaponChargeOverlays[slot];
      if (!overlay) return;
      const t = hero.weaponTimers.find(w => w.slot === slot);
      const ratio = t ? Math.min(1, t.elapsed / t.interval) : 0;
      overlay.setSize(overlay.width, overlay.width * ratio);
    });
  }

  // Сброс к 0 сразу по окончании боя (победа/поражение) и повторно в начале следующего —
  // equipSlotObjs (и оверлеи) не пересобираются между боями, поэтому без явного сброса
  // заливка застыла бы на последнем значении на время тоста/анимации между боями.
  private resetWeaponChargeOverlays() {
    for (const overlay of Object.values(this.weaponChargeOverlays)) {
      overlay?.setSize(overlay.width, 0);
    }
  }

  private clearEnemyGraphics() {
    for (const g of this.enemyGraphics) {
      if (!g) continue;
      // Спрайт уходит без pointerout — снимаем его тултип, если показан именно он.
      this.tooltip.hideFor(g.sprite);
      g.shadowOuter.destroy();
      g.shadowInner.destroy();
      g.sprite.destroy();
      g.nameText.destroy();
      g.hpBar.destroy();
      g.hpFill.destroy();
      g.hpText.destroy();
      g.atkBars.forEach(b => { b.bg.destroy(); b.fill.destroy(); });
      g.summonBars.forEach(b => { b.bg.destroy(); b.fill.destroy(); });
    }
    this.enemyGraphics = [];
  }

  // Плавно убирает модельку и бары павшего врага и освобождает слот (null).
  private removeEnemyGraphics(idx: number) {
    const g = this.enemyGraphics[idx];
    if (!g) return;
    this.enemyGraphics[idx] = null;
    // Труп затухает 300 мс — за это время он не должен ловить наведение и показывать статы.
    g.sprite.disableInteractive();
    const objs: Phaser.GameObjects.GameObject[] = [
      g.shadowOuter, g.shadowInner, g.sprite, g.nameText, g.hpBar, g.hpFill, g.hpText,
      ...g.atkBars.flatMap(b => [b.bg, b.fill]),
      ...g.summonBars.flatMap(b => [b.bg, b.fill]),
    ];
    this.tweens.add({
      targets: objs,
      alpha: 0,
      duration: 300,
      onComplete: () => objs.forEach(o => o.destroy()),
    });
  }

  // Экранный x ячейки доски: 4 слота с шагом 160 (700, 860, 1020, 1180 в дизайновых 1280) + сдвиг арены.
  private slotX(slot: number): number {
    return 700 + slot * 160 + DX;
  }

  private buildEnemyGraphics(enemies: EnemyState[]) {
    this.clearEnemyGraphics();
    for (let i = 0; i < enemies.length; i++) {
      if (enemies[i].hp > 0) this.addEnemyGraphic(enemies[i], i);
      else this.enemyGraphics.push(null); // павший — держим дырку для параллельности с массивом
    }
    this.updateForeMask();
  }

  /** Строит графику одного врага в ячейке `e.slot` и кладёт её в enemyGraphics[idx]. */
  private addEnemyGraphic(e: EnemyState, idx: number) {
    {
      MetaStore.recordMobEncountered(e.id);
      this.registerMobMechanics(e);
      const x = this.slotX(e.slot);
      const color = e.isBoss ? 0xaa4422 : 0x884422;

      // Спрайт моба (вписан в бокс с сохранением пропорций, ноги на линии тени y=287).
      // Фолбэк — цветной прямоугольник, если спрайта нет.
      const spriteKey = `mob-${e.id}`;
      let sprite: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite;
      let dispH: number;
      let halfW: number; // половина ширины модельки — чтобы ставить полосы призыва справа от неё
      if (this.textures.exists(spriteKey)) {
        const img = this.textures.get(spriteKey).getSourceImage() as HTMLImageElement;
        const maxW = e.isBoss ? 210 : 150;
        const maxH = e.isBoss ? 165 : 130;
        const sc = Math.min(maxW / img.width, maxH / img.height) * (getMobConfig(e.id).ui?.scale ?? 1);
        const dispW = img.width * sc;
        dispH = img.height * sc;
        // Точечная подгонка позиции конкретной модели (доля от её же размера после scale) —
        // не двигает тень/hp-бар/подпись, они остаются на slotX/линии тени 287.
        const move = getMobConfig(e.id).ui?.move;
        const moveX = move ? ((move.right ?? 0) - (move.left ?? 0)) * dispW : 0;
        const moveY = move ? ((move.down ?? 0) - (move.up ?? 0)) * dispH : 0;
        sprite = this.add.sprite(x + moveX, 287 + moveY, spriteKey).setOrigin(0.5, 1).setDisplaySize(dispW, dispH).setDepth(5);
        halfW = dispW / 2;
      } else {
        dispH = 90;
        sprite = this.add.rectangle(x, 287, 70, dispH, color).setOrigin(0.5, 1).setDepth(5);
        halfW = 35;
      }

      // Двухслойная тень (псевдоградиент): внешний овал больше и прозрачнее, внутренний меньше и темнее.
      // Ширина тянется за шириной модельки; коэффициент 0.8 — спрайт в боксе с прозрачными полями, тело уже.
      const shW = halfW * 2 * 0.8;
      const shadowOuter = this.add.ellipse(x, 287, shW * 1.1, 16 * 1.1, 0x000000, 0.22).setDepth(4);
      const shadowInner = this.add.ellipse(x, 287, shW * 0.9, 16 * 0.9, 0x000000, 0.45).setDepth(4);
      const uiAlpha = getMobConfig(e.id).ui?.alpha;
      if (uiAlpha !== undefined) sprite.setAlpha(uiAlpha);

      // Подпись имени и полоски ударов подвязаны к одной "анкорной" высоте над линией земли (287):
      // не ниже MIN_LABEL_H (чуть выше стандартного не-босс моба) и не выше MAX_LABEL_H
      // (крупные мобы упираются в потолок и подпись/полоски оказываются поверх спрайта).
      const STANDARD_MOB_H = 130;
      const MIN_LABEL_H = STANDARD_MOB_H + 10;
      const MAX_LABEL_H = 190;
      const LABEL_GAP = 12;
      const BAR_GAP = 20;
      const BAR_STEP = 14;
      const refH = Math.min(Math.max(dispH, MIN_LABEL_H), MAX_LABEL_H);
      const anchorY = 287 - refH;
      const nameY = anchorY - LABEL_GAP;

      const nameText = this.add.text(x, nameY, e.name, { fontSize: '10px', fontFamily: FONT_FAMILY, color: '#ddddaa' }).setOrigin(0.5);
      const hpBar = this.add.rectangle(x, 310, 80, 10, 0x333333).setOrigin(0.5);
      const hpFill = this.add.rectangle(x - 40, 310, 80, 10, 0xaa4444).setOrigin(0, 0.5);
      const hpText = this.add.text(x, 323, `${e.hp}/${e.maxHp}`, { fontSize: '10px', fontFamily: FONT_FAMILY, color: '#ffaaaa' }).setOrigin(0.5);

      const atkBars: { fill: Phaser.GameObjects.Rectangle; bg: Phaser.GameObjects.Rectangle }[] = [];
      for (let t = 0; t < e.attackTimers.length; t++) {
        const ay = nameY - BAR_GAP - t * BAR_STEP;
        const bg = this.add.rectangle(x, ay, 80, 8, 0x222222).setOrigin(0.5);
        const fill = this.add.rectangle(x - 40, ay, 0, 8, 0xffaa00).setOrigin(0, 0.5);
        atkBars.push({ bg, fill });
      }

      // Вертикальные полосы призыва справа от модельки — только для interval-триггеров
      // (hp-триггер срабатывает разово по порогу, наполнять нечего). Заполняются снизу вверх.
      const summonBars: { fill: Phaser.GameObjects.Rectangle; bg: Phaser.GameObjects.Rectangle; plan: SummonPlan }[] = [];
      const barBottom = 287;
      const barH = e.isBoss ? 150 : 110;
      const barW = 12;
      let sk = 0;
      for (const plan of e.summonPlans) {
        if (plan.trigger.type !== 'interval') continue;
        const bx = x + halfW + 12 + sk * (barW + 5);
        const bg = this.add.rectangle(bx, barBottom, barW, barH, 0x222233).setOrigin(0.5, 1).setDepth(5);
        const fill = this.add.rectangle(bx, barBottom, barW, 0, 0xcc55ff).setOrigin(0.5, 1).setDepth(6);
        summonBars.push({ bg, fill, plan });
        sk++;
      }

      sprite.setInteractive({ useHandCursor: false });
      const eCapture = e;
      sprite.on('pointerover', () => {
        const def = eCapture.defense;
        const stats: { text: string; color: string }[] = [];
        const multi = eCapture.attackTimers.length > 1;
        eCapture.attackTimers.forEach((t, i) => {
          const suf = multi ? ` ${i + 1}` : '';
          stats.push({ text: `Урон${suf}: ${t.damage}`, color: DMG_COLOR });
          stats.push({ text: `Перезарядка${suf}: ${(t.interval / 1000).toFixed(1)}s`, color: DMG_COLOR });
        });
        // «Броня: N» (очки), а не «Защита: N%» — броня мобов числовая, в отличие от процентной брони
        // героя в статах нагрудников (`src/items/factories.ts`), чтобы тултипы не путались.
        if (def?.armor) stats.push({ text: `Броня: ${def.armor}`, color: DEF_COLOR });
        if (def?.dodge) stats.push({ text: `Уклон: ${Math.round(def.dodge * 100)}%`, color: DEF_COLOR });
        if (def?.thorns) stats.push({ text: `Шипы: ${def.thorns}`, color: THORNS_COLOR });

        const nameColor = RARITY_TEXT_COLORS[getMobConfig(eCapture.id).tier ?? 'common'];
        this.tooltip.showMob({ name: eCapture.name, nameColor, isBoss: eCapture.isBoss, stats }, x + 50, 140, sprite);
      });
      sprite.on('pointerout', () => this.tooltip.hideFor(sprite));

      this.enemyGraphics[idx] = { baseX: x, shadowOuter, shadowInner, sprite, nameText, hpBar, hpFill, hpText, atkBars, summonBars };
    }
  }

  private updateEnemyGraphics() {
    if (!this.engine) return;
    for (let i = 0; i < this.engine.state.enemies.length; i++) {
      const e = this.engine.state.enemies[i];
      const g = this.enemyGraphics[i];
      if (!g) continue;

      const ratio = e.hp / e.maxHp;
      g.hpFill.setSize(80 * ratio, 10);
      g.hpText.setText(`${Math.max(0, e.hp)}/${e.maxHp}`);
      g.nameText.setText(e.name);

      for (let t = 0; t < e.attackTimers.length; t++) {
        const timer = e.attackTimers[t];
        const atkBar = g.atkBars[t];
        if (!atkBar) continue;
        const atkRatio = timer.elapsed / timer.interval;
        atkBar.fill.setSize(80 * atkRatio, 8);
      }

      for (const sb of g.summonBars) {
        if (sb.plan.trigger.type !== 'interval') continue;
        const ratio = Math.min(1, sb.plan.elapsed / (sb.plan.trigger.every * 1000));
        sb.fill.setSize(sb.fill.width, sb.bg.height * ratio);
      }
    }
  }

  // Нижняя панель боя: три колонки — рюкзак | экипировка·стойки | резерв (пока пустая).
  // Верх панели = дно арены (линия y=360, низ слоя near), низ — край экрана.
  private static readonly PANEL_TOP = 360;
  private static readonly PANEL_HEADER_Y = 366;

  /** Границы колонки i (0..2) по живой ширине холста. */
  private panelColumn(i: number): { left: number; right: number; cx: number } {
    const w = GAME_W / 3;
    const left = i * w;
    return { left, right: left + w, cx: left + w / 2 };
  }

  private buildBottomPanel() {
    const TOP = ExpeditionScene.PANEL_TOP;
    const zH  = GAME_H - TOP;
    const zCy = TOP + zH / 2;

    this.add.rectangle(CX, zCy, GAME_W, zH, 0x201510).setStrokeStyle(2, 0x6b4020);

    // Разделители колонок.
    for (const i of [1, 2]) {
      const x = this.panelColumn(i).left;
      this.add.line(0, 0, x, TOP + 12, x, GAME_H - 10, 0x6b4020).setOrigin(0).setAlpha(0.6);
    }

    const header = (cx: number, text: string) => this.add.text(cx, ExpeditionScene.PANEL_HEADER_Y, text, {
      fontSize: '12px', fontFamily: FONT_FAMILY, color: '#a06030',
    }).setOrigin(0.5, 0);

    header(this.panelColumn(0).cx, 'Рюкзак');
    header(CX, 'Экипировка');
    header(this.panelColumn(2).cx, 'Механики');

    this.add.image(this.panelColumn(0).cx, 600, zoneDecorKey('backpack')).setTint(0xa06030).setAlpha(0.16);
    this.add.image(CX, 600, zoneDecorKey('warrior')).setTint(0xa06030).setAlpha(0.16);

    this.buildStandTabs(CX, 434);
    this.buildEquipSlots();
    this.buildBackpackGrid();
    this.buildMechanicNests();

    // Якорь попапов находок — над сеткой рюкзака. Функция, а не числа: геометрия колонки
    // выводится из живых GAME_W/GAME_H и протухает после ресайза (см. backpackGridGeom).
    this.lootPopups = new LootPopupStack(this, () => {
      const col = this.panelColumn(0);
      return {
        x: col.cx,
        y: this.backpackGridGeom().startY - this.BACKPACK_CELL / 2 - 8,
        width: col.right - col.left - 24,
      };
    });
  }

  // ─── Механики (верхняя треть правой колонки нижней панели) ───────────

  /**
   * 5 гнёзд под иконки механик мобов, встреченных в текущем бою (docs/ui.md). Место гнезда
   * фиксировано за механикой — позиция `i` всегда `MOB_MECHANIC_DEFS[i]` (уворот/защита/шипы/
   * призыв/фаза), а не порядок обнаружения: пусто, пока эта конкретная механика не встретилась.
   */
  private buildMechanicNests() {
    const col = this.panelColumn(2);
    // Тот же размер ячейки, что у предметов в соседних колонках (рюкзак/экипировка) — см.
    // BACKPACK_CELL/BACKPACK_GAP, оба уже учитывают panelScale().
    const SIZE = this.BACKPACK_CELL;
    const GAP = this.BACKPACK_GAP;
    const count = MOB_MECHANIC_DEFS.length;
    const totalW = count * SIZE + (count - 1) * GAP;
    const startX = col.cx - totalW / 2 + SIZE / 2;
    const y = ExpeditionScene.PANEL_HEADER_Y + 46;

    this.mechanicSlots = MOB_MECHANIC_DEFS.map((def, i) => {
      const x = startX + i * (SIZE + GAP);
      const bg = this.add.rectangle(x, y, SIZE, SIZE, 0x2a2a3a).setStrokeStyle(1, 0x444455);
      // 0.78 — та же доля иконки от размера ячейки, что у предметных плашек (DEFAULT_ICON_RATIO, src/ui/itemIcon.ts).
      const iconSize = Math.round(SIZE * 0.78);
      const icon = this.add.image(x, y, mobMechanicIconKey(def.id))
        .setDisplaySize(iconSize, iconSize).setVisible(false);
      bg.setInteractive({ useHandCursor: false });
      bg.on('pointerover', () => {
        if (!this.discoveredMechanics.has(def.id)) return;
        this.tooltip.showLines([
          { text: def.title, color: def.color },
          { text: def.description, color: '#aaaaaa' },
        ], x + SIZE, y, bg);
      });
      bg.on('pointerout', () => this.tooltip.hideFor(bg));
      return { bg, icon };
    });
    this.discoveredMechanics = new Set();
    this.refreshMechanicNests();
  }

  /** Проставляет видимость и цвет фона каждого гнезда по текущему `discoveredMechanics`. */
  private refreshMechanicNests() {
    this.mechanicSlots.forEach((slot, i) => {
      const def = MOB_MECHANIC_DEFS[i];
      if (this.discoveredMechanics.has(def.id)) {
        slot.icon.setVisible(true);
        const colorNum = MOB_MECHANIC_COLOR_NUM[def.id];
        slot.bg.setFillStyle(colorNum, 0.18).setStrokeStyle(1, colorNum, 0.8);
      } else {
        slot.icon.setVisible(false);
        slot.bg.setFillStyle(0x2a2a3a).setStrokeStyle(1, 0x444455);
        // Гнездо опустело (сброс между боями) — если на нём висел тултип, курсор pointerout
        // не позовёт (мышь может так и стоять на месте), гасим адресно.
        this.tooltip.hideFor(slot.bg);
      }
    });
  }

  /** Открывает механики моба `e` на их постоянных местах (см. `MOB_MECHANIC_DEFS`). */
  private registerMobMechanics(e: EnemyState) {
    const found = getMobMechanics(e);
    const fresh = found.filter(id => !this.discoveredMechanics.has(id));
    if (fresh.length === 0) return;
    fresh.forEach(id => this.discoveredMechanics.add(id));
    this.refreshMechanicNests();
  }

  /** Очищает гнёзда механик — вызывается на конец боя (не похода), см. `onFightEnd`/`onHeroDeath`. */
  private resetMechanicNests() {
    this.discoveredMechanics = new Set();
    this.refreshMechanicNests();
  }

  // ─── Рюкзак (левая колонка нижней панели) ────────────────────────────

  // Ячейка/зазор — те же 52/6, что в сундуке лагеря, помноженные на масштаб панели НПС: предмет
  // должен быть одного размера в лагере и в бою. Геттеры, а не поля: panelScale() зависит от живой
  // GAME_W и протухает после ресайза (см. docs/ui.md).
  private get BACKPACK_CELL() { return Math.round(52 * panelScale()); }
  private get BACKPACK_GAP() { return Math.round(6 * panelScale()); }
  private readonly BACKPACK_COLS = 3;
  private readonly BACKPACK_MIN_ROWS = 3;

  /**
   * Геометрия сетки: 3 колонки, минимум 3 строки, новые строки дорисовываются снизу по мере
   * наполнения рюкзака. Блок центрируется в зоне рюкзака по обеим осям (координаты — от живых
   * GAME_W/GAME_H, после ресайза колонка меняет ширину). Строки ограничены высотой колонки:
   * что не влезло — уходит в счётчик «+N» последней ячейки.
   */
  private backpackGridGeom() {
    const col = this.panelColumn(0);
    const step = this.BACKPACK_CELL + this.BACKPACK_GAP;
    const top = ExpeditionScene.PANEL_HEADER_Y + 24;
    const bottom = GAME_H - 14;

    const cols = this.BACKPACK_COLS;
    const maxRows = Math.max(1, Math.floor((bottom - top + this.BACKPACK_GAP) / step));
    const needRows = Math.ceil(this.backpack.length / cols);
    const rows = Math.min(maxRows, Math.max(this.BACKPACK_MIN_ROWS, needRows));

    const gridW = cols * step - this.BACKPACK_GAP;
    const gridH = rows * step - this.BACKPACK_GAP;
    return {
      cols, rows, step,
      startX: col.cx - gridW / 2 + this.BACKPACK_CELL / 2,
      startY: top + (bottom - top - gridH) / 2 + this.BACKPACK_CELL / 2,
    };
  }

  private buildBackpackGrid() {
    const { cols, rows, step, startX, startY } = this.backpackGridGeom();
    const SIZE = this.BACKPACK_CELL;
    const capacity = cols * rows;
    // Рюкзак безлимитен, а сетка конечна: последняя ячейка при переполнении показывает «+N».
    const overflow = Math.max(0, this.backpack.length - capacity);

    for (let i = 0; i < capacity; i++) {
      const x = startX + (i % cols) * step;
      const y = startY + Math.floor(i / cols) * step;
      const isOverflowCell = overflow > 0 && i === capacity - 1;
      const item = isOverflowCell ? undefined : this.backpack[i];

      // Рамку редкости несёт плашка иконки (src/ui/itemIcon.ts) — у ячейки остаётся нейтральный
      // контур, видимый только когда она пуста.
      const bg = this.add.rectangle(x, y, SIZE, SIZE, 0x1a1a2a)
        .setStrokeStyle(1, 0x333344);
      this.backpackCellObjs.push(bg);

      if (isOverflowCell) {
        this.backpackCellObjs.push(this.add.text(x, y, `+${overflow + 1}`, {
          fontSize: '14px', fontFamily: FONT_FAMILY, color: '#a06030',
        }).setOrigin(0.5));
        continue;
      }
      if (!item) continue;

      const view = addItemIcon(this, x, y, { itemId: item.item_id, rarity: item.rarity, size: SIZE });
      this.backpackCellObjs.push(view);
      this.backpackIconViews[i] = view;
      // Единственное взаимодействие — наведение: в походе предмет применить нельзя.
      bg.setInteractive({ useHandCursor: false });
      bg.on('pointerover', () => { view.setHover(true); this.tooltip.showItem(item, x + SIZE, y - 40, bg); });
      bg.on('pointerout', () => { view.setHover(false); this.tooltip.hideFor(bg); });
    }
  }

  /**
   * Пересборка панели уничтожает объект под курсором: Phaser не выстрелит pointerover по новому,
   * пока мышь не сдвинут. Переигрываем наведение вручную.
   */
  private reapplyHoverUnderPointer() {
    const p = this.input.activePointer;
    if (!p.camera) return;
    for (const obj of this.input.hitTestPointer(p)) obj.emit('pointerover', p);
  }

  private refreshBackpackGrid() {
    // Ячейка под курсором исчезает без pointerout — снимаем её тултип, чужой не трогаем.
    for (const o of this.backpackCellObjs) { this.tooltip.hideFor(o); o.destroy(); }
    this.backpackCellObjs = [];
    this.backpackIconViews = [];
    this.buildBackpackGrid();
    this.reapplyHoverUnderPointer();
  }

  /**
   * Короткий «пых» ячейки: связывает попап находки с местом, куда предмет лёг. Предмет мог не
   * влезть в сетку (ушёл в счётчик «+N») — тогда подсвечивать нечего.
   */
  private flashBackpackCell(index: number) {
    const view = this.backpackIconViews[index];
    if (!view) return;
    const tween = this.tweens.add({
      targets: view, scale: 1.18, duration: 130, yoyo: true, ease: 'Quad.easeOut',
    });
    // Иначе следующая находка пересоберёт сетку, а твин продолжит писать в уничтоженный объект.
    view.once('destroy', () => tween.remove());
  }

  /**
   * «Новый» предмет для значка NEW: ни разу не вынесен в сундук (MetaStore.stats.items_carried_out)
   * И не лежит в рюкзаке текущего похода. Рюкзак уходит в сундук только в finishExpedition,
   * поэтому без второй проверки предмет, поднятый в этом же походе, снова считался бы новым.
   */
  private isNewItem(itemId: string): boolean {
    if (MetaStore.get().stats.items_carried_out[itemId]) return false;
    return !this.backpack.some((it) => it.item_id === itemId);
  }

  /** Находка уходит в рюкзак: применить её можно только вернувшись в лагерь. */
  private addToBackpack(item: ItemInstance) {
    this.backpack.push(item);
    EventBus.emit('item_in_backpack', item.item_id);
    this.refreshBackpackGrid();
    this.flashBackpackCell(this.backpack.length - 1);
  }

  // Табы смены активной стойки в походе (1/2/3). Клик — мгновенная замена снаряжения:
  // this.equipment пересобирается, а в идущем бою — и герой (HP переносится).
  private buildStandTabs(cx: number, y: number) {
    this.standTabs = [];
    // Ширина таба = ширине ячейки экипировки, шаг = шагу колонок креста (|dx| = 54 в ANATOMY):
    // при трёх стойках табы встают ровно над колонками ring/head/amulet.
    const S = panelScale();
    const W = Math.round(48 * S), H = Math.round(22 * S);
    const step = 54 * S;
    const startX = cx - ((ARMOR_STAND_COUNT - 1) / 2) * step;
    for (let i = 0; i < ARMOR_STAND_COUNT; i++) {
      const x = startX + i * step;
      const bg = this.add.rectangle(x, y, W, H, 0x222233)
        .setStrokeStyle(1, 0x444455)
        .setInteractive({ useHandCursor: true });
      const lbl = this.add.text(x, y, `${i + 1}`, {
        fontSize: `${Math.round(10 * S)}px`, fontFamily: FONT_FAMILY, color: '#8899aa',
      }).setOrigin(0.5);
      bg.on('pointerover', () => { if (i !== this.standIndex) bg.setFillStyle(0x2a2a3a); });
      bg.on('pointerout',  () => { if (i !== this.standIndex) bg.setFillStyle(0x222233); });
      bg.on('pointerdown', () => this.switchStand(i));
      this.standTabs.push({ bg, lbl });
    }
    this.refreshStandTabs();
  }

  private refreshStandTabs() {
    this.standTabs.forEach(({ bg, lbl }, i) => {
      const active = i === this.standIndex;
      bg.setFillStyle(active ? 0x3a4a6a : 0x222233).setStrokeStyle(1, active ? 0x88aaff : 0x444455);
      lbl.setColor(active ? '#cfe0ff' : '#8899aa');
    });
  }

  // Пересобирает визуал ячеек экипировки из this.equipment (после смены стойки).
  private refreshEquipSlots() {
    for (const o of this.equipSlotObjs) { this.tooltip.hideFor(o.bg); o.bg.destroy(); o.icon.destroy(); }
    this.equipSlotObjs = [];
    this.buildEquipSlots();
    this.reapplyHoverUnderPointer();
  }

  // Смена стойки на лету: обновляет мету (запоминаем выбор), снаряжение и — в идущем бою —
  // самого героя. Длина забега уже зафиксирована при входе, её ботинки новой стойки не меняют.
  private switchStand(i: number) {
    if (i === this.standIndex) return;
    this.standIndex = i;
    MetaStore.setActiveStand(i);
    this.initEquipmentFromStand();
    this.refreshStandTabs();
    // Стойка сменилась — старый тултип неактуален; актуальный переигрывает refreshEquipSlots.
    this.tooltip.hide();
    this.refreshEquipSlots();

    // HP переносим по абсолюту (maxHp не зависит от брони) — смена стойки не лечит и не ранит.
    this.applyEquipToHero();
    this.showStatus(`Стойка ${i + 1}`, 800);
  }

  // Экипировка героя — только просмотр выбранной стойки (без drag, без ячеек рюкзака/крафта).
  private buildEquipSlots() {
    // Оверлеи — дети старых icon-контейнеров, уничтожаются вместе с ними при пересборке.
    this.weaponChargeOverlays = {};
    // Крестовая раскладка вокруг портрета (см. docs/art-spec.md): ring/head/amulet сверху,
    // hand_left/body/hand_right в центре, legs снизу.
    const cx = CX;
    // Раскладка и размер ячейки дублируют стойку лагеря (CampScene.buildArmorStands), включая
    // масштаб панели НПС — иначе один и тот же слот в бою выглядел бы мельче, чем в лагере.
    const S = panelScale();
    const SIZE = Math.round(48 * S);

    const ANATOMY: Record<SlotId, { dx: number; dy: number }> = {
      ring:        { dx: -54 * S, dy:  28 * S },
      head:        { dx:   0,     dy:   0 },
      amulet:      { dx:  54 * S, dy:  28 * S },
      hand_left:   { dx: -54 * S, dy:  84 * S },
      body:        { dx:   0,     dy:  56 * S },
      hand_right:  { dx:  54 * S, dy:  84 * S },
      legs:        { dx:   0,     dy: 112 * S },
    };

    // Центр креста (body) выравниваем по центру сетки рюкзака — обе колонки читаются как одна линия.
    const { rows, step, startY } = this.backpackGridGeom();
    const originY = startY + ((rows - 1) / 2) * step - ANATOMY.body.dy;

    for (const slotId of EQUIP_SLOTS) {
      const { dx, dy } = ANATOMY[slotId];
      const x = cx + dx;
      const y = originY + dy;
      const item = this.equipment[slotId];

      // Рамку редкости несёт плашка иконки (src/ui/itemIcon.ts), у ячейки — нейтральный контур.
      const bg = this.add.rectangle(x, y, SIZE, SIZE, 0x1a1a2a)
        .setStrokeStyle(1, 0x333344)
        .setInteractive({ useHandCursor: false });

      const icon = addItemIcon(this, x, y, {
        itemId: item?.item_id,
        rarity: item?.rarity,
        silhouette: slotSilhouetteKey(slotId),
        size: SIZE,
        iconAlpha: item ? 1 : 0.35,
      }).setDepth(4);

      // Заливка перезарядки — только у рук, там же живёт оружие ближнего боя.
      if (slotId === 'hand_left' || slotId === 'hand_right') {
        const overlay = this.add
          .rectangle(0, SIZE / 2, SIZE, 0, 0x44aaff, 0.45)
          .setOrigin(0.5, 1);
        icon.add(overlay);
        this.weaponChargeOverlays[slotId] = overlay;
      }

      // Наведение показывает предмет.
      bg.on('pointerover', () => {
        const cur = this.equipment[slotId];
        if (!cur) return;
        icon.setHover(true);
        this.tooltip.showItem(cur, x + SIZE, y - 40, bg, slotId);
      });
      bg.on('pointerout', () => { icon.setHover(false); this.tooltip.hideFor(bg); });

      this.equipSlotObjs.push({ bg, icon });
    }
  }

  // Пересобирает героя из текущего снаряжения (для идущего боя), сохраняя абсолютный HP.
  private applyEquipToHero() {
    if (!this.engine || this.engine.state.phase !== 'fighting') return;
    const heroEquip: Partial<Record<SlotType, ItemInstance>> = {};
    for (const s of EQUIP_SLOTS) {
      if (this.equipment[s]) heroEquip[s as SlotType] = this.equipment[s]!;
    }
    const prevHero = this.engine.state.hero;
    const fresh = CombatEngine.buildInitialHero(heroEquip, prevHero.damageTakenMult);
    fresh.hp = Math.min(prevHero.hp, fresh.maxHp);

    // Хот-свап среди боя: заряды с формой {charges,max} (сейчас — только неуязвимость) переносятся
    // остатком (клампится к новому максимуму), а не сбрасываются в максимум нового предмета —
    // раньше это было открытым багом (docs/content.items.amulet.md), generic-перенос по форме
    // стейта чинит его для любого будущего триггера с зарядами, не только invuln.
    for (const slot of Object.keys(fresh.triggerState) as SlotType[]) {
      const freshBag = fresh.triggerState[slot];
      const prevBag = prevHero.triggerState[slot];
      if (!freshBag || !prevBag) continue;
      for (const key of Object.keys(freshBag)) {
        const freshVal = freshBag[key] as { charges?: number; max?: number };
        const prevVal = prevBag[key] as { charges?: number; max?: number };
        if (typeof freshVal?.max === 'number' && typeof prevVal?.charges === 'number') {
          freshVal.charges = Math.min(prevVal.charges, freshVal.max);
        }
      }
    }

    this.engine.state.hero = fresh;
    this.updateHeroHpBar();
  }


  private buildSpeedControls() {
    this.speedBtns = [];
    const BTN_W = 36;
    const BTN_H = 28;
    const GAP = 4;
    const rowY = 55;
    // 4 кнопки: пауза + ×1 + ×2 + ×4, прижаты к правому краю
    const totalW = 4 * BTN_W + 3 * GAP;
    const rowLeft = rightX(totalW + 10);

    const centers = [0, 1, 2, 3].map(i => rowLeft + BTN_W / 2 + i * (BTN_W + GAP));

    // Пауза
    this.pauseBtn = this.add.rectangle(centers[0], rowY, BTN_W, BTN_H, 0x222233)
      .setStrokeStyle(1, 0x444466)
      .setInteractive({ useHandCursor: true });
    this.pauseIcon = this.add.text(centers[0], rowY, '⏸', { fontSize: '14px', fontFamily: FONT_FAMILY, color: '#aaaacc' }).setOrigin(0.5);
    this.pauseBtn.on('pointerover', () => { if (!this.isPaused) this.pauseBtn!.setFillStyle(0x2a2a44); });
    this.pauseBtn.on('pointerout',  () => { if (!this.isPaused) this.pauseBtn!.setFillStyle(0x222233); });
    this.pauseBtn.on('pointerdown', () => {
      if (this.isPaused) this.resume(); else this.pause();
    });

    // ×1 ×2 ×4
    const speeds = [1, 2, 4];
    for (let i = 0; i < speeds.length; i++) {
      const cx = centers[i + 1];
      const active = speeds[i] === this.speedMult;
      const btn = this.add.rectangle(cx, rowY, BTN_W, BTN_H, active ? 0x2244aa : 0x222233)
        .setStrokeStyle(1, 0x444466)
        .setInteractive({ useHandCursor: true });
      this.add.text(cx, rowY, `×${speeds[i]}`, { fontSize: '12px', fontFamily: FONT_FAMILY, color: '#aaaaff' }).setOrigin(0.5);
      this.speedBtns.push(btn);

      const spd = speeds[i];
      btn.on('pointerdown', () => {
        this.speedMult = spd;
        MetaStore.setRunSpeed(spd);
        if (this.engine) this.engine.state.speedMultiplier = spd;
        this.speedBtns.forEach((b, idx) => b.setFillStyle(idx === i ? 0x2244aa : 0x222233));
      });
    }
    // Кнопка возврата в лагерь — под рядом скорости, во всю его ширину.
    const retreatY = rowY + BTN_H / 2 + GAP + 14;
    const retreatBtn = this.add.rectangle(rowLeft + totalW / 2, retreatY, totalW, 26, 0x332222)
      .setStrokeStyle(1, 0x664444)
      .setInteractive({ useHandCursor: true });
    const retreatLbl = this.add.text(rowLeft + totalW / 2, retreatY, 'В лагерь', {
      fontSize: '12px', fontFamily: FONT_FAMILY, color: '#ddaaaa',
    }).setOrigin(0.5);
    retreatBtn.on('pointerover', () => retreatBtn.setFillStyle(0x442a2a));
    retreatBtn.on('pointerout',  () => retreatBtn.setFillStyle(0x332222));
    retreatBtn.on('pointerdown', () => this.confirmRetreat());
    void retreatLbl;
  }

  // Обновляет текст с текущим % проклятья endless-зоны (см. buildProgressBar). No-op вне endless.
  private updateCurseReadout() {
    if (!this.zoneCfg.endless || !this.curseText) return;
    const pct = Math.round(this.zoneCfg.endless.curse_per_fight * this.currentFightIdx);
    this.curseText.setText(`Проклятие: ${pct}%`);
  }

  // Подтверждение отступления: рюкзак сохраняется, зона НЕ засчитывается.
  private confirmRetreat() {
    if (this.retreatDialogOpen) return;
    this.retreatDialogOpen = true;
    // Если игрок уже сам поставил игру на паузу до клика — не снимаем её при отмене диалога.
    const wasPaused = this.isPaused;
    if (!wasPaused) this.pause();
    const c = this.add.container(0, 0).setDepth(200);
    const overlay = this.add.rectangle(CX, 400, GAME_W, GAME_H, 0x000000, 0.7).setInteractive();
    const box = this.add.rectangle(CX, 400, 420, 190, 0x1a1a2a).setStrokeStyle(2, 0x664444);
    const title = this.add.text(CX, 340, 'Вернуться в лагерь?', {
      fontSize: '20px', fontFamily: FONT_FAMILY, color: '#ffcc88',
    }).setOrigin(0.5);
    // В endless-зоне «зачёта зоны» не существует — вместо него игроку важен рекорд глубины.
    const subText = this.zoneCfg.endless
      ? 'Собранный лут сохранится.\nРекорд глубины засчитается.'
      : 'Собранный лут сохранится.\nЗона не будет зачтена.';
    const sub = this.add.text(CX, 378, subText, {
      fontSize: '14px', fontFamily: FONT_FAMILY, color: '#bbbbbb', align: 'center',
    }).setOrigin(0.5);

    const yesBtn = this.add.rectangle(CX - 88, 445, 150, 40, 0x332222).setStrokeStyle(1, 0x885555)
      .setInteractive({ useHandCursor: true });
    const yesLbl = this.add.text(CX - 88, 445, 'В лагерь', { fontSize: '14px', fontFamily: FONT_FAMILY, color: '#ddaaaa' }).setOrigin(0.5);
    const noBtn = this.add.rectangle(CX + 88, 445, 150, 40, 0x222233).setStrokeStyle(1, 0x445588)
      .setInteractive({ useHandCursor: true });
    const noLbl = this.add.text(CX + 88, 445, 'Остаться', { fontSize: '14px', fontFamily: FONT_FAMILY, color: '#aaccff' }).setOrigin(0.5);

    yesBtn.on('pointerover', () => yesBtn.setFillStyle(0x442a2a));
    yesBtn.on('pointerout',  () => yesBtn.setFillStyle(0x332222));
    noBtn.on('pointerover', () => noBtn.setFillStyle(0x2a2a44));
    noBtn.on('pointerout',  () => noBtn.setFillStyle(0x222233));

    yesBtn.on('pointerdown', () => this.retreatToCamp());
    noBtn.on('pointerdown', () => {
      c.destroy();
      this.retreatDialogOpen = false;
      if (!wasPaused) this.resume();
    });

    c.add([overlay, box, title, sub, yesBtn, yesLbl, noBtn, noLbl]);
  }

  // Отступление: рюкзак уходит в сундук, зона не засчитывается, возврат в лагерь.
  private retreatToCamp() {
    this.dumpBackpackToChest();
    // Endless-зона: отступление — легитимный конец забега (docs/zones/battlefield.md),
    // рекорд глубины пишется так же, как при смерти, иначе уход на 40 бою оставил бы 0
    // и не двинул бы квесты battlefield_survive_N.
    if (this.zoneCfg.endless) MetaStore.recordBattlefieldDepth(this.currentFightIdx);
    this.scene.start('CampScene');
  }

  private buildStatusText() {
    this.statusText = this.add.text(CX, 450, '', {
      fontSize: '16px', fontFamily: FONT_FAMILY, color: '#ffcc44',
    }).setOrigin(0.5).setDepth(10);
  }

  private showStatus(msg: string, duration = 2500) {
    this.statusText.setText(msg);
    this.time.delayedCall(duration, () => { if (this.statusText) this.statusText.setText(''); });
  }

  private startNextFight() {
    // Endless-зона (docs/content.zones.format.md) — боёв без предела, fightPlan пуст и не означает конец.
    if (!this.zoneCfg.endless && this.currentFightIdx >= this.fightPlan.length) {
      this.onExpeditionComplete();
      return;
    }

    // Ходьба проигрывается перед каждым боем, включая первый при входе в зону.
    this.startWalking();
    this.showStatus('Персонаж идёт к следующему врагу...', 1500);
  }

  private beginFight() {
    const fightType = this.fightPlan[this.currentFightIdx];
    const isBoss = fightType === 'boss';

    const heroEquip: Partial<Record<SlotType, ItemInstance>> = {};
    for (const s of EQUIP_SLOTS) {
      if (this.equipment[s]) heroEquip[s as SlotType] = this.equipment[s]!;
    }

    // Проклятие endless-зоны (docs/content.zones.format.md): растёт с числом уже пройденных
    // боёв этой экспедиции (currentFightIdx) — свежий заход всегда начинает с 0%.
    const curseMult = this.zoneCfg.endless
      ? 1 + (this.zoneCfg.endless.curse_per_fight / 100) * this.currentFightIdx
      : 1;
    const hero = CombatEngine.buildInitialHero(heroEquip, curseMult);
    if (this.engine) {
      hero.hp = this.engine.state.hero.hp;
      hero.maxHp = this.engine.state.hero.maxHp;
    } else if (this.carryoverHp !== null) {
      // Первый бой после «Продолжить поиски»: здоровье переносится из прошлого прогона,
      // а не восстанавливается. Дальше HP ведёт this.engine.
      hero.hp = Math.max(1, Math.min(this.carryoverHp, hero.maxHp));
      this.carryoverHp = null;
    }

    const rootMobId = isBoss ? this.zoneCfg.boss!.mob_id : this.rollMob().id;
    const phases = resolvePhases(rootMobId, isBoss);
    const enemies: EnemyState[] = buildBoardEnemies(phases[0]);
    // Движку нужны фазы только если форм больше одной (иначе перехода нет).
    const enginePhases = phases.length > 1 ? phases : undefined;

    const state: CombatState = {
      phase: 'fighting',
      enemies,
      hero,
      fightIndex: this.currentFightIdx,
      totalFights: this.totalFights,
      walkProgress: 0,
      speedMultiplier: this.speedMult,
      isBossFight: isBoss,
    };

    this.engine = new CombatEngine(state, {
      onDamageDealt: (target, amount, enemyIdx, crit) => {
        if (target === 'hero') {
          SoundManager.play('hero_hurt');
          // Цифра урона — в случайной точке нижних 2/3 модельки (надписи-статусы остаются над головой).
          {
            const p = this.damageSpot(this.heroSprite);
            spawnFloater(this, 'damage', amount, p.x, p.y, { crit });
          }
          this.updateHeroHpBar();
          if (this.heroAnimPrefix) this.playHeroAnim(`${this.heroAnimPrefix}-hit`, true);
          else this.flashSprite(this.heroSprite, 0xff0000);
        } else {
          // Анимацию замаха запускает onHeroWindup (с упреждением). Здесь — момент
          // контакта: звук, цифра урона, вспышка и отскок врага.
          SoundManager.play('hero_attack');
          const g = this.enemyGraphics[enemyIdx];
          if (g) {
            // Цифра урона — в случайной точке нижних 2/3 модельки (надписи Блок/мимо остаются над головой).
            const p = this.damageSpot(g.sprite);
            spawnFloater(this, 'damage', amount, p.x, p.y, { crit });
            this.flashSprite(g.sprite, 0xff0000);
            this.jerkEnemy(enemyIdx, 16); // отскок от героя при получении урона
          }
          this.updateEnemyGraphics();
        }
      },
      onBlock: (target, enemyIdx) => {
        // Два автора блока: щит героя (бросок до урона) и броня, срезавшая удар в 0 —
        // второй достижим на обеих сторонах (см. docs/mechanics.md §«Броня vs щит»).
        SoundManager.play('block');
        if (target === 'hero') {
          this.flashSprite(this.heroSprite, 0xffdd00);
          spawnFloater(this, 'block', 0, heroX(), 130);
          return;
        }
        const g = this.enemyGraphics[enemyIdx];
        if (!g) return;
        // Надпись — над головой моба, как «мимо» у уклонения (цифры урона живут ниже, в damageSpot).
        const headY = g.sprite instanceof Phaser.GameObjects.Sprite
          ? g.sprite.y - g.sprite.displayHeight - 10
          : g.sprite.y - 60;
        this.flashSprite(g.sprite, 0xffdd00);
        spawnFloater(this, 'block', 0, g.sprite.x, headY);
      },
      onDodge: (enemyIdx) => {
        SoundManager.play('block');
        const g = this.enemyGraphics[enemyIdx];
        if (g) {
          const headY = g.sprite instanceof Phaser.GameObjects.Sprite
            ? g.sprite.y - g.sprite.displayHeight - 10
            : g.sprite.y - 60;
          spawnFloater(this, 'miss', 0, g.sprite.x, headY);
          this.jerkEnemy(enemyIdx, 12);
        }
        this.showStatus('Уклонение!', 600);
      },
      onCounterAttack: () => {
        // Ответный удар героя (щит и т.п.) — надпись над героем, кто его совершил, а не над целью.
        const b = this.heroSprite.getBounds();
        const x = b.x + Math.random() * b.width;
        spawnFloater(this, 'counter', 0, x, 130);
      },
      onHeal: (amount) => {
        // Над головой героя, X — случайно по ширине модельки, Y фиксирован (тот же уровень, что и «Блок»).
        const b = this.heroSprite.getBounds();
        const x = b.x + Math.random() * b.width;
        spawnFloater(this, 'heal', amount, x, 130);
        this.updateHeroHpBar();
      },
      onInvulnHit: () => {
        const b = this.heroSprite.getBounds();
        const x = b.x + Math.random() * b.width;
        spawnFloater(this, 'invuln', 0, x, 130);
        this.updateHeroHpBar();
      },
      onEnemyDied: (enemy, enemyIdx, willReuseSlot) => {
        // willReuseSlot=true — это смена формы (фаза), а не смерть: не считаем.
        // Так корректно учитываются саммоны и финальная форма босса, без промежуточных.
        if (!willReuseSlot) MetaStore.recordMobKilled(enemy.id);
        if (willReuseSlot) {
          // Новая форма уже подставлена в state.enemies — пересобираем модельки,
          // чтобы сменился спрайт (updateEnemyGraphics обновляет только имя/HP/полоски).
          this.clearEnemyGraphics();
          this.buildEnemyGraphics(this.engine!.state.enemies);
          // Курсор мог висеть на старой форме: переигрываем наведение на новый спрайт.
          this.reapplyHoverUnderPointer();
          return;
        }
        const g = this.enemyGraphics[enemyIdx];
        if (!g) return;
        // Спрайт исчезает без pointerout — тултип с его статами иначе остаётся висеть.
        // Гасим адресно: чужой показ (предмет под курсором) смерть моба сносить не должна.
        this.tooltip.hideFor(g.sprite);
        // Босс на финальной смерти — затемняем (поверх ляжет экран победы). Обычный моб — убираем.
        if (enemy.isBoss) {
          // Гасим отложенный сброс вспышки от добивающего удара — иначе он снимет затемнение.
          const flash = g.sprite.getData('flashTimer') as Phaser.Time.TimerEvent | undefined;
          if (flash) { flash.remove(false); g.sprite.setData('flashTimer', undefined); }
          if (g.sprite instanceof Phaser.GameObjects.Rectangle) g.sprite.setFillStyle(0x333333);
          else g.sprite.setTint(0x333333);
          g.shadowOuter.setAlpha(0.07);
          g.shadowInner.setAlpha(0.15);
        } else {
          SoundManager.play('enemy_death');
          this.removeEnemyGraphics(enemyIdx);
        }
      },
      onHeroDied: () => {
        this.onHeroDeath();
      },
      onFightEnd: () => {
        this.onFightEnd(isBoss);
      },
      onEnemyAttack: (enemyIdx) => {
        this.jerkEnemy(enemyIdx, -14); // выпад к герою (влево) при атаке
      },
      onHeroWindup: () => {
        // Замах стартует чуть раньше удара, чтобы контакт меча совпал с уроном.
        if (this.heroAnimPrefix) this.playHeroAnim(`${this.heroAnimPrefix}-attack`);
      },
      onEnemySummoned: (enemy, enemyIdx) => {
        this.addEnemyGraphic(enemy, enemyIdx);
      },
    }, resolveSummonSpec, enginePhases, rngFor(this.runSeed, 'phase', this.currentFightIdx));

    this.buildEnemyGraphics(enemies);
    this.resetWeaponChargeOverlays();
    this.updateProgressBar();
  }

  private rollMob(): MobConfig {
    // Вызывается только когда есть рядовые бои (mob_pool непустой); пустой пул — страховка.
    const pool = this.zoneCfg.mob_pool ?? [];
    if (pool.length === 0) return getMobConfig(this.zoneCfg.boss!.mob_id);
    const total = pool.reduce((s, e) => s + e.weight, 0);
    // Ключ «сид + бой» — при рестарте сцены на том же номере боя выпадет тот же моб.
    let rand = rngFor(this.runSeed, 'mob', this.currentFightIdx).frac() * total;
    for (const entry of pool) {
      rand -= entry.weight;
      if (rand <= 0) return getMobConfig(entry.mob_id);
    }
    return getMobConfig(pool[0].mob_id);
  }

  private onFightEnd(_isBoss: boolean) {
    // Endless-зона (docs/content.zones.format.md): каждый бой — рядовой, лута и конца как у обычных
    // мобов, без fightPlan/boss.
    const fightType = this.zoneCfg.endless ? 'mob' : this.fightPlan[this.currentFightIdx];

    const magicFind = sumMeta(this.equipment).magicFind;

    if (fightType === 'mob') {
      if (this.zoneCfg.mob_loot) {
        // Индекс инкрементится ниже, уже после начисления — «бой N» и «лут боя N» согласованы.
        const loot = rollLootTable(this.zoneCfg.mob_loot, magicFind, rngFor(this.runSeed, 'loot', this.currentFightIdx));
        for (const item of loot.items) {
          MetaStore.recordItemDiscovered(item.item_id);
          // Флаг считаем до addToBackpack: иначе только что положенный предмет сам себя
          // вычеркнет из «новых».
          const isNew = this.isNewItem(item.item_id);
          this.addToBackpack(item);
          this.lootPopups.push(item, isNew);
        }
      }
    } else {
      // Босс НЕ даёт лут автоматически: награда за него — только выбранная карточка драфта
      // (onExpeditionComplete → buildRewardOptions из boss.loot). Здесь ничего не начисляем.
      // Квесты на боссов идут через stat (mobs_killed); событие нужно для презентации
      // (SoundManager — фанфары победы над боссом).
      EventBus.emit('boss_killed', this.zoneCfg.boss!.mob_id);
    }

    this.currentFightIdx++;
    this.updateProgressBar();
    this.updateCurseReadout();
    this.resetWeaponChargeOverlays();
    this.resetMechanicNests();

    // Находка поход не останавливает: предмет уже в рюкзаке, попап над сеткой гаснет сам.
    this.proceedAfterFight();
  }

  /** Следующий шаг похода после боя: ходьба к следующему врагу или финал зоны. */
  private proceedAfterFight() {
    if (this.zoneCfg.endless) {
      this.scheduleDelayed(800, () => this.startWalking());
    } else if (this.currentFightIdx >= this.fightPlan.length) {
      this.scheduleDelayed(1000, () => this.onExpeditionComplete());
    } else {
      this.scheduleDelayed(800, () => this.startWalking());
    }
  }

  // Откладывает действие на ms (реальное время кадров), исполняется в update().
  private scheduleDelayed(ms: number, fn: () => void) {
    this.delayed = { remaining: ms, fn };
  }

  private onHeroDeath() {
    if (this.heroAnimPrefix && this.heroSprite instanceof Phaser.GameObjects.Sprite
        && this.anims.exists(`${this.heroAnimPrefix}-death`)) {
      this.heroSprite.play(`${this.heroAnimPrefix}-death`, true);
      this.heroSprite.setDisplaySize(100, 140);
    }
    // Лут гарантирован: рюкзак уходит в сундук — смерть его не отнимает.
    this.dumpBackpackToChest();
    this.resetWeaponChargeOverlays();
    this.resetMechanicNests();

    // Endless-зона (docs/content.zones.format.md): цель — рекорд глубины, а не «прохождение».
    // Показываем полноэкранный recap вместо тоста+автоперехода — игроку нужно время прочитать числа.
    if (this.zoneCfg.endless) {
      const depth = this.currentFightIdx;
      const isRecord = MetaStore.recordBattlefieldDepth(depth);
      const best = MetaStore.get().battlefield_best_depth;
      this.scheduleDelayed(1500, () => this.showDeathRecap(depth, isRecord, best));
      return;
    }

    this.showStatus('Герой пал! Лут сохранён.', 3000);
    this.scheduleDelayed(2000, () => {
      this.scene.start('CampScene', { diedInZone: this.zoneId });
    });
  }

  // Экран смерти в endless-зоне: сколько убил в этом забеге / рекорд зоны. Не отмечает зону
  // пройденной (completeArea не вызывается — endless-зона не «проходится», см. план).
  private showDeathRecap(depth: number, isRecord: boolean, best: number) {
    this.victoryContainer.setVisible(true);
    this.victoryContainer.removeAll(true);

    const overlay = this.add.rectangle(CX, 400, GAME_W, GAME_H, 0x000000, 0.85).setInteractive();
    const title = this.add.text(CX, 260, 'Ты пал', {
      fontSize: '30px', fontFamily: FONT_FAMILY, color: '#ff6666',
    }).setOrigin(0.5);
    const depthLine = this.add.text(CX, 316, `Убито мобов: ${depth}`, {
      fontSize: '18px', fontFamily: FONT_FAMILY, color: '#dddddd',
    }).setOrigin(0.5);
    const recordLine = this.add.text(CX, 348, isRecord ? 'Новый рекорд!' : `Рекорд зоны: ${best}`, {
      fontSize: '16px', fontFamily: FONT_FAMILY, color: isRecord ? '#ffdd44' : '#999999',
    }).setOrigin(0.5);

    const btn = this.add.rectangle(CX, 420, 200, 44, 0x332222).setStrokeStyle(1, 0x885555)
      .setInteractive({ useHandCursor: true });
    const btnLbl = this.add.text(CX, 420, 'В лагерь', {
      fontSize: '16px', fontFamily: FONT_FAMILY, color: '#ddaaaa',
    }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(0x442a2a));
    btn.on('pointerout', () => btn.setFillStyle(0x332222));
    btn.on('pointerdown', () => this.scene.start('CampScene'));

    this.victoryContainer.add([overlay, title, depthLine, recordLine, btn, btnLbl]);
  }

  private onExpeditionComplete() {
    // Рюкзак НЕ вываливаем здесь: пока идёт выбор награды, добыча похода должна оставаться
    // видимой в сетке рюкзака — иначе игроку кажется, что предметы пропали. Уходит в сундук
    // в finishExpedition(), сразу после выбора карточки.
    // Гарант-драфт: до 4 карточек [предмет·mob, предмет·boss, предмет·mob, эссенция],
    // игрок берёт одну. Недостающие источники не показываются — см. buildRewardOptions.
    const options = buildRewardOptions(this.zoneCfg.boss?.loot, this.zoneCfg.mob_loot, rngFor(this.runSeed, 'reward'));
    this.showRewardDraft(options);
  }

  // Экран выбора награды после победы над боссом: 1 из до 5 вариантов.
  private showRewardDraft(options: RewardOption[]) {
    this.victoryContainer.setVisible(true);
    this.victoryContainer.removeAll(true);

    // Затемнение точно по дно арены (PANEL_TOP=360), иначе снизу остаётся полоска неприкрытого фона.
    const overlay = this.add.rectangle(CX, 196, GAME_W, 328, 0x000000, 0.82).setInteractive();
    const title = this.add.text(CX, 78, 'Победа! Выбери награду', {
      fontSize: '26px', fontFamily: FONT_FAMILY, color: '#ffdd44',
    }).setOrigin(0.5);
    this.victoryContainer.add([overlay, title]);

    const CARD_W = 150, CARD_H = 170, GAP = 24;
    const total = options.length * CARD_W + (options.length - 1) * GAP;
    const startX = CX - total / 2 + CARD_W / 2;
    const cardY = 210;

    options.forEach((opt, i) => {
      const x = startX + i * (CARD_W + GAP);
      const color = this.rewardCardColor(opt);
      const card = this.add.rectangle(x, cardY, CARD_W, CARD_H, 0x1a1a2a)
        .setStrokeStyle(2, color)
        .setInteractive({ useHandCursor: true });
      this.victoryContainer.add(card);

      // Наполнение карточки. Эссенция — иконка+число единообразно с предметами.
      if (opt.kind === 'essence') {
        const tiers = ESSENCE_TIERS.filter((t) => (opt.essence[t] ?? 0) > 0);
        const rowH = 38;
        const startY = cardY - 12 - ((tiers.length - 1) * rowH) / 2;
        tiers.forEach((t, ti) => {
          this.victoryContainer.add(essenceTag(this, t, opt.essence[t] ?? 0, { iconSize: 32, fontSize: 22, originX: 0.5 })
            .setPosition(x, startY + ti * rowH));
        });
        this.victoryContainer.add(this.add.text(x, cardY + 44, 'Эссенция', {
          fontSize: '12px', fontFamily: FONT_FAMILY, color: '#dddddd',
        }).setOrigin(0.5, 0));
      } else {
        this.victoryContainer.add(addItemIcon(this, x, cardY - 28, {
          itemId: opt.item.item_id, rarity: opt.item.rarity, size: 72,
        }));
        this.victoryContainer.add(this.add.text(x, cardY + 34, getItemBehavior(opt.item.item_id).name, {
          fontSize: '12px', fontFamily: FONT_FAMILY, color: '#dddddd',
          align: 'center', wordWrap: { width: CARD_W - 16 },
        }).setOrigin(0.5, 0));
        // Значок последним в карточке — рисуется поверх иконки и названия.
        if (this.isNewItem(opt.item.item_id)) {
          this.victoryContainer.add(newBadge(this, x + CARD_W / 2 - 8, cardY + CARD_H / 2 - 6));
        }
      }

      card.on('pointerover', () => {
        card.setFillStyle(0x2a2a3a);
        if (opt.kind === 'item') this.tooltip.showItem(opt.item, x + CARD_W / 2 + 8, cardY - CARD_H / 2);
      });
      card.on('pointerout',  () => { card.setFillStyle(0x1a1a2a); this.tooltip.hide(); });
      card.on('pointerdown', () => {
        if (this.rewardClaimed) return;
        this.rewardClaimed = true;
        // Глушим все карточки сразу: до смены сцены они ещё живы и ловят ввод.
        this.victoryContainer.each((o: Phaser.GameObjects.GameObject) => o.input && o.disableInteractive());
        this.tooltip.hide();
        this.claimReward(opt);
        this.finishExpedition();
      });
    });
  }

  // Цвет рамки карточки награды по её типу.
  private rewardCardColor(opt: RewardOption): number {
    if (opt.kind === 'essence') return 0x44ddff;
    return RARITY_COLORS[opt.item.rarity];
  }

  // Начисляет выбранную награду: предмет — в сундук, эссенция — в мету.
  private claimReward(opt: RewardOption) {
    if (opt.kind === 'item') {
      this.carryOut(opt.item); // addToChest + recordItemCarriedOut
    } else {
      for (const tier of Object.keys(opt.essence) as EssenceTier[]) {
        const amount = opt.essence[tier] ?? 0;
        if (amount > 0) MetaStore.addEssence(tier, amount);
      }
    }
  }

  // Финал похода: рюкзак в сундук, зона зачтена, возврат в лагерь.
  private finishExpedition() {
    this.dumpBackpackToChest();
    MetaStore.completeArea(this.zoneId);
    MetaStore.recordZoneReturned(this.zoneId);
    EventBus.emit('expedition_returned', this.zoneId);
    this.scene.start('CampScene');
  }

  // Рюкзак вываливается в сундук — на любом выходе из похода, включая смерть (лут гарантирован).
  private dumpBackpackToChest() {
    for (const item of this.backpack) this.carryOut(item);
    this.backpack = [];
    this.refreshBackpackGrid();
  }

  // Предмет покидает поход и попадает в сундук — фиксируем как «вынесенный».
  private carryOut(item: ItemInstance) {
    MetaStore.addToChest(item);
    MetaStore.recordItemCarriedOut(item.item_id);
  }

  private pause() {
    this.isPaused = true;
    this.time.paused = true;
    // Спрайтовые анимации крутятся независимо от this.time — морозим их отдельно.
    this.anims.pauseAll();
    this.pauseBtn?.setFillStyle(0x2244aa);
    this.pauseIcon?.setColor('#ffffff');
  }

  private resume() {
    this.isPaused = false;
    this.time.paused = false;
    this.anims.resumeAll();
    this.pauseBtn?.setFillStyle(0x222233);
    this.pauseIcon?.setColor('#aaaacc');
  }

  // Нарезает уже загруженное изображение-лист на count горизонтальных кадров
  // (frameWidth = ширина текстуры / count). Идемпотентно достаточно вызвать один раз.
  private sliceCharSheet(key: string, count: number) {
    const tex = this.textures.get(key);
    const src = tex.getSourceImage() as HTMLImageElement;
    const fw = Math.floor(src.width / count);
    const fh = src.height;
    for (let i = 0; i < count; i++) {
      if (!tex.has(`${i}`)) tex.add(i, 0, i * fw, 0, fw, fh);
    }
  }

  // Запускает walk-петлю на время ходьбы (герой шагает на месте, фон скроллится).
  private startWalking() {
    this.isWalking = true;
    this.walkTimer = 0;
    this.walkStepTimer = this.STEP_INTERVAL; // первый шаг звучит сразу на первом апдейте
    this.updateForeMask(); // враги уже убраны → остаётся овал только вокруг героя
    if (this.heroAnimPrefix && this.heroSprite instanceof Phaser.GameObjects.Sprite) {
      const key = `${this.heroAnimPrefix}-walk`;
      if (this.anims.exists(key)) {
        this.heroSprite.play(key, true);
        this.heroSprite.setDisplaySize(100, 140);
      }
    }
  }

  private playHeroAnim(key: string, restart = false) {
    if (this.heroSprite instanceof Phaser.GameObjects.Sprite) {
      const attackKey = `${this.heroAnimPrefix}-attack`;
      if (key !== attackKey && this.heroSprite.anims.currentAnim?.key === attackKey && this.heroSprite.anims.isPlaying) return;
      this.heroSprite.play(key, !restart);
      this.heroSprite.setDisplaySize(100, 140);
    }
  }

  // Случайная точка в нижних 2/3 модельки (для цифр урона, чтобы не спавнились в одной точке).
  // getBounds учитывает origin спрайта/прямоугольника (у героя центр, у мобов низ).
  private damageSpot(obj: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle): { x: number; y: number } {
    const b = obj.getBounds();
    const x = b.x + Math.random() * b.width;
    const y = b.y + b.height / 3 + Math.random() * (b.height * 2 / 3);
    return { x, y };
  }

  // Короткий рывок спрайта врага по X: dir<0 — выпад к герою (атака), dir>0 — отскок (урон).
  private jerkEnemy(idx: number, dir: number) {
    const g = this.enemyGraphics[idx];
    if (!g) return;
    const spr = g.sprite;
    this.tweens.killTweensOf(spr);
    spr.x = g.baseX;
    this.tweens.add({
      targets: spr,
      x: g.baseX + dir,
      duration: 90,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => { spr.x = g.baseX; },
    });
  }

  private flashSprite(sprite: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite, color: number) {
    // Длительность сжимаем обратно скорости боя: на ×2/×4 удары прилетают чаще (движок
    // масштабирует интервалы), и фиксированные 150 мс не успевали бы сойти между ударами —
    // тинт копился бы и враг оставался красным. Пол в 50 мс — чтобы вспышка была видна.
    const speed = this.engine?.state.speedMultiplier ?? 1;
    const ms = Math.max(50, 150 / speed);

    // Держим не больше одного отложенного сброса на спрайт. Без этого таймеры
    // накладываются: у прямоугольника «orig» успевает захватить цвет ЧУЖОЙ вспышки
    // и восстановление возвращает моделью в красный/жёлтый — она застревает.
    const prev = sprite.getData('flashTimer') as Phaser.Time.TimerEvent | undefined;
    if (prev) prev.remove(false);

    if (sprite instanceof Phaser.GameObjects.Sprite) {
      sprite.setTint(color);
      const timer = this.time.delayedCall(ms, () => {
        sprite.setData('flashTimer', undefined);
        if (sprite.active) sprite.clearTint();
      });
      sprite.setData('flashTimer', timer);
    } else {
      // Базовый цвет запоминаем один раз — повторная вспышка не должна «зафиксировать»
      // предыдущий цвет вспышки как базовый.
      let base = sprite.getData('baseFill') as number | undefined;
      if (base === undefined) { base = sprite.fillColor; sprite.setData('baseFill', base); }
      sprite.setFillStyle(color);
      const timer = this.time.delayedCall(ms, () => {
        sprite.setData('flashTimer', undefined);
        if (sprite.active) sprite.setFillStyle(base!);
      });
      sprite.setData('flashTimer', timer);
    }
  }

  update(_time: number, delta: number) {
    if (this.isPaused) return;

    if (this.delayed) {
      this.delayed.remaining -= delta;
      if (this.delayed.remaining <= 0) {
        const fn = this.delayed.fn;
        this.delayed = null;
        fn();
      }
    }

    if (this.isWalking) {
      this.walkTimer += delta * this.speedMult;
      this.scrollBackground(delta * this.speedMult);

      // Шаги — по реальному времени, в такт анимации ходьбы (она не масштабируется скоростью).
      this.walkStepTimer += delta;
      if (this.walkStepTimer >= this.STEP_INTERVAL) {
        this.walkStepTimer = 0;
        SoundManager.play('walking');
      }

      if (this.walkTimer >= this.WALK_DURATION) {
        this.isWalking = false;
        this.walkTimer = 0;
        if (this.heroAnimPrefix) this.playHeroAnim(`${this.heroAnimPrefix}-idle`);
        this.beginFight();
      }

      return;
    }

    if (this.engine && this.engine.state.phase === 'fighting') {
      this.engine.update(delta);
      this.updateEnemyGraphics();
      this.updateHeroHpBar();
      this.updateWeaponChargeOverlays();
    }
  }

  private onQuestCompleted(_questId: string) {
    this.questTracker.rebuild();
  }
}
