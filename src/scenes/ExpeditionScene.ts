import Phaser from 'phaser';
import { FONT_FAMILY } from '../ui/theme';
import { MetaStore } from '../core/MetaStore';
import { EventBus } from '../core/EventBus';
import { getZoneConfig, zoneBgKey, ZONE_BG_VARIANTS, BG_LAYERS, type BgLayer } from '../zones/registry';
import { CombatEngine } from '../combat/CombatEngine';
import { rollLootTable, buildRewardOptions, type RewardOption } from '../combat/loot';
import { getItemConfig } from '../items/registry';
import { sumMeta } from '../items/meta';
import { spawnFloater } from '../ui/Floater';
import { SoundManager } from '../core/SoundManager';
import { Tooltip } from '../ui/Tooltip';
import { DragDropManager } from '../ui/DragDropManager';
import type { CombatState, EnemyState, SummonPlan } from '../combat/types';
import { BOARD_SLOTS, placementAnchor } from '../combat/types';
import type { ItemInstance, SlotId } from '../core/MetaStore';
import { ARMOR_STAND_COUNT } from '../core/MetaStore';
import type { SlotType, Rarity, EssenceTier } from '../items/types';
import type { ZoneConfig, MobConfig, EnemySpec, PhaseOverride, SummonRef } from '../zones/types';
import { getMobConfig } from '../mobs/registry';
import { itemIconKey } from '../items/icons';
import { slotSilhouetteKey, zoneDecorKey } from '../ui/silhouettes';
import { goldTag, essenceTag } from '../ui/priceTag';
import { ESSENCE_TIERS } from '../items/craft';
import { QuestTracker } from '../ui/QuestTracker';
import { ResourceHUD } from '../ui/ResourceHUD';
import { VolumeControl } from '../ui/VolumeControl';

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

const RARITY_COLORS: Record<Rarity, number> = {
  common: 0xffffff,
  uncommon: 0x55ff55,
  rare: 0x5555ff,
  epic: 0xaa00ff,
  legendary: 0xff8800,
};


const EQUIP_SLOTS: SlotId[] = ['head', 'body', 'legs', 'hand_left', 'hand_right', 'ring', 'amulet'];

type EnemyGraphic = {
  baseX: number;
  shadow: Phaser.GameObjects.Ellipse;
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
  // Лента лута: предмет въезжает справа и упирается в левый край, копясь в очередь. В сундук
  // (carryOut) он уходит только когда лента забита и место под новый предмет освобождают слева.
  private lootQueue: ItemInstance[] = [];
  private beltItems: { item: ItemInstance; x: number; exiting: boolean; sprite: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Image }[] = [];

  private questTracker!: QuestTracker;
  private resourceHUD!: ResourceHUD;
  private heroHpFill!: Phaser.GameObjects.Rectangle;
  private heroHpText!: Phaser.GameObjects.Text;
  private heroSprite!: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite;
  private heroAnimPrefix: string | null = null;
  private heroAtkBars: { fill: Phaser.GameObjects.Rectangle; bg: Phaser.GameObjects.Rectangle }[] = [];
  private progressFill!: Phaser.GameObjects.Rectangle;
  private progressText!: Phaser.GameObjects.Text;
  private speedBtns: Phaser.GameObjects.Rectangle[] = [];
  private isPaused = false;
  // Отдельно от isPaused: не даёт открыть второй диалог поверх первого повторным кликом
  // по "В лагерь", в т.ч. когда игра уже была на паузе кнопкой/SPACE до этого клика.
  private retreatDialogOpen = false;
  // Отложенный переход (бой→ходьба, победа, смерть). Тикается в update() и завязан только на
  // isPaused — в отличие от this.time.delayedCall, не замораживается при рассинхроне часов.
  private delayed: { remaining: number; fn: () => void } | null = null;
  private pauseBtn: Phaser.GameObjects.Rectangle | null = null;
  private pauseIcon: Phaser.GameObjects.Text | null = null;
  private bgLayers: { sprite: Phaser.GameObjects.TileSprite; scrollFactor: number; offset: number; layer: BgLayer }[] = [];
  private foreMaskRT: Phaser.GameObjects.RenderTexture | null = null;

  private enemyGraphics: (EnemyGraphic | null)[] = [];

  private equipSlotObjs: { bg: Phaser.GameObjects.Rectangle; icon: Phaser.GameObjects.Image }[] = [];
  // «Рука» для экипировки прямо в походе: предмет берётся с ленты и кладётся в слот.
  private dragDrop!: DragDropManager;
  private equipRefreshPending = false;
  // Табы смены стойки прямо в походе (1/2/3): выбор активной стойки на лету.
  private standTabs: { bg: Phaser.GameObjects.Rectangle; lbl: Phaser.GameObjects.Text }[] = [];
  private tooltip!: Tooltip;
  private statusText!: Phaser.GameObjects.Text;
  private victoryContainer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'ExpeditionScene' });
  }

  // Кэрриовер при «Продолжить поиски» — только HP и визуал ленты (рюкзак/схрон/крафт убраны).
  private carryoverBelt: ItemInstance[] = [];
  private carryoverQueue: ItemInstance[] = [];
  // Текущее здоровье героя переносится при «Продолжить поиски» (не восстанавливается).
  private carryoverHp: number | null = null;
  // Индекс стойки-пресета, с которой герой ушёл в поход (0..2).
  private standIndex = 0;

  init(data: { zoneId: string; standIndex?: number; speedMult?: number; carryoverBelt?: ItemInstance[]; carryoverQueue?: ItemInstance[]; carryoverHp?: number }) {
    this.zoneId = data.zoneId ?? 'dead-fields';
    // Заходим с последней выбранной стойкой (на стенде или в прошлом бою); её можно сменить в бою.
    this.standIndex = data.standIndex ?? MetaStore.getActiveStand();
    // Свежий поход стартует с ускорением прошлого забега; на переходе между зонами
    // приходит явный speedMult (carryover) и имеет приоритет.
    this.speedMult = data.speedMult ?? MetaStore.getRunSpeed();
    this.carryoverBelt = data.carryoverBelt ?? [];
    this.carryoverQueue = data.carryoverQueue ?? [];
    this.carryoverHp = data.carryoverHp ?? null;
  }

  create() {
    this.engine = undefined;
    this.isWalking = false;
    this.walkTimer = 0;
    this.walkStepTimer = 0;
    this.beltItems = [];
    this.lootQueue = [];
    this.equipSlotObjs = [];
    this.equipRefreshPending = false;
    this.standTabs = [];
    this.heroAtkBars = [];
    this.enemyGraphics = [];
    this.isPaused = false;
    // Часы сцены переживают её рестарт — не оставляем this.time замороженным между прогонами.
    this.time.paused = false;
    this.delayed = null;
    this.pauseBtn = null;
    this.pauseIcon = null;
    this.bgLayers = [];
    this.foreMaskRT = null;

    this.zoneCfg = getZoneConfig(this.zoneId);
    EventBus.emit('expedition_started');
    // Счётчик заходов: «Продолжить поиски» перезапускает сцену с переносом HP —
    // это та же экспедиция, повторно не считаем.
    if (this.carryoverHp === null) MetaStore.recordZoneEntered(this.zoneId);

    // Фоновый эмбиент похода (один и тот же для всех зон). Заменяет лагерные слои;
    // при возврате в лагерь CampScene перебьёт его своим набором.
    SoundManager.playMusicLayers([{ key: 'amb_draft', volume: 0.2 }]);

    this.events.once('shutdown', () => {
      // На случай выхода из сцены в состоянии паузы — не оставляем глобальный
      // менеджер анимаций замороженным для следующей сцены.
      this.anims.resumeAll();
      EventBus.off('quest_completed', this.onQuestCompleted, this);
      this.resourceHUD.destroy();
      this.dragDrop?.destroy();
    });
    this.input.keyboard!.on('keydown-SPACE', () => { if (this.isPaused) this.resume(); else this.pause(); });
    const speeds = [1, 2, 4];
    ['ONE', 'TWO', 'THREE'].forEach((key, i) => {
      this.input.keyboard!.on(`keydown-${key}`, () => {
        this.speedMult = speeds[i];
        MetaStore.setRunSpeed(speeds[i]);
        if (this.engine) this.engine.state.speedMultiplier = speeds[i];
        this.speedBtns.forEach((b, idx) => b.setFillStyle(idx === i ? 0x2244aa : 0x222233));
      });
    });
    this.dragDrop = new DragDropManager(this);
    this.setupHandInput();
    this.initEquipmentFromStand();
    this.generateFightPlan();
    this.buildUI();
    new VolumeControl(this);
    this.resourceHUD = new ResourceHUD(this, this.tooltip);
    this.questTracker = new QuestTracker(this);
    EventBus.on('quest_completed', this.onQuestCompleted, this);
    // Перенос ленты при «Продолжить поиски» (только визуал — предметы всё равно уйдут в сундук).
    for (const item of this.carryoverBelt) this.addToBelt(item);
    for (const item of this.carryoverQueue) this.lootQueue.push(item);
    this.carryoverBelt = [];
    this.carryoverQueue = [];
    this.startNextFight();
  }

  private initEquipmentFromStand() {
    const stand = MetaStore.getArmorStand(this.standIndex);
    for (const slot of EQUIP_SLOTS) {
      this.equipment[slot] = stand[slot] ?? undefined;
    }
  }

  private generateFightPlan() {
    // Boss-only зона (пустой mob_pool или нет mob_loot) ⇒ рядовых боёв нет, сразу босс.
    const hasMobs = (this.zoneCfg.mob_pool?.length ?? 0) > 0 && !!this.zoneCfg.mob_loot;
    let count = 0;
    if (hasMobs && this.zoneCfg.fights) {
      const { min, max } = this.zoneCfg.fights;
      const base = min + Math.floor(Math.random() * (max - min + 1));
      // Длина забега ± модификатор обуви (фиксируется при старте), минимум 1 рядовой бой (§4.D).
      count = Math.max(1, base + sumMeta(this.equipment).fightDelta);
    }
    this.totalFights = count + 1;
    this.fightPlan = [...Array(count).fill('mob'), 'boss'] as ('mob' | 'boss')[];
    this.currentFightIdx = 0;
  }

  private buildUI() {
    this.add.rectangle(640, 400, 1280, 800, 0x111122).setDepth(-10);
    this.tooltip = new Tooltip(this);
    this.buildProgressBar();
    this.buildBattleArea();
    this.buildLootBelt();
    this.buildBottomPanel();
    this.buildSpeedControls();
    this.buildStatusText();
    this.victoryContainer = this.add.container(0, 0).setDepth(100).setVisible(false);
  }

  private buildProgressBar() {
    this.add.text(640, 10, this.zoneCfg.name, {
      fontSize: '16px', fontFamily: FONT_FAMILY, color: '#cccccc',
    }).setOrigin(0.5, 0).setDepth(2);

    const barW = 864;
    const barX = 640 - barW / 2;
    const barY = 44;
    const barH = 16;

    this.add.rectangle(barX + barW / 2, barY + barH / 2, barW, barH, 0x222233).setStrokeStyle(1, 0x444455).setDepth(2);
    this.progressFill = this.add.rectangle(barX, barY + barH / 2, 4, barH - 4, 0x4488cc).setOrigin(0, 0.5).setDepth(2);
    this.progressText = this.add.text(640, barY + barH / 2, '', {
      fontSize: '11px', fontFamily: FONT_FAMILY, color: '#aaaaaa',
    }).setOrigin(0.5).setDepth(2);
  }

  private updateProgressBar() {
    const progress = this.currentFightIdx / this.totalFights;
    const maxW = 864;
    this.progressFill.setSize(Math.max(4, progress * maxW), 14);
    this.progressText.setText(`Бой ${this.currentFightIdx} / ${this.totalFights}`);
  }

  private buildBattleArea() {
    const folder = this.zoneCfg.id;
    if (ZONE_BG_VARIANTS[folder] && this.textures.exists(zoneBgKey(folder, 'far', 1))) {
      this.buildParallaxBackground(folder);
    } else {
      this.add.rectangle(640, 200, 1280, 320, 0x8899aa).setDepth(-3);
    }
    this.add.line(0, 360, 0, 360, 1280, 360, 0x333355).setOrigin(0);

    const hx = 560;
    this.add.ellipse(hx, 287, 70, 16, 0x000000, 0.45).setDepth(4);
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
    this.heroHpText = this.add.text(hx, 323, '', { fontSize: '11px', fontFamily: FONT_FAMILY, color: '#aaffaa' }).setOrigin(0.5);

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
    // низ fore = 271+75 = 346: на 2px заходит за верх ленты (344), чтобы не было зазора с near;
    // иконки лута начинаются ниже (y≈348), так что перекрытие невидимо.
    fore: { cy: 271, h: 150, depth:  8, scroll: 1.50 },
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
    for (const layer of BG_LAYERS) {
      const count = variants[layer];
      if (!count) continue;
      const variant = 1 + Math.floor(Math.random() * count); // случайный вариант на старте
      const key = zoneBgKey(folder, layer, variant);
      if (!this.textures.exists(key)) continue;

      const r = ExpeditionScene.LAYER_RENDER[layer];
      const scroll = ExpeditionScene.ZONE_LAYER_SCROLL[folder]?.[layer] ?? r.scroll;
      const src = this.textures.get(key).getSourceImage() as HTMLImageElement;
      const scale = r.scale ?? (r.fitH ?? r.h) / src.height;
      const ts = this.add.tileSprite(640, r.cy, 1280, r.h, key).setDepth(r.depth);
      ts.tileScaleX = scale;
      ts.tileScaleY = scale;
      this.bgLayers.push({ sprite: ts, scrollFactor: scroll, offset: 0, layer });
    }
    const foreSprites = this.bgLayers.filter(l => l.layer === 'fore').map(l => l.sprite);
    this.buildForeMask(foreSprites);
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
  private buildForeMask(foreSprites: Phaser.GameObjects.TileSprite[]) {
    if (foreSprites.length === 0) return;
    this.ensureHoleBrush();
    const rt = this.add.renderTexture(640, 400, 1280, 800).setVisible(false);
    this.foreMaskRT = rt;
    const mask = rt.createBitmapMask();
    for (const fs of foreSprites) fs.setMask(mask);
    this.updateForeMask();
  }

  // Перерисовывает «дыры»: вокруг героя (x=560) и каждого живого врага.
  private updateForeMask() {
    const rt = this.foreMaskRT;
    if (!rt) return;
    const HERO_X = 560, HOLE_Y = 250, HOLE_RX = 120, HOLE_RY = 150, R = 256;
    rt.fill(0xffffff, 1);
    const stamp = (x: number) => {
      const brush = this.make.image({ key: 'fore-hole-brush', add: false }).setScale(HOLE_RX / R, HOLE_RY / R);
      rt.erase(brush, x, HOLE_Y);
      brush.destroy();
    };
    stamp(HERO_X);
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
  }

  private updateHeroHpBar() {
    if (!this.engine) return;
    const { hp, maxHp } = this.engine.state.hero;
    const ratio = hp / maxHp;
    this.heroHpFill.setSize(80 * ratio, 10);
    this.heroHpText.setText(`${hp}/${maxHp}`);
  }

  private buildHeroAtkBars() {
    for (const b of this.heroAtkBars) { b.bg.destroy(); b.fill.destroy(); }
    this.heroAtkBars = [];
    if (!this.engine) return;

    const hx = 560;
    const timers = this.engine.state.hero.weaponTimers;
    const count = timers.length === 0 ? 1 : timers.length;
    for (let i = 0; i < count; i++) {
      const ay = 130 - i * 14;
      const bg = this.add.rectangle(hx, ay, 80, 8, 0x222222).setOrigin(0.5).setDepth(6);
      const fill = this.add.rectangle(hx - 40, ay, 0, 8, 0x44aaff).setOrigin(0, 0.5).setDepth(6);
      this.heroAtkBars.push({ bg, fill });
    }
  }

  private updateHeroAtkBars() {
    if (!this.engine) return;
    const { hero } = this.engine.state;
    if (hero.weaponTimers.length === 0) {
      const bar = this.heroAtkBars[0];
      if (bar) {
        const ratio = hero.unarmedTimer / 3000;
        bar.fill.setSize(80 * Math.min(1, ratio), 8);
      }
    } else {
      for (let i = 0; i < hero.weaponTimers.length; i++) {
        const bar = this.heroAtkBars[i];
        if (!bar) continue;
        const t = hero.weaponTimers[i];
        const ratio = t.elapsed / t.interval;
        bar.fill.setSize(80 * Math.min(1, ratio), 8);
      }
    }
  }

  private clearEnemyGraphics() {
    for (const g of this.enemyGraphics) {
      if (!g) continue;
      g.shadow.destroy();
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
    const objs: Phaser.GameObjects.GameObject[] = [
      g.shadow, g.sprite, g.nameText, g.hpBar, g.hpFill, g.hpText,
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

  // Экранный x ячейки доски: 4 слота с шагом 160 (700, 860, 1020, 1180).
  private slotX(slot: number): number {
    return 700 + slot * 160;
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
      const x = this.slotX(e.slot);
      const color = e.isBoss ? 0xaa4422 : 0x884422;

      const shadow = this.add.ellipse(x, 287, 76, 16, 0x000000, 0.45).setDepth(4);

      // Спрайт моба (вписан в бокс с сохранением пропорций, ноги на линии тени y=287).
      // Фолбэк — цветной прямоугольник, если спрайта нет.
      const spriteKey = `mob-${e.id}`;
      let sprite: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite;
      let nameY: number;
      let halfW: number; // половина ширины модельки — чтобы ставить полосы призыва справа от неё
      if (this.textures.exists(spriteKey)) {
        const img = this.textures.get(spriteKey).getSourceImage() as HTMLImageElement;
        const maxW = e.isBoss ? 210 : 150;
        const maxH = e.isBoss ? 165 : 130;
        const sc = Math.min(maxW / img.width, maxH / img.height) * (getMobConfig(e.id).ui?.scale ?? 1);
        const dispH = img.height * sc;
        sprite = this.add.sprite(x, 287, spriteKey).setOrigin(0.5, 1).setDisplaySize(img.width * sc, dispH).setDepth(5);
        nameY = 287 - dispH - 12;
        halfW = (img.width * sc) / 2;
      } else {
        sprite = this.add.rectangle(x, 219, 70, 90, color).setDepth(5);
        nameY = 274;
        halfW = 35;
      }
      const uiAlpha = getMobConfig(e.id).ui?.alpha;
      if (uiAlpha !== undefined) sprite.setAlpha(uiAlpha);
      const nameText = this.add.text(x, nameY, e.name, { fontSize: '10px', fontFamily: FONT_FAMILY, color: '#ddddaa' }).setOrigin(0.5);
      const hpBar = this.add.rectangle(x, 310, 80, 10, 0x333333).setOrigin(0.5);
      const hpFill = this.add.rectangle(x - 40, 310, 80, 10, 0xaa4444).setOrigin(0, 0.5);
      const hpText = this.add.text(x, 323, `${e.hp}/${e.maxHp}`, { fontSize: '10px', fontFamily: FONT_FAMILY, color: '#ffaaaa' }).setOrigin(0.5);

      const atkBars: { fill: Phaser.GameObjects.Rectangle; bg: Phaser.GameObjects.Rectangle }[] = [];
      for (let t = 0; t < e.attackTimers.length; t++) {
        const ay = 130 - t * 14;
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
        const defParts: string[] = [];
        if (def?.armor) defParts.push(`Броня ${def.armor}`);
        if (def?.dodge) defParts.push(`Уклон ${Math.round(def.dodge * 100)}%`);
        if (def?.thorns) defParts.push(`Шипы ${def.thorns}`);
        this.tooltip.showText([
          eCapture.name,
          `HP: ${Math.max(0, eCapture.hp)}/${eCapture.maxHp}`,
          `ATK: ${eCapture.attackTimers.map(t => `${t.damage}/${(t.interval / 1000).toFixed(1)}s`).join(', ')}`,
          defParts.length ? defParts.join(' · ') : '',
          eCapture.isBoss ? 'БОСС' : '',
        ].filter(Boolean), x + 50, 140);
      });
      sprite.on('pointerout', () => this.tooltip.hide());

      this.enemyGraphics[idx] = { baseX: x, shadow, sprite, nameText, hpBar, hpFill, hpText, atkBars, summonBars };
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

  private buildLootBelt() {
    const beltY = 370;
    this.add.rectangle(640, beltY, 1280, 52, 0x0a0a18).setStrokeStyle(1, 0x333355);
    this.add.text(10, beltY, 'ЛЕНТА', { fontSize: '9px', fontFamily: FONT_FAMILY, color: '#333355' }).setOrigin(0, 0.5);
  }

  // Лента-очередь: предмет въезжает справа, упирается в левый край и копится. Уходит в сундук
  // (carryOut) только при переполнении — когда под новый предмет не хватает места. Ни клика, ни drag.
  private readonly BELT_SPACING = 56;
  private readonly BELT_LEFT_X = 40;      // центр крайнего левого (упорного) предмета
  private readonly BELT_ENTRY_X = 1240;   // точка въезда справа
  // Сколько предметов помещается от левого упора до точки въезда (не считая уезжающих).
  private readonly BELT_CAPACITY =
    Math.floor((1240 - 40) / 56) + 1;

  private addToBelt(item: ItemInstance) {
    const beltY = 370;
    // Новый предмет встаёт правее самого правого — конвейер сам подтащит его к очереди.
    const rightmost = this.beltItems.reduce((m, o) => Math.max(m, o.x), this.BELT_ENTRY_X - this.BELT_SPACING);
    const x = Math.max(this.BELT_ENTRY_X, rightmost + this.BELT_SPACING);

    const sprite = this.add.rectangle(x, beltY, 48, 44, 0x2a2a3a)
      .setStrokeStyle(2, RARITY_COLORS[item.rarity])
      .setInteractive({ useHandCursor: false });
    const label = this.add.image(x, beltY, itemIconKey(item.item_id))
      .setDisplaySize(36, 36)
      .setDepth(3);

    this.beltItems.push({ item, x, exiting: false, sprite, label });

    // Наведение показывает предмет — единственное разрешённое взаимодействие с лентой.
    sprite.on('pointerover', () => this.tooltip.showItem(item, sprite.x - 100, beltY - 80));
    sprite.on('pointerout', () => this.tooltip.hide());
  }

  private tickBelt(dt: number) {
    if (this.beltItems.length === 0) return;
    const speed = 200 * (dt / 1000);

    // Переполнение: всё, что не влезает в BELT_CAPACITY, помечаем «уезжающим» — только эти
    // предметы едут за левый край и уходят в сундук. Уезжающие всегда слева (старейшие).
    const overflow = this.beltItems.filter(o => !o.exiting).length - this.BELT_CAPACITY;
    if (overflow > 0) {
      let flagged = 0;
      for (const o of this.beltItems) {
        if (flagged >= overflow) break;
        if (!o.exiting) { o.exiting = true; flagged++; }
      }
    }

    const survivors: typeof this.beltItems = [];
    let slot = 0; // packed-позиция среди не-уезжающих, слева направо
    for (const obj of this.beltItems) {
      const targetX = obj.exiting ? -60 : this.BELT_LEFT_X + slot * this.BELT_SPACING;
      if (!obj.exiting) slot++;
      // Двигаем только влево к цели — предметы въезжают справа и не откатываются назад.
      if (obj.x > targetX) obj.x = Math.max(targetX, obj.x - speed);

      if (obj.exiting && obj.x <= 30) {
        this.carryOut(obj.item);
        obj.sprite.destroy();
        obj.label.destroy();
        continue;
      }
      obj.sprite.setX(obj.x);
      obj.label.setX(obj.x);
      survivors.push(obj);
    }
    this.beltItems = survivors;
  }

  private buildBottomPanel() {
    // Панель занимает всё под лентой (beltY=370, низ=396) до низа экрана (800).
    // Осталась только экипировка (просмотр стойки) — рюкзак/схрон/крафт убраны.
    const zCy = 598;
    const zH  = 404;

    this.add.rectangle(640, zCy, 1280, zH, 0x201510).setStrokeStyle(2, 0x6b4020);
    this.add.text(640, 404, 'Экипировка · стойка', {
      fontSize: '11px', fontFamily: FONT_FAMILY, color: '#a06030',
    }).setOrigin(0.5, 0);

    this.add.image(640, 600, zoneDecorKey('warrior')).setTint(0xa06030).setAlpha(0.16);

    this.buildStandTabs(640, 434);
    this.buildEquipSlots();
  }

  // Табы смены активной стойки в походе (1/2/3). Клик — мгновенная замена снаряжения:
  // this.equipment пересобирается, а в идущем бою — и герой (HP переносится).
  private buildStandTabs(cx: number, y: number) {
    this.standTabs = [];
    const W = 40, H = 22, GAP = 6;
    const total = ARMOR_STAND_COUNT * W + (ARMOR_STAND_COUNT - 1) * GAP;
    const startX = cx - total / 2 + W / 2;
    for (let i = 0; i < ARMOR_STAND_COUNT; i++) {
      const x = startX + i * (W + GAP);
      const bg = this.add.rectangle(x, y, W, H, 0x222233)
        .setStrokeStyle(1, 0x444455)
        .setInteractive({ useHandCursor: true });
      const lbl = this.add.text(x, y, `${i + 1}`, {
        fontSize: '10px', fontFamily: FONT_FAMILY, color: '#8899aa',
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
    for (const o of this.equipSlotObjs) { o.bg.destroy(); o.icon.destroy(); }
    this.equipSlotObjs = [];
    this.buildEquipSlots();
  }

  // Смена стойки на лету: обновляет мету (запоминаем выбор), снаряжение и — в идущем бою —
  // самого героя. Длина забега уже зафиксирована при входе, её ботинки новой стойки не меняют.
  private switchStand(i: number) {
    if (i === this.standIndex) return;
    this.standIndex = i;
    MetaStore.setActiveStand(i);
    this.initEquipmentFromStand();
    this.refreshStandTabs();
    this.refreshEquipSlots();
    this.tooltip.hide();

    // HP переносим по абсолюту (maxHp не зависит от брони) — смена стойки не лечит и не ранит.
    this.applyEquipToHero();
    this.showStatus(`Стойка ${i + 1}`, 800);
  }

  // Экипировка героя — только просмотр выбранной стойки (без drag, без ячеек рюкзака/крафта).
  private buildEquipSlots() {
    // Крестовая раскладка вокруг портрета (см. docs/art-spec.md): ring/head/amulet сверху,
    // hand_left/body/hand_right в центре, legs снизу.
    const cx = 640;
    const originY = 518;
    const SIZE = 48;

    const ANATOMY: Record<SlotId, { dx: number; dy: number }> = {
      ring:        { dx: -54, dy:  28 },
      head:        { dx:   0, dy:   0 },
      amulet:      { dx:  54, dy:  28 },
      hand_left:   { dx: -54, dy:  84 },
      body:        { dx:   0, dy:  56 },
      hand_right:  { dx:  54, dy:  84 },
      legs:        { dx:   0, dy: 112 },
    };

    for (const slotId of EQUIP_SLOTS) {
      const { dx, dy } = ANATOMY[slotId];
      const x = cx + dx;
      const y = originY + dy;
      const item = this.equipment[slotId];

      const bg = this.add.rectangle(x, y, SIZE, SIZE, 0x1a1a2a)
        .setStrokeStyle(1, item ? RARITY_COLORS[item.rarity] : 0x333344)
        .setInteractive({ useHandCursor: false });

      const icon = this.add.image(x, y, item ? itemIconKey(item.item_id) : slotSilhouetteKey(slotId))
        .setDisplaySize(36, 36)
        .setAlpha(item ? 1 : 0.35)
        .setDepth(4);

      // Наведение показывает предмет.
      bg.on('pointerover', () => {
        const cur = this.equipment[slotId];
        if (cur) this.tooltip.showItem(cur, x + SIZE, y - 40);
      });
      bg.on('pointerout', () => this.tooltip.hide());

      // Слот-цель для «руки»: предмет с ленты можно надеть, снятый — уходит обратно в руку.
      this.dragDrop.registerSlot({
        id: `equip:${slotId}`,
        slotType: slotId as SlotType,
        placeable: true,
        rect: new Phaser.Geom.Rectangle(x - SIZE / 2, y - SIZE / 2, SIZE, SIZE),
        item: item ?? null,
        onRemove: () => { const it = this.equipment[slotId] ?? null; this.setEquip(slotId, undefined); return it; },
        onAccept: (it) => { this.setEquip(slotId, it); },
      });

      this.equipSlotObjs.push({ bg, icon });
    }
  }

  // ─── Экипировка «в руке» прямо в походе ──────────────────────────────

  // Клик по ленте берёт предмет в руку; клик по слоту надевает; клик мимо — возврат на ленту.
  private setupHandInput() {
    this.input.on('pointerup', (ptr: Phaser.Input.Pointer) => {
      if (this.dragDrop.isHolding()) {
        const target = this.dragDrop.findPlaceableAt(ptr.x, ptr.y);
        if (target) {
          if (this.dragDrop.placeAt(target.id) === 'rejected') this.showStatus('Не тот слот', 800);
        } else {
          const held = this.dragDrop.dropHeld();
          if (held) this.addToBelt(held); // мимо слота — предмет возвращается на ленту
        }
        return;
      }
      // Свободная рука: клик по предмету на ленте берёт его.
      const belt = this.beltItemAt(ptr.x, ptr.y);
      if (belt) {
        this.removeBeltItem(belt);
        this.tooltip.hide();
        this.dragDrop.holdItem(belt.item, 'belt');
      }
    });
  }

  private beltItemAt(x: number, y: number) {
    return this.beltItems.find(o => !o.exiting
      && Math.abs(x - o.x) <= 24 && Math.abs(y - 370) <= 22);
  }

  private removeBeltItem(obj: ExpeditionScene['beltItems'][number]) {
    obj.sprite.destroy();
    obj.label.destroy();
    this.beltItems = this.beltItems.filter(o => o !== obj);
  }

  // Надеть/снять предмет: обновляем снимок, стойку в мете (персист) и — в идущем бою — героя.
  private setEquip(slotId: SlotId, item: ItemInstance | undefined) {
    this.equipment[slotId] = item;
    MetaStore.setArmorStandSlot(this.standIndex, slotId, item ?? null);
    this.scheduleEquipRefresh();
  }

  // Перестроение слотов ломает объекты, из которых нас позвали (onAccept/onRemove) — откладываем.
  private scheduleEquipRefresh() {
    if (this.equipRefreshPending) return;
    this.equipRefreshPending = true;
    this.time.delayedCall(0, () => {
      this.equipRefreshPending = false;
      this.refreshEquipSlots();
      this.applyEquipToHero();
    });
  }

  // Пересобирает героя из текущего снаряжения (для идущего боя), сохраняя абсолютный HP.
  private applyEquipToHero() {
    if (!this.engine || this.engine.state.phase !== 'fighting') return;
    const heroEquip: Partial<Record<SlotType, ItemInstance>> = {};
    for (const s of EQUIP_SLOTS) {
      if (this.equipment[s]) heroEquip[s as SlotType] = this.equipment[s]!;
    }
    const fresh = CombatEngine.buildInitialHero(heroEquip);
    fresh.hp = Math.min(this.engine.state.hero.hp, fresh.maxHp);
    this.engine.state.hero = fresh;
    this.buildHeroAtkBars();
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
    const rowLeft = 1280 - totalW - 10;

    const centers = [0, 1, 2, 3].map(i => rowLeft + BTN_W / 2 + i * (BTN_W + GAP));

    // Пауза
    this.pauseBtn = this.add.rectangle(centers[0], rowY, BTN_W, BTN_H, 0x222233)
      .setStrokeStyle(1, 0x444466)
      .setInteractive({ useHandCursor: true });
    this.pauseIcon = this.add.text(centers[0], rowY, '⏸', { fontSize: '13px', fontFamily: FONT_FAMILY, color: '#aaaacc' }).setOrigin(0.5);
    this.pauseBtn.on('pointerover', () => { if (!this.isPaused) this.pauseBtn!.setFillStyle(0x2a2a44); });
    this.pauseBtn.on('pointerout',  () => { if (!this.isPaused) this.pauseBtn!.setFillStyle(0x222233); });
    this.pauseBtn.on('pointerdown', () => { if (this.isPaused) this.resume(); else this.pause(); });

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

  // Подтверждение отступления: лут с ленты сохраняется, зона НЕ засчитывается.
  private confirmRetreat() {
    if (this.retreatDialogOpen) return;
    this.retreatDialogOpen = true;
    // Если игрок уже сам поставил игру на паузу до клика — не снимаем её при отмене диалога.
    const wasPaused = this.isPaused;
    if (!wasPaused) this.pause();
    const c = this.add.container(0, 0).setDepth(200);
    const overlay = this.add.rectangle(640, 400, 1280, 800, 0x000000, 0.7).setInteractive();
    const box = this.add.rectangle(640, 400, 420, 190, 0x1a1a2a).setStrokeStyle(2, 0x664444);
    const title = this.add.text(640, 340, 'Вернуться в лагерь?', {
      fontSize: '20px', fontFamily: FONT_FAMILY, color: '#ffcc88',
    }).setOrigin(0.5);
    const sub = this.add.text(640, 378, 'Собранный лут сохранится.\nЗона не будет зачтена.', {
      fontSize: '13px', fontFamily: FONT_FAMILY, color: '#bbbbbb', align: 'center',
    }).setOrigin(0.5);

    const yesBtn = this.add.rectangle(552, 445, 150, 40, 0x332222).setStrokeStyle(1, 0x885555)
      .setInteractive({ useHandCursor: true });
    const yesLbl = this.add.text(552, 445, 'В лагерь', { fontSize: '14px', fontFamily: FONT_FAMILY, color: '#ddaaaa' }).setOrigin(0.5);
    const noBtn = this.add.rectangle(728, 445, 150, 40, 0x222233).setStrokeStyle(1, 0x445588)
      .setInteractive({ useHandCursor: true });
    const noLbl = this.add.text(728, 445, 'Остаться', { fontSize: '14px', fontFamily: FONT_FAMILY, color: '#aaccff' }).setOrigin(0.5);

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

  // Отступление: лут с ленты уходит в сундук, зона не засчитывается, возврат в лагерь.
  private retreatToCamp() {
    this.collectBeltToChest();
    this.scene.start('CampScene');
  }

  private buildStatusText() {
    this.statusText = this.add.text(640, 450, '', {
      fontSize: '16px', fontFamily: FONT_FAMILY, color: '#ffcc44',
    }).setOrigin(0.5).setDepth(10);
  }

  private showStatus(msg: string, duration = 2500) {
    this.statusText.setText(msg);
    this.time.delayedCall(duration, () => { if (this.statusText) this.statusText.setText(''); });
  }

  private startNextFight() {
    if (this.currentFightIdx >= this.fightPlan.length) {
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

    const hero = CombatEngine.buildInitialHero(heroEquip);
    if (this.engine) {
      hero.hp = this.engine.state.hero.hp;
      hero.maxHp = this.engine.state.hero.maxHp;
    } else if (this.carryoverHp !== null) {
      // Первый бой после «Продолжить поиски»: здоровье переносится из прошлого прогона,
      // а не восстанавливается. Дальше HP ведёт this.engine.
      hero.hp = Math.max(1, Math.min(this.carryoverHp, hero.maxHp));
      this.carryoverHp = null;
    }

    const rootMobId = isBoss ? this.zoneCfg.boss.mob_id : this.rollMob().id;
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
      onDamageDealt: (target, amount, enemyIdx) => {
        if (target === 'hero') {
          SoundManager.play('hero_hurt');
          // Цифра урона — в случайной точке нижних 2/3 модельки (надписи-статусы остаются над головой).
          {
            const p = this.damageSpot(this.heroSprite);
            spawnFloater(this, 'damage', amount, p.x, p.y);
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
            // Цифра урона — в случайной точке нижних 2/3 модельки (надписи Блок/Отражено/мимо остаются над головой).
            const p = this.damageSpot(g.sprite);
            spawnFloater(this, 'damage', amount, p.x, p.y);
            this.flashSprite(g.sprite, 0xff0000);
            this.jerkEnemy(enemyIdx, 16); // отскок от героя при получении урона
          }
          this.updateEnemyGraphics();
        }
      },
      onBlock: (target, enemyIdx) => {
        SoundManager.play('block');
        if (target === 'hero') {
          this.flashSprite(this.heroSprite, 0xffdd00);
          spawnFloater(this, 'block', 0, 560, 130);
        } else {
          // Флэт-броня врага свела удар в ноль → «Отражено» над мобом.
          const g = this.enemyGraphics[enemyIdx];
          if (g) {
            const headY = g.sprite instanceof Phaser.GameObjects.Sprite
              ? g.sprite.y - g.sprite.displayHeight - 10
              : g.sprite.y - 60;
            spawnFloater(this, 'absorb', 0, g.sprite.x, headY);
          }
        }
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
      onEnemyDied: (enemy, enemyIdx, willReuseSlot) => {
        // willReuseSlot=true — это смена формы (фаза), а не смерть: не считаем.
        // Так корректно учитываются саммоны и финальная форма босса, без промежуточных.
        if (!willReuseSlot) MetaStore.recordMobKilled(enemy.id);
        if (willReuseSlot) {
          // Новая форма уже подставлена в state.enemies — пересобираем модельки,
          // чтобы сменился спрайт (updateEnemyGraphics обновляет только имя/HP/полоски).
          this.clearEnemyGraphics();
          this.buildEnemyGraphics(this.engine!.state.enemies);
          return;
        }
        const g = this.enemyGraphics[enemyIdx];
        if (!g) return;
        // Босс на финальной смерти — затемняем (поверх ляжет экран победы). Обычный моб — убираем.
        if (enemy.isBoss) {
          // Гасим отложенный сброс вспышки от добивающего удара — иначе он снимет затемнение.
          const flash = g.sprite.getData('flashTimer') as Phaser.Time.TimerEvent | undefined;
          if (flash) { flash.remove(false); g.sprite.setData('flashTimer', undefined); }
          if (g.sprite instanceof Phaser.GameObjects.Rectangle) g.sprite.setFillStyle(0x333333);
          else g.sprite.setTint(0x333333);
          g.shadow.setAlpha(0.15);
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
    }, resolveSummonSpec, enginePhases);

    this.buildEnemyGraphics(enemies);
    this.buildHeroAtkBars();
    this.updateProgressBar();
  }

  private rollMob(): MobConfig {
    // Вызывается только когда есть рядовые бои (mob_pool непустой); пустой пул — страховка.
    const pool = this.zoneCfg.mob_pool ?? [];
    if (pool.length === 0) return getMobConfig(this.zoneCfg.boss.mob_id);
    const total = pool.reduce((s, e) => s + e.weight, 0);
    let rand = Math.random() * total;
    for (const entry of pool) {
      rand -= entry.weight;
      if (rand <= 0) return getMobConfig(entry.mob_id);
    }
    return getMobConfig(pool[0].mob_id);
  }

  private onFightEnd(_isBoss: boolean) {
    const fightType = this.fightPlan[this.currentFightIdx];

    const magicFind = sumMeta(this.equipment).magicFind;
    const floatX = this.enemyGraphics[0]?.sprite.x ?? 700;
    const floatY = this.enemyGraphics[0]?.sprite.y ?? 185;

    if (fightType === 'mob') {
      if (this.zoneCfg.mob_loot) {
        const loot = rollLootTable(this.zoneCfg.mob_loot, magicFind);
        const gold = loot.gold;
        MetaStore.addGold(gold);
        if (gold > 0) spawnFloater(this, 'gold', gold, floatX, floatY);
        for (const item of loot.items) {
          MetaStore.recordItemDiscovered(item.item_id);
          this.addToBelt(item);
        }
      }
    } else {
      // Босс НЕ даёт лут автоматически: награда за него — только выбранная карточка драфта
      // (onExpeditionComplete → buildRewardOptions из boss.loot). Здесь ничего не начисляем.
      // Квесты на боссов идут через stat (mobs_killed); событие нужно для презентации
      // (SoundManager — фанфары победы над боссом).
      EventBus.emit('boss_killed', this.zoneCfg.boss.mob_id);
    }

    this.currentFightIdx++;
    this.updateProgressBar();

    if (this.currentFightIdx >= this.fightPlan.length) {
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
    // Лут гарантирован: всё, что ещё на ленте, уходит в сундук — смерть его не отнимает.
    this.collectBeltToChest();
    this.showStatus('Герой пал! Лут сохранён.', 3000);
    this.scheduleDelayed(2000, () => {
      this.scene.start('CampScene');
    });
  }

  private onExpeditionComplete() {
    // Весь оставшийся лут с ленты гарантированно уходит в сундук.
    this.collectBeltToChest();
    // Гарант-драфт: 5 карточек [золото, предмет·mob, предмет·boss, предмет·mob, эссенция],
    // игрок берёт одну. Источники и заглушки — см. buildRewardOptions.
    const options = buildRewardOptions(this.zoneCfg.boss?.loot, this.zoneCfg.mob_loot);
    this.showRewardDraft(options);
  }

  // Экран выбора награды после победы над боссом: 1 из 5 вариантов.
  private showRewardDraft(options: RewardOption[]) {
    this.victoryContainer.setVisible(true);
    this.victoryContainer.removeAll(true);

    const overlay = this.add.rectangle(640, 192, 1280, 320, 0x000000, 0.82).setInteractive();
    const title = this.add.text(640, 78, 'Победа! Выбери награду', {
      fontSize: '26px', fontFamily: FONT_FAMILY, color: '#ffdd44',
    }).setOrigin(0.5);
    this.victoryContainer.add([overlay, title]);

    const CARD_W = 150, CARD_H = 170, GAP = 24;
    const total = options.length * CARD_W + (options.length - 1) * GAP;
    const startX = 640 - total / 2 + CARD_W / 2;
    const cardY = 210;

    options.forEach((opt, i) => {
      const x = startX + i * (CARD_W + GAP);
      const color = this.rewardCardColor(opt);
      const card = this.add.rectangle(x, cardY, CARD_W, CARD_H, 0x1a1a2a)
        .setStrokeStyle(2, color)
        .setInteractive({ useHandCursor: true });
      this.victoryContainer.add(card);

      // Наполнение карточки. Золото/эссенция — иконка+число единообразно с предметами.
      if (opt.kind === 'gold') {
        this.victoryContainer.add(goldTag(this, opt.gold, { iconSize: 46, fontSize: 26, originX: 0.5 })
          .setPosition(x, cardY - 6));
        this.victoryContainer.add(this.add.text(x, cardY + 44, 'Золото', {
          fontSize: '12px', fontFamily: FONT_FAMILY, color: '#dddddd',
        }).setOrigin(0.5, 0));
      } else if (opt.kind === 'essence') {
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
        this.victoryContainer.add(this.add.image(x, cardY - 28, itemIconKey(opt.item.item_id)).setDisplaySize(72, 72));
        this.victoryContainer.add(this.add.text(x, cardY + 34, getItemConfig(opt.item.item_id).name, {
          fontSize: '12px', fontFamily: FONT_FAMILY, color: '#dddddd',
          align: 'center', wordWrap: { width: CARD_W - 16 },
        }).setOrigin(0.5, 0));
      }

      card.on('pointerover', () => {
        card.setFillStyle(0x2a2a3a);
        if (opt.kind === 'item') this.tooltip.showItem(opt.item, x + CARD_W / 2 + 8, cardY - CARD_H / 2);
      });
      card.on('pointerout',  () => { card.setFillStyle(0x1a1a2a); this.tooltip.hide(); });
      card.on('pointerdown', () => {
        this.claimReward(opt);
        this.finishExpedition();
      });
    });
  }

  // Цвет рамки карточки награды по её типу.
  private rewardCardColor(opt: RewardOption): number {
    if (opt.kind === 'gold') return 0xffcc00;
    if (opt.kind === 'essence') return 0x44ddff;
    return RARITY_COLORS[opt.item.rarity];
  }

  // Начисляет выбранную награду: предмет — в сундук, золото/эссенция — в мету.
  private claimReward(opt: RewardOption) {
    if (opt.kind === 'item') {
      this.carryOut(opt.item); // addToChest + recordItemCarriedOut
    } else if (opt.kind === 'gold') {
      MetaStore.addGold(opt.gold);
    } else {
      for (const tier of Object.keys(opt.essence) as EssenceTier[]) {
        const amount = opt.essence[tier] ?? 0;
        if (amount > 0) MetaStore.addEssence(tier, amount);
      }
    }
  }

  // Финал похода: зона зачтена, возврат в лагерь.
  private finishExpedition() {
    MetaStore.completeArea(this.zoneId);
    MetaStore.recordZoneReturned(this.zoneId);
    EventBus.emit('expedition_returned', this.zoneId);
    this.scene.start('CampScene');
  }

  // Весь лут с ленты (и очереди) уходит в сундук — авто-сбор без разбора.
  private collectBeltToChest() {
    // Предмет «в руке» (взят с ленты для экипировки) тоже не теряется.
    const held = this.dragDrop?.dropHeld();
    if (held) this.carryOut(held);
    for (const obj of this.beltItems) {
      this.carryOut(obj.item);
      obj.sprite.destroy();
      obj.label.destroy();
    }
    for (const item of this.lootQueue) this.carryOut(item);
    this.beltItems = [];
    this.lootQueue = [];
  }

  // Предмет покидает поход и попадает в сундук — фиксируем как «вынесенный».
  // (Лента в сундук не идёт — она переплавляется, поэтому туда это не зовём.)
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

    // Лента движется всегда — и в бою, и на ходьбе (не завязана на фазу).
    this.tickBelt(delta);

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
      this.updateHeroAtkBars();
    }
  }

  private onQuestCompleted(_questId: string) {
    this.questTracker.rebuild();
  }
}
