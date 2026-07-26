import Phaser from 'phaser';
import { FONT_FAMILY } from '../ui/theme';
import { MetaStore } from '../core/MetaStore';
import { EventBus } from '../core/EventBus';
import { initQuestSystem } from '../core/QuestSystem';
import { QUEST_DEFS } from '../quests/definitions';
import type { QuestReward } from '../quests/definitions';
import type { ItemInstance, SlotId } from '../core/MetaStore';
import { ARMOR_STAND_COUNT } from '../core/MetaStore';
import { getItemBehavior } from '../items/registry';
import {
  craftPreview, salvageEssence, formatEssence, ESSENCE_TIERS, ESSENCE_NAMES,
  ESSENCE_EXCHANGE_RATE, ESSENCE_EXCHANGE_TARGET, emptyEssence,
} from '../items/craft';
import type { Rarity, SlotType, EssencePool, EssenceTier } from '../items/types';
import { itemIconKey } from '../items/icons';
import { resourceTag } from '../ui/priceTag';
import { essenceIconKey, essenceIconKeyByRarity } from '../ui/rewards';
import { slotSilhouetteKey, upgradeIconKey } from '../ui/silhouettes';
import { Tooltip } from '../ui/Tooltip';
import { DragDropManager } from '../ui/DragDropManager';
import { getZoneConfig, getZoneLootItemIds, isZoneFullyLooted, WIP_ZONE_IDS } from '../zones/registry';
import type { ZoneConfig } from '../zones/types';
import { HAMMER_CURSOR } from '../ui/hammerCursor';
import { QuestTracker } from '../ui/QuestTracker';
import { claimQuestReward } from '../core/QuestSystem';
import { ResourceHUD } from '../ui/ResourceHUD';
import { VolumeControl } from '../ui/VolumeControl';
import { SoundManager } from '../core/SoundManager';
import { SliderPopup } from '../ui/SliderPopup';
import { spawnIconFloater } from '../ui/Floater';
import { CX, DX, GAME_W, GAME_H, rightX } from '../ui/layout';

// Ширина, в которой нарисована композиция camp.png. Пока арт без бокового запаса (файл 1376×768) —
// тянем картинку по ширине холста, как и раньше (это уже слегка сплющивало её). Когда придёт новый
// camp.png шириной 1920 (центральные 1280×800 = историческая композиция, по 320px сценографии по бокам) —
// вернуть здесь 1920: картинка нарисуется 1:1, лишнее уйдёт за края холста, а центр совпадёт с текущим.
// Функция, а не константа: GAME_W пересчитывается при ресайзе окна (src/ui/layout.ts).
function campBgWidth(): number {
  return GAME_W;
}

interface MapZoneEntry {
  id: string;
  label: string;
  x: number;
  y: number;
}

// Раскладка — 3 колонки по фракциям (нежить / звери / мародёры слева направо), внутри
// колонки снизу вверх: старт → средняя → средняя. Финал — сверху над центральной колонкой.
// Порядок снизу вверх обязан совпадать с FACTION_ROUTES (иначе стрелки укажут вниз).
const MAP_ZONE_LAYOUT: MapZoneEntry[] = [
  // Нежить (Магия) — левая колонка
  { id: 'dead-fields',       label: 'Мёртвые поля',        x: 440,  y: 574 },
  { id: 'mage-ruins',        label: 'Руины магов',         x: 440,  y: 444 },
  { id: 'crypt',             label: 'Склеп',               x: 440,  y: 314 },
  // Звери (Конница) — центральная колонка
  { id: 'trampled-meadows',  label: 'Растоптанные луга',   x: 640,  y: 574 },
  { id: 'beast-lair',        label: 'Логово зверей',       x: 640,  y: 444 },
  { id: 'predator-pasture',  label: 'Пастбище хищников',   x: 640,  y: 314 },
  // Мародёры — правая колонка
  { id: 'armor-dump',        label: 'Свалка доспехов',     x: 840,  y: 574 },
  { id: 'abandoned-camp',    label: 'Брошенный лагерь',    x: 840,  y: 444 },
  { id: 'marauder-lair',     label: 'Логово мародёров',    x: 840,  y: 314 },
  // Финал — над центральной колонкой
  { id: 'battlefield',       label: 'Поле битвы',          x: 640,  y: 172 },
];

// Единый маршрут прохождения каждой фракции: стартовая → средние → Поле битвы.
// Источник порядка для линий карты и для цепочек разблокировок в quests/definitions.ts.
const FACTION_ROUTES: string[][] = [
  ['dead-fields', 'mage-ruins', 'crypt', 'battlefield'],
  ['trampled-meadows', 'beast-lair', 'predator-pasture', 'battlefield'],
  ['armor-dump', 'abandoned-camp', 'marauder-lair', 'battlefield'],
];

// Предшественник каждой зоны в маршруте (кроме центра): зона появляется на карте как
// «пройди прошлую» только после того, как предыдущая зона пройдена (попала в
// completed_areas). Старт первого маршрута (dead-fields) предшественника не имеет.
const ZONE_PREREQ: Record<string, string> = {};
for (const route of FACTION_ROUTES) {
  for (let i = 1; i < route.length; i++) {
    if (route[i] === 'battlefield') continue;
    ZONE_PREREQ[route[i]] = route[i - 1];
  }
}
// Старты 2-го и 3-го маршрутов открываются НАГРАДОЙ за первое прохождение Мёртвых полей
// (dead_fields_clear → unlock_area), а не прохождением самих себя.
ZONE_PREREQ['trampled-meadows'] = 'dead-fields';
ZONE_PREREQ['armor-dump'] = 'dead-fields';

function zonePrereqMet(zoneId: string, completed: string[]): boolean {
  const prev = ZONE_PREREQ[zoneId];
  return !prev || completed.includes(prev);
}

function zoneLabel(zoneId: string): string {
  return MAP_ZONE_LAYOUT.find((z) => z.id === zoneId)?.label ?? zoneId;
}

// Обратный индекс: зона → id квеста, чья награда её разблокирует (unlock_area).
// Строится один раз по QUEST_DEFS — источник истины остаётся в quests/definitions.ts.
const AREA_UNLOCK_QUEST: Record<string, string> = {};
for (const def of Object.values(QUEST_DEFS)) {
  for (const reward of def.rewards) {
    if (reward.type === 'unlock_area') AREA_UNLOCK_QUEST[reward.areaId] = def.id;
  }
}

const RARITY_COLORS: Record<Rarity, number> = {
  common: 0xffffff,
  uncommon: 0x55ff55,
  rare: 0x5555ff,
  epic: 0xaa00ff,
  legendary: 0xff8800,
};

// Цвет названия зоны в тултипе = цвет эссенции, которую даёт её босс. Поле Битвы эссенции
// не даёт (финал без награды-выбора) — берём легендарный цвет как высший тир.
const TIER_HEX: Record<string, string> = {
  uncommon: '#55ff55', rare: '#5555ff', epic: '#aa00ff', legendary: '#ff8800',
};

function zoneNameColor(cfg: ZoneConfig): string {
  // Endless-зона (battlefield) без boss/наград-выбора — легендарный цвет как высший тир.
  if (cfg.endless || !cfg.boss) return TIER_HEX.legendary;
  const ess = cfg.boss.loot?.essence;
  const tier = ess ? Object.keys(ess)[0] : undefined;
  return (tier && TIER_HEX[tier]) || '#ffffff';
}

// Тултип не переносит текст сам — режем лор на строки по словам (≤ maxChars символов).
function wrapText(text: string, maxChars = 42): string[] {
  if (!text) return [];
  const lines: string[] = [];
  let cur = '';
  for (const w of text.split(' ')) {
    if (cur && cur.length + 1 + w.length > maxChars) { lines.push(cur); cur = w; }
    else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) lines.push(cur);
  return lines;
}


// Единственный герой — Силач. Выбора персонажа больше нет (см. docs/concept.md).
const HERO_SPRITE = 'char-strongman';

export class CampScene extends Phaser.Scene {
  // Стойка-пресет (0..ARMOR_STAND_COUNT-1), которую редактируем на стенде и с которой уходим
  // в поход. Хранится в мете (getActiveStand): выбор запоминается между заходами и боями.
  private get selectedStandIndex(): number { return MetaStore.getActiveStand(); }
  private set selectedStandIndex(i: number) { MetaStore.setActiveStand(i); }
  private tooltip!: Tooltip;
  private panelContainer!: Phaser.GameObjects.Container;
  /** Дизайновая высота рамки панели НПС (buildPanelFrame). */
  private static readonly PANEL_H = 520;
  /** Целевой отступ панели до края холста — половина прежних 140. */
  private static readonly PANEL_PAD = 70;
  /** Текущий масштаб panelContainer: 1 для карты, computePanelScale() для меню НПС. */
  private panelScale = 1;
  private hoverLabel!: Phaser.GameObjects.Text;
  /** Предмет во входном слоте улучшения (вкладка «Экипировка»). */
  private upgradeInputItem: ItemInstance | null = null;
  /** Готовый предмет после улучшения — лежит в правой ячейке, пока игрок не заберёт его drag'ом. */
  private upgradeResultItem: ItemInstance | null = null;
  private smithHammerMode = false;
  private panelState: 'smith' | 'dealer' | 'chest' | 'map' | null = null;
  private panelWheelHandler: ((...args: unknown[]) => void) | null = null;
  private chestMaskGraphics: Phaser.GameObjects.Graphics | null = null;
  private dragDrop: DragDropManager | null = null;
  private pendingDrag: { slotId: string; downX: number; downY: number; fallback?: () => void } | null = null;
  // Клик по вкладке единого меню: не дать global pointerup уронить предмет из «руки» в сундук.
  private tabClickGuard = false;
  private chestSlotFilter: SlotType | null = null;
  private chestRarityFilter: Rarity | null = null;
  private questTracker!: QuestTracker;
  private resourceHUD!: ResourceHUD;
  private fluteSlider: SliderPopup | null = null;
  private dealerAlert: Phaser.GameObjects.Container | null = null;
  private dealerBlinkHint: Phaser.GameObjects.Image | null = null;
  private firstExpeditionHint: Phaser.GameObjects.Image | null = null;

  // Панель, которую надо переоткрыть после рестарта сцены (см. relayoutOnResize).
  private panelToRestore: 'smith' | 'dealer' | 'chest' | 'map' | null = null;

  constructor() {
    super({ key: 'CampScene' });
  }

  init(data?: { panelState?: 'smith' | 'dealer' | 'chest' | 'map' | null }) {
    this.panelToRestore = data?.panelState ?? null;
    this.panelState = null;
  }

  /**
   * Ресайз окна (чаще всего F11) сменил ширину холста — лагерь целиком строится из MetaStore,
   * так что просто пересобираем сцену, сохранив открытую панель. Прокрутка сундука и предмет
   * «в руке» при этом теряются.
   */
  relayoutOnResize() {
    this.scene.restart({ panelState: this.panelState });
  }

  create() {
    initQuestSystem();
    this.tooltip = new Tooltip(this);

    this.add.image(CX, 400, 'bg-camp').setDisplaySize(campBgWidth(), GAME_H);
    this.buildFire();

    this.buildHUD();
    this.buildCampfire();
    this.buildNPCs();
    this.buildFlutist();
    this.buildChestStand();
    this.buildHoverLabel();
    this.buildPanel();

    this.questTracker = new QuestTracker(this);

    EventBus.on('quest_completed', this.onQuestCompleted, this);
    EventBus.on('quest_reward_claimed', this.onRewardClaimed, this);
    // Phaser не вызывает shutdown() сам — снимаем слушатели EventBus при сворачивании сцены,
    // иначе обработчики живут после ухода в экспедицию и падают на уничтоженном трекере.
    this.events.once('shutdown', this.shutdown, this);
    this.input.keyboard!.on('keydown-ESC', () => {
      if (this.smithHammerMode) { this.exitSmithHammerMode(); return; }
      if (this.panelContainer.visible) this.closePanel();
    });

    // Горячие клавиши лагеря: быстрый доступ к панелям без мыши. Повторное нажатие закрывает (как ESC).
    const kb = this.input.keyboard!;
    kb.on('keydown-SPACE', () => this.togglePanel('map',    () => this.openMapPanel()));
    kb.on('keydown-I',     () => this.togglePanel('chest',  () => this.openChestPanel()));
    kb.on('keydown-S',     () => this.togglePanel('smith',  () => this.openSmithPanel()));
    kb.on('keydown-D',     () => this.togglePanel('dealer', () => this.openDealerPanel()));

    this.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      if (!this.pendingDrag || !this.dragDrop || !ptr.isDown) return;
      if (this.dragDrop.isDragging() || this.dragDrop.isHolding()) return;
      const dx = ptr.x - this.pendingDrag.downX;
      const dy = ptr.y - this.pendingDrag.downY;
      if (dx * dx + dy * dy > 64) {
        this.dragDrop.startDrag(this.pendingDrag.slotId, ptr.x, ptr.y);
        this.pendingDrag = null;
      }
    });

    this.input.on('pointerup', (ptr: Phaser.Input.Pointer) => {
      const tabGuard = this.tabClickGuard;
      this.tabClickGuard = false;
      // Предмет в руке: клик кладёт/меняет местами в целевом слоте, иначе уходит в сундук.
      if (this.dragDrop?.isHolding()) {
        if (tabGuard) return; // клик был по вкладке — переключили меню, предмет держим дальше

        const target = this.dragDrop.findPlaceableAt(ptr.x, ptr.y);
        if (target) {
          const res = this.dragDrop.placeAt(target.id);
          if (res === 'rejected') this.showMessage('Не тот слот');
          else this.rebuildPanel();
        } else {
          const held = this.dragDrop.dropHeld();
          if (held) MetaStore.addToChest(held);
          this.rebuildPanel();
        }
        this.pendingDrag = null;
        return;
      }
      if (!this.pendingDrag) return;
      const dx = ptr.x - this.pendingDrag.downX;
      const dy = ptr.y - this.pendingDrag.downY;
      if (dx * dx + dy * dy < 64) {
        // Shift или режим разборки — старое быстрое действие; обычный клик — взять предмет в руку.
        const quick = (ptr.event as MouseEvent | undefined)?.shiftKey || this.smithHammerMode;
        if (quick) {
          this.tooltip.hide();
          this.pendingDrag.fallback?.();
        } else if (this.dragDrop?.pickUp(this.pendingDrag.slotId)) {
          this.rebuildPanel();
        }
      }
      this.pendingDrag = null;
    });

    this.refreshHUD();

    // Рестарт под новый размер окна — возвращаем игрока в ту же панель, что была открыта.
    if (this.panelToRestore) {
      const reopen = {
        smith:  () => this.openSmithPanel(),
        dealer: () => this.openDealerPanel(),
        chest:  () => this.openChestPanel(),
        map:    () => this.openMapPanel(),
      };
      reopen[this.panelToRestore]();
      this.panelToRestore = null;
    }
  }

  private buildHUD() {
    this.add.text(CX, 14, 'Лагерь', { fontSize: '22px', fontFamily: FONT_FAMILY, color: '#dddddd' }).setOrigin(0.5, 0);
    this.resourceHUD = new ResourceHUD(this, this.tooltip);

    const coordText = this.add.text(10, 10, '', {
      fontSize: '12px', fontFamily: FONT_FAMILY, color: '#ffffff', backgroundColor: '#000000aa',
    }).setDepth(100).setPadding(3);
    this.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      coordText.setText(`x:${Math.round(ptr.x)} y:${Math.round(ptr.y)}`);
    });

    new VolumeControl(this);

    // Слоистая фоновая атмосфера лагеря: костёр (тихо) + флейта (громкость — у флейтиста).
    SoundManager.playMusicLayers([
      { key: 'amb_campfire', volume: 0.1 },
      { key: 'amb_flute', volume: SoundManager.getLayerVolume('amb_flute', 0.5) },
    ]);

    const resetBtn = this.add.rectangle(rightX(52), 785, 90, 22, 0x1a0000)
      .setStrokeStyle(1, 0x551111).setInteractive({ useHandCursor: true });
    this.add.text(rightX(52), 785, 'Сброс данных', { fontSize: '9px', fontFamily: FONT_FAMILY, color: '#663333' }).setOrigin(0.5);
    resetBtn.on('pointerover', () => resetBtn.setFillStyle(0x2a0000));
    resetBtn.on('pointerout',  () => resetBtn.setFillStyle(0x1a0000));
    resetBtn.on('pointerdown', () => this.confirmReset());

    // Дев-инструмент: балансировочный симулятор (balance.html) — открывается в новой вкладке.
    // Только для дев-сервера (import.meta.env.DEV) — в проде balance.html не собирается и не нужен игроку.
    if (import.meta.env.DEV) {
      const balanceBtn = this.add.rectangle(rightX(152), 785, 90, 22, 0x0a1a1a)
        .setStrokeStyle(1, 0x225555).setInteractive({ useHandCursor: true });
      this.add.text(rightX(152), 785, 'Баланс-тул', { fontSize: '9px', fontFamily: FONT_FAMILY, color: '#337766' }).setOrigin(0.5);
      balanceBtn.on('pointerover', () => balanceBtn.setFillStyle(0x143030));
      balanceBtn.on('pointerout',  () => balanceBtn.setFillStyle(0x0a1a1a));
      balanceBtn.on('pointerdown', () => window.open('./balance.html', '_blank'));
    }
  }

  private confirmReset() {
    const overlay = this.add.rectangle(CX, 400, GAME_W, GAME_H, 0x000000, 0.7).setDepth(90).setInteractive();
    const box = this.add.rectangle(CX, 400, 460, 160, 0x1e0a0a).setDepth(91).setStrokeStyle(2, 0x882222);
    const text = this.add.text(CX, 368, '⚠ Сбросить весь прогресс? ⚠\n\n⚠⚠⚠ Действие необратимо! ⚠⚠⚠', {
      fontSize: '14px', fontFamily: FONT_FAMILY, color: '#ffaaaa', align: 'center',
    }).setOrigin(0.5).setDepth(92);
    const yesBtn = this.add.rectangle(CX - 55, 432, 130, 34, 0x551111).setDepth(91).setInteractive({ useHandCursor: true });
    const yesLbl = this.add.text(CX - 55, 432, 'Сбросить', { fontSize: '14px', fontFamily: FONT_FAMILY, color: '#ff6666' }).setOrigin(0.5).setDepth(92);
    const noBtn  = this.add.rectangle(CX + 75, 432, 130, 34, 0x224422).setDepth(91).setInteractive({ useHandCursor: true });
    const noLbl  = this.add.text(CX + 75, 432, 'Отмена', { fontSize: '14px', fontFamily: FONT_FAMILY, color: '#aaffaa' }).setOrigin(0.5).setDepth(92);

    const onEsc = () => close();
    const close = () => {
      this.input.keyboard?.off('keydown-ESC', onEsc);
      [overlay, box, text, yesBtn, yesLbl, noBtn, noLbl].forEach(o => o.destroy());
    };
    this.input.keyboard?.on('keydown-ESC', onEsc);
    yesBtn.on('pointerdown', () => { close(); this.showStartWeaponPicker(); });
    noBtn.on('pointerdown', () => close());
    overlay.on('pointerdown', () => close());
  }

  // Экран выбора стартового оружия — второй шаг сброса прогресса. Выбор обязателен (клик по
  // фону не закрывает экран): подтверждение уже дано на предыдущем шаге, отступать некуда.
  private showStartWeaponPicker() {
    const weaponIds = MetaStore.listStartWeapons();

    const overlay = this.add.rectangle(CX, 400, GAME_W, GAME_H, 0x000000, 0.88).setDepth(90).setInteractive();
    const title = this.add.text(CX, 190, 'Выбери стартовое оружие', {
      fontSize: '20px', fontFamily: FONT_FAMILY, color: '#ffdd44',
    }).setOrigin(0.5).setDepth(92);
    const hint = this.add.text(CX, 218, 'Common — единственный предмет на стойке новой игры', {
      fontSize: '12px', fontFamily: FONT_FAMILY, color: '#888888',
    }).setOrigin(0.5).setDepth(92);

    const objs: Phaser.GameObjects.GameObject[] = [overlay, title, hint];

    const CARD_W = 130, CARD_H = 140, GAP = 16, COLS = 4;
    const rows = Math.ceil(weaponIds.length / COLS);
    const startY = 420 - ((rows - 1) * (CARD_H + GAP)) / 2;

    weaponIds.forEach((id, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const rowCount = Math.min(COLS, weaponIds.length - row * COLS);
      const rowTotal = rowCount * CARD_W + (rowCount - 1) * GAP;
      const rowStartX = CX - rowTotal / 2 + CARD_W / 2;
      const x = rowStartX + col * (CARD_W + GAP);
      const y = startY + row * (CARD_H + GAP);

      const beh = getItemBehavior(id);
      const card = this.add.rectangle(x, y, CARD_W, CARD_H, 0x1a1a2a)
        .setStrokeStyle(2, 0x666666).setDepth(91).setInteractive({ useHandCursor: true });
      const icon = this.add.image(x, y - 24, itemIconKey(id)).setDisplaySize(56, 56).setDepth(92);
      const label = this.add.text(x, y + 32, beh.name, {
        fontSize: '12px', fontFamily: FONT_FAMILY, color: '#dddddd', align: 'center',
        wordWrap: { width: CARD_W - 12 },
      }).setOrigin(0.5, 0).setDepth(92);
      objs.push(card, icon, label);

      card.on('pointerover', () => {
        card.setFillStyle(0x2a2a3a);
        this.tooltip.showItem({ item_id: id, rarity: 'common' }, x + CARD_W / 2 + 8, y - CARD_H / 2);
      });
      card.on('pointerout', () => { card.setFillStyle(0x1a1a2a); this.tooltip.hide(); });
      card.on('pointerdown', () => {
        this.tooltip.hide();
        objs.forEach(o => o.destroy());
        MetaStore.resetAll(id);
      });
    });
  }

  private refreshHUD() {
    this.resourceHUD?.refresh();
  }

  private buildHoverLabel() {
    this.hoverLabel = this.add.text(CX, 780, '', {
      fontSize: '14px', fontFamily: FONT_FAMILY, color: '#aaaaaa',
    }).setOrigin(0.5).setDepth(10);
  }

  private buildCampfire() {
    // Единственный герой — Силач у костра. Клик открывает карту (выбор зоны + стойки).
    // Исходник 300×600, отображается в 80×120 (как у НПС). Позиция — как раньше (индекс силача).
    const CAMP_CHAR_W = 80;
    const CAMP_CHAR_H = 120;
    // Объекты лагеря выверены по фону в дизайновых 1280 — сдвигаем их вместе с фоном на DX
    // (src/ui/layout.ts), иначе на широком холсте силач съедет с поленьев.
    const x = 560 + DX, y = 540;

    // Двухслойная тень (псевдоградиент) — та же схема, что в бою (ExpeditionScene).
    const heroShW = CAMP_CHAR_W * 0.9 * 1.1, heroShH = 20 * 1.1, heroShY = y + CAMP_CHAR_H / 2 - 4;
    this.add.ellipse(x, heroShY, heroShW * 1.1, heroShH * 1.1, 0x000000, 0.22);
    this.add.ellipse(x, heroShY, heroShW * 0.9, heroShH * 0.9, 0x000000, 0.45);
    const outlineImg = this.add.image(x, y, HERO_SPRITE)
      .setDisplaySize(CAMP_CHAR_W + 6, CAMP_CHAR_H + 6).setTintFill(0xffffff).setVisible(false);

    // Подсказка для игрока, который ещё ни разу не заходил в поход (zones_entered пуст):
    // тот же слой, что и hover-обводка (тот же размер/тинт, под обычным спрайтом — так
    // видна только рамка по краю силуэта), но мигает сама по себе. Продолжает мигать,
    // пока игрок реально не зайдёт в экспедицию (тогда при следующем create() сцены
    // zones_entered уже не пуст, и подсказка не создаётся) — наведение/клик её не гасят.
    if (Object.keys(MetaStore.get().stats.zones_entered).length === 0) {
      this.firstExpeditionHint = this.add.image(x, y, HERO_SPRITE)
        .setDisplaySize(CAMP_CHAR_W + 6, CAMP_CHAR_H + 6).setTintFill(0xffffff);
      this.tweens.add({
        targets: this.firstExpeditionHint,
        alpha: { from: 1, to: 0 },
        duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }

    this.add.image(x, y, HERO_SPRITE).setDisplaySize(CAMP_CHAR_W, CAMP_CHAR_H);

    const hit = this.add.ellipse(x, y, CAMP_CHAR_W, CAMP_CHAR_H, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => { outlineImg.setVisible(true); this.hoverLabel.setText('В поход'); });
    hit.on('pointerout',  () => { outlineImg.setVisible(false); this.hoverLabel.setText(''); });
    hit.on('pointerdown', () => this.openMapPanel());
  }

  // Анимированное пламя поверх статичных поленьев на camp.2.png.
  // Объём собирается из кода: задний+передний слой (разная скорость), additive-ядро,
  // пульсирующее свечение и искры. Лист campfire — один ряд из FIRE_FRAMES кадров.
  private buildFire() {
    const FIRE_FRAMES = 6;
    if (!this.textures.exists('camp-fire')) return;

    // --- нарезка листа на кадры (frameWidth = ширина / число кадров) ---
    const tex = this.textures.get('camp-fire');
    const src = tex.getSourceImage() as HTMLImageElement;
    const fw = Math.floor(src.width / FIRE_FRAMES);
    const fh = src.height;
    for (let i = 0; i < FIRE_FRAMES; i++) {
      if (!tex.has(`${i}`)) tex.add(i, 0, i * fw, 0, fw, fh);
    }
    if (!this.anims.exists('camp-fire')) {
      this.anims.create({ key: 'camp-fire', frames: this.anims.generateFrameNumbers('camp-fire', {}), frameRate: 11, repeat: -1 });
    }
    if (!this.anims.exists('camp-fire-slow')) {
      this.anims.create({ key: 'camp-fire-slow', frames: this.anims.generateFrameNumbers('camp-fire', {}), frameRate: 7, repeat: -1 });
    }

    // Параметры размещения — основание пламени на поленьях.
    const FX = 656 + DX, FY = 638, W = 150, H = 120;

    // --- свечение: радиальный градиент с ADD, медленно пульсирует ---
    this.ensureFireGlowTexture();
    const glow = this.add.image(FX, FY - H * 0.4, 'fire-glow')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDisplaySize(W * 2.6, W * 2.6)
      .setAlpha(0.5)
      .setDepth(0);
    this.tweens.add({ targets: glow, alpha: 0.3, scale: glow.scale * 0.88, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    // --- задний слой: крупнее, тусклее, медленнее (внутренняя глубина) ---
    this.add.sprite(FX, FY, 'camp-fire')
      .setOrigin(0.5, 1).setDisplaySize(W * 1.22, H * 1.18)
      .setAlpha(0.5).setDepth(1).play('camp-fire-slow');

    // --- передний слой ---
    const front = this.add.sprite(FX, FY, 'camp-fire')
      .setOrigin(0.5, 1).setDisplaySize(W, H).setDepth(2).play('camp-fire');
    // лёгкий процедурный флик — петля перестаёт читаться как перелистывание
    this.tweens.add({ targets: front, scaleX: front.scaleX * 1.05, duration: 260, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    // --- ядро: ADD, светится, сдвинутая фаза анимации ---
    const core = this.add.sprite(FX, FY, 'camp-fire')
      .setOrigin(0.5, 1).setDisplaySize(W * 0.68, H * 0.78)
      .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.6).setDepth(3).play('camp-fire');
    core.anims.setProgress(0.5);

    // --- искры: мелкие угольки летят вверх и гаснут ---
    this.ensureFireSparkTexture();
    this.add.particles(FX, FY - 10, 'fire-spark', {
      blendMode: Phaser.BlendModes.ADD,
      x: { min: -16, max: 16 },
      lifespan: { min: 900, max: 1800 },
      speedY: { min: -110, max: -200 },
      speedX: { min: -22, max: 22 },
      scale: { start: 1, end: 0 },
      alpha: { start: 0.9, end: 0 },
      frequency: 260,
      quantity: 1,
      tint: [0xffcf6b, 0xff9a3c],
    }).setDepth(2);

    this.buildFireLightOnStrongman(FX, FY);
  }

  // Отсвет костра на силаче: он стоит ПОЗАДИ костра, без подсветки выглядит «вырезанным».
  // Поверх его спрайта кладём тёплую копию с ADD-смешиванием и пульсируем в такт пламени.
  // Координаты/размер силача — из buildCampfire (индекс 1: 560,540, 80×120).
  private buildFireLightOnStrongman(fx: number, fy: number) {
    if (!this.textures.exists('char-strongman')) return;
    const SM_X = 560 + DX, SM_Y = 540, SM_W = 80, SM_H = 120;

    // Свет идёт со стороны костра (справа-снизу от силача) — сдвигаем отсвет к этому краю.
    const dx = Math.sign(fx - SM_X) * 4;
    const dy = Math.sign(fy - SM_Y) * 4;

    const light = this.add.image(SM_X + dx, SM_Y + dy, 'char-strongman')
      .setDisplaySize(SM_W, SM_H)
      .setTint(0xffaa55)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.38)
      .setDepth(4);
    this.tweens.add({ targets: light, alpha: 0.2, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  // Радиальный градиент тёплого света — генерим один раз в рантайме (без арта).
  private ensureFireGlowTexture() {
    if (this.textures.exists('fire-glow')) return;
    const S = 128;
    const canvas = this.textures.createCanvas('fire-glow', S, S);
    if (!canvas) return;
    const ctx = canvas.getContext();
    const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, 'rgba(255,170,80,0.9)');
    g.addColorStop(0.4, 'rgba(255,120,40,0.35)');
    g.addColorStop(1, 'rgba(255,90,20,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    canvas.refresh();
  }

  // Точка-уголёк для эмиттера искр.
  private ensureFireSparkTexture() {
    if (this.textures.exists('fire-spark')) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(3, 3, 3);
    g.generateTexture('fire-spark', 6, 6);
    g.destroy();
  }


  private buildNPCs() {
    // Позиции выверены по фону в дизайновых 1280 — едут вместе с фоном на DX (src/ui/layout.ts).
    this.addNPCWithSprite(
      224 + DX, 604, 80, 120, 'npc-smith',
      200 + DX, 522, 340, 285,
      'Кузнец', () => this.openSmithPanel(),
    );
    this.dealerBlinkHint = this.addNPCWithSprite(
      1090 + DX, 604, 80, 120, 'npc-dealer',
      1125 + DX, 540, 250, 240,
      'Скупщик', () => this.openDealerPanel(),
      true,
    ) ?? null;
    this.buildDealerAlert(1090 + DX, 604 - 120 / 2 - 18);
  }

  // Восклицательный знак над Скупщиком — привлекает внимание, когда есть готовый
  // к сдаче квест. Покачивается вверх-вниз и пульсирует; видимость — refreshDealerAlert.
  private buildDealerAlert(x: number, y: number) {
    const glow = this.add.circle(0, -1, 16.5, 0xffcc33, 0.25).setBlendMode(Phaser.BlendModes.ADD);
    const mark = this.add.text(0, 0, '!', {
      fontSize: '30px', fontFamily: FONT_FAMILY, color: '#ffdd44',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    const c = this.add.container(x, y, [glow, mark]).setDepth(20).setVisible(false);
    this.dealerAlert = c;

    // Покачивание и пульс — один твин на контейнере, чтобы знак и свечение двигались
    // синхронно; свечение дополнительно пульсирует альфой в такт (та же длительность).
    this.tweens.add({ targets: c, y: y - 8, duration: 620, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.tweens.add({ targets: glow, alpha: 0.5, scale: 1.25, duration: 620, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    this.refreshDealerAlert();
  }

  private refreshDealerAlert() {
    if (!this.dealerAlert) return;
    const hasReward = MetaStore.get().quests.pending_reward.length > 0;
    this.dealerAlert.setVisible(hasReward);
    this.dealerBlinkHint?.setVisible(hasReward);
  }

  // Есть ли среди активных (ещё не выполненных) квестов такой, чью цель можно
  // выполнить в этой зоне — для маркера «?» на карте (QuestDef.areas).
  private zoneHasActiveQuest(zoneId: string): boolean {
    return MetaStore.get().quests.active.some(q => QUEST_DEFS[q.id]?.areas?.includes(zoneId));
  }

  // Маркер «?» в углу узла карты — без подсветки и покачивания (маркеров на
  // карте может быть несколько одновременно).
  private buildQuestMarker(x: number, y: number) {
    const mark = this.add.text(x, y, '?', {
      fontSize: '22px', fontFamily: FONT_FAMILY, color: '#ffdd44',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);
    this.panelContainer.add(mark);
  }

  private addNPCWithSprite(
    spriteX: number, spriteY: number, spriteW: number, spriteH: number,
    textureKey: string,
    zoneX: number, zoneY: number, zoneW: number, zoneH: number,
    name: string, onClick: () => void,
    withBlinkHint = false,
  ): Phaser.GameObjects.Image | undefined {
    // Тень под ногами — двухслойная (псевдоградиент), как в бою (ExpeditionScene).
    const npcShW = spriteW * 0.9 * 1.1, npcShH = 14 * 1.1, npcShY = spriteY + spriteH / 2 - 4;
    this.add.ellipse(spriteX, npcShY, npcShW * 1.1, npcShH * 1.1, 0x000000, 0.22);
    this.add.ellipse(spriteX, npcShY, npcShW * 0.9, npcShH * 0.9, 0x000000, 0.45);

    // Белый силуэт чуть крупнее — показывается при hover позади спрайта
    const outline = this.add.image(spriteX, spriteY, textureKey)
      .setDisplaySize(spriteW + 6, spriteH + 6)
      .setTintFill(0xffffff)
      .setVisible(false);

    // Тот же слой, что и hover-обводка, но мигает сама по себе (как firstExpeditionHint
    // у героя) — привлекает внимание к НПС независимо от наведения. Видимость снаружи.
    let blinkHint: Phaser.GameObjects.Image | undefined;
    if (withBlinkHint) {
      blinkHint = this.add.image(spriteX, spriteY, textureKey)
        .setDisplaySize(spriteW + 6, spriteH + 6)
        .setTintFill(0xffffff)
        .setVisible(false);
      this.tweens.add({
        targets: blinkHint,
        alpha: { from: 1, to: 0 },
        duration: 620, yoyo: true, repeat: -1, ease: 'Sine.inOut',
      });
    }

    this.add.image(spriteX, spriteY, textureKey).setDisplaySize(spriteW, spriteH);

    const zone = this.add.rectangle(zoneX, zoneY, zoneW, zoneH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    zone.on('pointerover', () => {
      outline.setVisible(true);
      this.hoverLabel.setText(name);
    });
    zone.on('pointerout', () => {
      outline.setVisible(false);
      this.hoverLabel.setText('');
    });
    zone.on('pointerdown', () => onClick());

    return blinkHint;
  }

  // НПС-флейтист. По клику открывает ползунок громкости слоя флейты.
  // Спрайт 353×600 — рисуем с сохранением пропорций (~0.59).
  private buildFlutist() {
    // (960, 740) — нижняя центральная точка; addNPCWithSprite ждёт центр, поднимаем на h/2.
    const x = 960 + DX, bottomY = 740, w = 72, h = 122;
    const y = bottomY - h / 2;
    this.addNPCWithSprite(
      x, y, w, h, 'npc-flutist',
      x, y, 66, 118,
      'Флейтист — громкость флейты', () => this.openFluteSlider(x, y - 110),
    );
  }

  private openFluteSlider(x: number, y: number) {
    if (this.fluteSlider) return; // уже открыт; повторный клик ловит оверлей и закрывает
    this.fluteSlider = new SliderPopup(this, x, y, {
      label: 'Флейта',
      value: SoundManager.getLayerVolume('amb_flute', 0.5),
      onChange: (v) => SoundManager.setLayerVolume('amb_flute', v),
      onClose: () => { this.fluteSlider = null; },
    });
  }

  private buildChestStand() {
    this.addNPCWithSprite(
      855 + DX, 490, 96, 96, 'chest-stand',
      855 + DX, 490, 120, 100,
      'Сундук и стойки', () => this.openChestPanel(),
    );
  }

  private buildPanel() {
    // Контейнер сдвинут на DX: вся начинка панелей (магазин, стойка, сундук, карта, апгрейд) свёрстана
    // в дизайновых 1280 и этим сдвигом целиком встаёт в центр широкого холста (src/ui/layout.ts).
    // Меню НПС вдобавок увеличено масштабом контейнера вокруг пивота (640, 400) — см. computePanelScale.
    // При S = 1 позиция совпадает с прежней (DX, 0).
    const S = this.panelScale;
    this.panelContainer = this.add.container(CX - 640 * S, 400 - 400 * S)
      .setScale(S).setDepth(150).setVisible(false);
    // Оверлей — единственное исключение: тянется во всю ширину экрана. x=640 внутри контейнера — это
    // ровно CX на экране, так что при ширине GAME_W затемнение достаёт до обоих краёв. Размер делим
    // на масштаб — иначе увеличенный оверлей вылезет за холст.
    const overlay = this.add.rectangle(640, 400, GAME_W / S, GAME_H / S, 0x000000, 0.5);
    overlay.setInteractive();
    overlay.on('pointerdown', () => {
      if (this.dragDrop?.isHolding()) return; // с предметом в руке клик по фону вернёт его в сундук (pointerup)
      this.closePanel();
    });
    this.panelContainer.add(overlay);
  }

  // Начинка панели живёт в локальных координатах сдвинутого контейнера, а хит-зоны DragDropManager
  // и тултипы работают в экранных (курсор, клампы по краям экрана) — эти два хелпера переводят
  // локальный x панели в экранный. Всё, что просто рисуется внутри панели, перевода не требует.
  private panelX(localX: number): number {
    return this.panelContainer.x + localX * this.panelScale;
  }

  private panelY(localY: number): number {
    return this.panelContainer.y + localY * this.panelScale;
  }

  private panelRect(x: number, y: number, w: number, h: number): Phaser.Geom.Rectangle {
    const S = this.panelScale;
    return new Phaser.Geom.Rectangle(this.panelX(x), this.panelY(y), w * S, h * S);
  }

  // Меню НПС свёрстано в дизайновых 1280×800 и увеличивается масштабом контейнера вокруг
  // центра рамки (640, 400): панель растёт симметрично, отступ сверху/снизу падает 140 → 70.
  private computePanelScale(): number {
    const desired = (GAME_H - 2 * CampScene.PANEL_PAD) / CampScene.PANEL_H;
    // Вкладки слева торчат до локального x=100, т.е. на 540 левее пивота. На узких холстах
    // (аспект < ~1.6, GAME_W у нижней границы BASE_W) полный масштаб срезал бы их за краем экрана.
    const maxByWidth = (CX - 8) / 540;
    return Math.max(1, Math.min(desired, maxByWidth));
  }

  private clearPanelResources() {
    if (this.panelWheelHandler) {
      this.input.off('wheel', this.panelWheelHandler!);
      this.panelWheelHandler = null;
    }
    if (this.chestMaskGraphics) {
      this.chestMaskGraphics.destroy();
      this.chestMaskGraphics = null;
    }
    this.pendingDrag = null;
  }

  private togglePanel(state: 'smith' | 'dealer' | 'chest' | 'map', open: () => void) {
    if (this.smithHammerMode) return; // не мешаем режиму разборки
    if (this.panelState === state && this.panelContainer.visible) this.closePanel();
    else open();
  }

  private closePanel() {
    this.tooltip.hide();
    // Предмет «в руке» при закрытии панели возвращаем в сундук, чтобы не потерять.
    if (this.dragDrop?.isHolding()) {
      const held = this.dragDrop.dropHeld();
      if (held) MetaStore.addToChest(held);
    }
    this.dragDrop?.destroy();
    this.dragDrop = null;
    if (this.upgradeInputItem) { MetaStore.addToChest(this.upgradeInputItem); this.upgradeInputItem = null; }
    if (this.upgradeResultItem) { MetaStore.addToChest(this.upgradeResultItem); this.upgradeResultItem = null; }
    this.smithHammerMode = false;
    this.input.setDefaultCursor('default');
    this.input.off('pointermove', this.forceHammerCursor, this);
    this.chestSlotFilter = null;
    this.chestRarityFilter = null;
    this.panelState = null;
    this.panelScale = 1;
    this.clearPanelResources();
    this.panelContainer.setVisible(false);
    this.panelContainer.removeAll(true);
    this.panelContainer.destroy();
    this.buildPanel();
  }

  private rebuildPanel() {
    this.clearPanelResources();
    // Карта свёрстана шире рамки НПС (фон 660×620) — её не увеличиваем.
    this.panelScale = this.panelState === 'map' ? 1 : this.computePanelScale();
    this.panelContainer.removeAll(true);
    this.panelContainer.destroy();
    this.buildPanel();
    this.panelContainer.setVisible(true);
    if (this.panelState === 'map') {
      this.buildMapContent();
    } else {
      // Менеджер живёт между перестроениями панели — иначе «рука» (взятый предмет) терялась бы.
      if (!this.dragDrop) this.dragDrop = new DragDropManager(this);
      else this.dragDrop.clearSlots();
      // Иконка «в руке» живёт в экранных координатах — тянем её за масштабом панели.
      this.dragDrop.setIconScale(this.panelScale);
      this.buildPanelFrame();
      this.buildPanelTabs();
      if (this.panelState === 'smith')        this.buildSmithContent();
      else if (this.panelState === 'dealer')  this.buildDealerContent();
      else if (this.panelState === 'chest')   this.buildChestStandContent();
      this.buildSharedChestPane(this.getChestClickHandler());
    }
  }

  private openSmithPanel() {
    if (this.panelState !== 'smith') { this.closePanel(); this.panelState = 'smith'; }
    this.rebuildPanel();
  }

  private openDealerPanel() {
    if (this.panelState !== 'dealer') {
      this.closePanel();
      this.panelState = 'dealer';
    }
    this.rebuildPanel();
  }

  /** Родительный падеж ж.р. тира эссенции — согласуется с «эссенции» (ESSENCE_NAMES в items/craft — им. падеж). */
  private static readonly ESSENCE_GENITIVE: Record<EssenceTier, string> = {
    uncommon: 'необычной', rare: 'редкой', epic: 'эпической',
  };

  /** Текст награды готового к сдаче квеста — unlock_area не показываем, она видна по карте. */
  private describeRewards(rewards: QuestReward[]): string {
    const parts = rewards
      .filter((r): r is Extract<QuestReward, { type: 'essence' }> => r.type === 'essence')
      .map((r) => `+${r.amount} ${CampScene.ESSENCE_GENITIVE[r.tier]} эссенции`);
    return parts.length > 0 ? parts.join(', ') : 'Выполнено';
  }

  private buildQuestList(container: Phaser.GameObjects.Container) {
    const meta = MetaStore.get();
    const pending = meta.quests.pending_reward;
    const active = meta.quests.active;
    let y = 218;

    if (pending.length > 0) {
      container.add(this.add.text(379, y, 'Готово — забрать награду:', {
        fontSize: '12px', fontFamily: FONT_FAMILY, color: '#ffdd44',
      }).setOrigin(0.5));
      y += 20;

      for (const questId of pending) {
        const def = QUEST_DEFS[questId];
        if (!def) continue;

        const rowBg = this.add.rectangle(379, y + 18, 320, 36, 0x2a2a10).setStrokeStyle(1, 0x887722);
        const titleT = this.add.text(225, y + 8, def.title, { fontSize: '12px', fontFamily: FONT_FAMILY, color: '#ddddaa' });
        const rewardT = this.add.text(225, y + 24, this.describeRewards(def.rewards), { fontSize: '12px', fontFamily: FONT_FAMILY, color: '#ffdd44' });

        const claimBtn = this.add.rectangle(500, y + 18, 58, 26, 0x224422)
          .setStrokeStyle(1, 0x44aa44)
          .setInteractive({ useHandCursor: true });
        const claimLbl = this.add.text(500, y + 18, 'Забрать', {
          fontSize: '12px', fontFamily: FONT_FAMILY, color: '#aaffaa',
        }).setOrigin(0.5);

        const qid = questId;
        claimBtn.on('pointerdown', () => {
          claimQuestReward(qid);
          this.refreshHUD();
          this.rebuildPanel();
        });

        container.add([rowBg, titleT, rewardT, claimBtn, claimLbl]);
        y += 44;
        if (y > 460) break;
      }

      if (active.length > 0) {
        container.add(this.add.rectangle(379, y + 6, 320, 1, 0x444444));
        y += 18;
      }
    }

    if (active.length === 0 && pending.length === 0) {
      container.add(this.add.text(379, 400, 'Нет активных заданий', {
        fontSize: '14px', fontFamily: FONT_FAMILY, color: '#666666',
      }).setOrigin(0.5));
      return;
    }

    for (let i = 0; i < active.length; i++) {
      const q = active[i];
      const def = QUEST_DEFS[q.id];
      if (!def) continue;
      const title = this.add.text(210, y, def.title, { fontSize: '14px', fontFamily: FONT_FAMILY, color: '#dddddd' });
      const desc = this.add.text(210, y + 16, def.description, { fontSize: '12px', fontFamily: FONT_FAMILY, color: '#888888' });
      const progress = this.add.text(210, y + 30, `${q.progress}/${q.target}`, { fontSize: '12px', fontFamily: FONT_FAMILY, color: '#88aaff' });
      container.add([title, desc, progress]);
      y += 52;
      container.add(this.add.rectangle(379, y - 8, 320, 1, 0x333344));
      if (y > 600) break;
    }
  }

  private openChestPanel() {
    if (this.panelState !== 'chest') { this.closePanel(); this.panelState = 'chest'; }
    this.rebuildPanel();
  }

  private buildArmorStands(
    cx: number, startY: number,
    onSlotClick?: (slotId: SlotId) => void
  ): Phaser.GameObjects.GameObject[] {
    const objs: Phaser.GameObjects.GameObject[] = [];
    const si = this.selectedStandIndex;
    const stand = MetaStore.getArmorStand(si);
    const SIZE = 48;
    const originY = startY + 16;

    const ANATOMY: Record<SlotId, { dx: number; dy: number }> = {
      ring:        { dx: -54, dy:  28 },
      head:        { dx:   0, dy:   0 },
      amulet:      { dx:  54, dy:  28 },
      hand_left:   { dx: -54, dy:  84 },
      body:        { dx:   0, dy:  56 },
      hand_right:  { dx:  54, dy:  84 },
      legs:        { dx:   0, dy: 112 },
    };

    for (const [slotId, { dx, dy }] of Object.entries(ANATOMY) as [SlotId, { dx: number; dy: number }][]) {
      const x = cx + dx;
      const y = originY + dy;
      const inst = stand[slotId];

      const bg = this.add.rectangle(x, y, SIZE, SIZE, 0x2a2a3a)
        .setStrokeStyle(1, inst ? RARITY_COLORS[inst.rarity] : 0x444455);

      objs.push(bg);

      if (inst) {
        objs.push(this.add.image(x, y, itemIconKey(inst.item_id)).setDisplaySize(38, 38));
      } else {
        objs.push(this.add.image(x, y, slotSilhouetteKey(slotId)).setDisplaySize(36, 36).setAlpha(0.75));
      }

      if (this.dragDrop) {
        const sid = slotId;
        this.dragDrop.registerSlot({
          id: `stand_${slotId}`,
          slotType: slotId as unknown as SlotType,
          placeable: true,
          rect: this.panelRect(x - SIZE / 2, y - SIZE / 2, SIZE, SIZE),
          item: inst ?? null,
          onRemove: () => { const it = MetaStore.getArmorStand(si)[sid] ?? null; MetaStore.setArmorStandSlot(si, sid, null); return it; },
          onAccept: (it) => { MetaStore.setArmorStandSlot(si, sid, it); EventBus.emit('item_equipped'); this.time.delayedCall(0, () => this.rebuildPanel()); },
        });
      }

      if ((onSlotClick || this.dragDrop) && inst) {
        bg.setInteractive({ useHandCursor: true });
        const sid = slotId;
        bg.on('pointerover', () => { bg.setFillStyle(0x3a3a5a); if (inst) this.tooltip.showItem(inst, this.panelX(x + SIZE / 2 + 8), this.panelY(y - SIZE / 2 - 8)); });
        bg.on('pointerout',  () => { bg.setFillStyle(0x2a2a3a); this.tooltip.hide(); });
        if (this.dragDrop) {
          bg.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
            if (this.dragDrop?.isHolding()) return; // клик с предметом в руке обрабатывает pointerup
            this.pendingDrag = {
              slotId: `stand_${slotId}`, downX: ptr.x, downY: ptr.y,
              fallback: onSlotClick ? () => onSlotClick(sid) : undefined,
            };
          });
        } else if (onSlotClick) {
          bg.on('pointerdown', () => onSlotClick(sid));
        }
      }
    }
    return objs;
  }

  private buildPanelFrame() {
    const bg = this.add.rectangle(640, 400, 900, 520, 0x1e1e2e).setStrokeStyle(2, 0x555577).setInteractive();
    const divider = this.add.rectangle(570, 400, 1, 510, 0x444455);
    this.panelContainer.add([bg, divider]);
  }

  // Вертикальные вкладки слева от панели: Кузнец / Скупщик / Экипировка.
  // Единое меню — переключение вкладки не закрывает панель и сохраняет «руку»,
  // поэтому предмет можно перенести с одной вкладки на другую (стойка → стол кузнеца).
  private buildPanelTabs() {
    const tabs: { state: 'smith' | 'dealer' | 'chest'; label: string }[] = [
      { state: 'chest',  label: 'Экипировка' },
      { state: 'smith',  label: 'Кузнец' },
      { state: 'dealer', label: 'Скупщик' },
    ];
    const TAB_W = 96, TAB_H = 78, GAP = 10;
    const x = 148; // правый край вкладки (196) заходит за левую грань панели (190) — «пришитый» вид
    const total = tabs.length * TAB_H + (tabs.length - 1) * GAP;
    const startY = 400 - total / 2 + TAB_H / 2;

    tabs.forEach((t, i) => {
      const y = startY + i * (TAB_H + GAP);
      const active = this.panelState === t.state;
      const bg = this.add.rectangle(x, y, TAB_W, TAB_H, active ? 0x1e1e2e : 0x15151f)
        .setStrokeStyle(2, active ? 0x555577 : 0x33334a)
        .setInteractive({ useHandCursor: true });
      const lbl = this.add.text(x - 4, y, t.label, {
        fontSize: '12px', fontFamily: FONT_FAMILY, color: active ? '#ffffff' : '#777788',
      }).setOrigin(0.5);
      this.panelContainer.add([bg, lbl]);

      if (active) {
        // Накрыть шов между вкладкой и панелью, чтобы активная вкладка сливалась с ней.
        this.panelContainer.add(this.add.rectangle(194, y, 8, TAB_H - 4, 0x1e1e2e));
      } else {
        bg.on('pointerover', () => { bg.setFillStyle(0x1d1d29); lbl.setColor('#aaaacc'); });
        bg.on('pointerout',  () => { bg.setFillStyle(0x15151f); lbl.setColor('#777788'); });
        bg.on('pointerdown', () => this.switchTab(t.state));
      }
    });
  }

  // Переключение вкладки без закрытия панели: «рука» и содержимое сундука сохраняются.
  private switchTab(state: 'smith' | 'dealer' | 'chest') {
    if (this.panelState === state) return;
    this.tabClickGuard = true; // pointerup этого клика не должен уронить предмет из руки
    // Уходим с кузнеца — гасим режим молота (курсор), не трогая «руку».
    if (this.panelState === 'smith' && this.smithHammerMode) {
      this.smithHammerMode = false;
      this.input.setDefaultCursor('default');
      this.input.off('pointermove', this.forceHammerCursor, this);
    }
    this.tooltip.hide();
    this.panelState = state;
    this.rebuildPanel();
  }

  private smithCalcEssence(item: ItemInstance): EssencePool {
    return salvageEssence(item);
  }

  /** Разбирает предмет: начисляет весь пул эссенции, шлёт событие, возвращает подпись. */
  private grantSalvage(item: ItemInstance): string {
    const pool = this.smithCalcEssence(item);
    for (const tier of ESSENCE_TIERS) {
      if (pool[tier] > 0) MetaStore.addEssence(tier, pool[tier]);
    }
    EventBus.emit('item_disassembled');
    return formatEssence(pool);
  }

  /** Разбирает предмет: эссенция в мету, всплывающие иконки на месте клика, обновление панели. */
  private performSalvage(item: ItemInstance, x: number, y: number, keepHammer: boolean) {
    const pool = this.smithCalcEssence(item);
    const label = this.grantSalvage(item);
    this.spawnSalvageFloaters(pool, x, y);
    this.showMessage(`+${label} эссенции`);
    this.refreshHUD();
    if (!keepHammer) this.exitSmithHammerMode(); else this.rebuildPanel();
  }

  /** Иконка+число для каждого полученного тира эссенции — в случайной точке рядом с кликом. */
  private spawnSalvageFloaters(pool: EssencePool, x: number, y: number) {
    for (const tier of ESSENCE_TIERS) {
      const amount = pool[tier];
      if (amount <= 0) continue;
      const angle = Math.random() * Math.PI * 2;
      const radius = 8 + Math.random() * 20;
      spawnIconFloater(
        this, essenceIconKey(tier), `+${amount}`,
        x + Math.cos(angle) * radius, y + Math.sin(angle) * radius,
        TIER_HEX[tier],
      );
    }
  }

  private forceHammerCursor() {
    this.game.canvas.style.cursor = HAMMER_CURSOR;
  }

  private enterSmithHammerMode() {
    this.smithHammerMode = true;
    this.input.setDefaultCursor(HAMMER_CURSOR);
    this.input.on('pointermove', this.forceHammerCursor, this);
    this.rebuildPanel();
  }

  private exitSmithHammerMode() {
    this.smithHammerMode = false;
    this.input.setDefaultCursor('default');
    this.input.off('pointermove', this.forceHammerCursor, this);
    this.rebuildPanel();
  }

  // Кузнец: обмен эссенции между тирами (по центру верхних 2/3) + разборка предметов
  // на эссенцию (нижняя треть, отделена линией — см. divider ниже). Улучшение — на
  // вкладке «Экипировка» (см. buildUpgradePanel), сюда её не рисуем.
  private buildSmithContent() {
    const cx = 379;
    const toAdd: Phaser.GameObjects.GameObject[] = [];
    const meta = MetaStore.get();

    // Расстояние между строками = зазор между ячейками сундука (SIZE=52, GAP=6 в buildSharedChestPane).
    const ROW_H = 40, ROW_GAP = 6, ROW_SPACING = ROW_H + ROW_GAP;
    // Разделитель блока «Разобрать» ниже в этом методе — строки обмена центрируем
    // в пространстве над ним (диапазон 140-502).
    const CONTENT_TOP = 140, BOTTOM_DIVIDER_Y = 502;

    const exchangePairs = ESSENCE_TIERS
      .map((from): [EssenceTier, EssenceTier | null] => [from, ESSENCE_EXCHANGE_TARGET[from]])
      .filter((p): p is [EssenceTier, EssenceTier] => p[1] !== null);

    const contentMidY = (CONTENT_TOP + BOTTOM_DIVIDER_Y) / 2;
    const exchangeYStart = contentMidY - ((exchangePairs.length - 1) * ROW_SPACING) / 2;

    // Строки обмена дорогой эссенции на дешёвую (rare→uncommon, epic→rare).
    // Курс специально невыгодный (ESSENCE_EXCHANGE_RATE), без золота.
    exchangePairs.forEach(([from, to], j) => {
      const rowY = exchangeYStart + j * ROW_SPACING;
      const owned = meta.essence[from];
      const canExchange = owned >= 1;
      const output = ESSENCE_EXCHANGE_RATE;
      const fromLabel = ESSENCE_NAMES[from].charAt(0).toUpperCase() + ESSENCE_NAMES[from].slice(1);

      const rowBg = this.add.rectangle(cx + 7, rowY, 356, ROW_H, 0x222233).setStrokeStyle(1, 0x444455);

      const exchangeBtn = this.add.rectangle(cx + 7, rowY, 50, 26, canExchange ? 0x224422 : 0x332222)
        .setStrokeStyle(1, canExchange ? 0x44aa44 : 0x664444)
        .setInteractive({ useHandCursor: true });
      const exchangeLbl = this.add.text(cx + 7, rowY, 'Обменять', {
        fontSize: '10px', fontFamily: FONT_FAMILY, color: canExchange ? '#aaffaa' : '#886666', align: 'center',
      }).setOrigin(0.5);
      exchangeBtn.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
        if (this.dragDrop?.isHolding()) return; // с предметом в руке клик кладёт его в зону, а не меняет
        this.tryExchangeEssence(from, to, ptr.x, ptr.y);
      });

      // Слева от кнопки — что отдаём: «-1 [icon] Редкая».
      const toLabel = ESSENCE_NAMES[to].charAt(0).toUpperCase() + ESSENCE_NAMES[to].slice(1);
      const giveParts = this.layoutIconRow(
        '-1', TIER_HEX[from], essenceIconKey(from), fromLabel, TIER_HEX[from], rowY, cx - 125, true,
      );

      // Справа от кнопки — что получаем: «+3 [icon] Необычная».
      const getParts = this.layoutIconRow(
        `+${output}`, TIER_HEX[to], essenceIconKey(to), toLabel, TIER_HEX[to], rowY, cx + 40, false,
      );

      toAdd.push(rowBg, exchangeBtn, exchangeLbl, ...giveParts, ...getParts);
    });

    // Разделитель — та же линия, что и у блока улучшения на вкладке «Экипировка»
    // (buildUpgradePanel: divider на top-2, top=504), чтобы совпадать между вкладками.
    const divider = this.add.rectangle(cx, 502, 340, 1, 0x333344);
    toAdd.push(divider);

    // Кнопка-переключатель режима разборки (курсор-молот): пока включена, клик по предмету
    // в общем сундуке (см. getChestClickHandler) сразу разбирает его без подтверждения.
    // По центру нижней трети панели (между разделителем 502 и нижним краем панели 660).
    const hammerActive = this.smithHammerMode;
    const btnY = 582;
    const BTN_W = 220, BTN_H = 44;
    const hammerBtn = this.add.rectangle(cx, btnY, BTN_W, BTN_H, hammerActive ? 0x5a3a1a : 0x2a2a1a)
      .setStrokeStyle(hammerActive ? 2 : 1, hammerActive ? 0xffaa44 : 0x446644)
      .setInteractive({ useHandCursor: true });
    const hammerG = this.add.image(cx - BTN_W / 2 + 30, btnY, 'hammer').setDisplaySize(24, 24);
    const hammerLbl = this.add.text(cx - BTN_W / 2 + 54, btnY, 'Разобрать', {
      fontSize: '14px', fontFamily: FONT_FAMILY,
      color: hammerActive ? '#ffcc88' : '#aaddaa', align: 'center',
    }).setOrigin(0, 0.5);
    hammerBtn.on('pointerover', () => { if (!this.smithHammerMode) hammerBtn.setFillStyle(0x3a3a2a); });
    hammerBtn.on('pointerout',  () => { if (!this.smithHammerMode) hammerBtn.setFillStyle(0x2a2a1a); });
    hammerBtn.on('pointerdown', () => {
      if (this.dragDrop?.isHolding()) return; // с предметом в руке клик кладёт его в зону, а не переключает разборку
      if (this.smithHammerMode) this.exitSmithHammerMode(); else this.enterSmithHammerMode();
    });
    toAdd.push(hammerBtn, hammerG, hammerLbl);

    this.panelContainer.add(toAdd);
  }

  /** Обмен дорогой эссенции на дешёвую по невыгодному курсу 1:ESSENCE_EXCHANGE_RATE, без золота. */
  private tryExchangeEssence(from: EssenceTier, to: EssenceTier, x?: number, y?: number) {
    const meta = MetaStore.get();
    if (meta.essence[from] < 1) {
      this.showMessage('Недостаточно эссенции!');
      return;
    }
    const cost = emptyEssence();
    cost[from] = 1;
    MetaStore.spendEssence(cost);
    const output = ESSENCE_EXCHANGE_RATE;
    MetaStore.addEssence(to, output);
    spawnIconFloater(this, essenceIconKey(from), '-1', x ?? this.panelX(379), y ?? this.panelY(300), TIER_HEX[from]);
    spawnIconFloater(this, essenceIconKey(to), `+${output}`, x ?? this.panelX(379), y ?? this.panelY(300), TIER_HEX[to]);
    this.refreshHUD();
    this.rebuildPanel();
  }

  /**
   * Строка «число + иконка + подпись» (например «+3 [icon] Необычная»).
   * alignRight — anchorX это фиксированная колонка иконки (число растёт влево от неё, подпись
   * вправо), так иконки в нескольких строках с разной длиной подписи стоят друг под другом.
   * !alignRight — anchorX это левый край числа, всё растёт вправо (иконка не выравнивается
   * между строками, но у неё и так постоянный текст числа слева, так что она уже совпадает).
   */
  private layoutIconRow(
    numText: string, numColor: string, iconKey: string, labelText: string, labelColor: string,
    rowY: number, anchorX: number, alignRight: boolean,
  ): [Phaser.GameObjects.Text, Phaser.GameObjects.Image, Phaser.GameObjects.Text] {
    const gap = 4, iconSize = 16;
    const iconX = alignRight ? anchorX : 0; // при !alignRight досчитаем ниже, после ширины numLbl
    const numLbl = this.add.text(0, rowY, numText, {
      fontSize: '16px', fontFamily: FONT_FAMILY, color: numColor,
    }).setOrigin(alignRight ? 1 : 0, 0.5);
    const icon = this.add.image(iconX, rowY, iconKey).setDisplaySize(iconSize, iconSize).setOrigin(0, 0.5);
    const tierLbl = this.add.text(0, rowY, labelText, {
      fontSize: '12px', fontFamily: FONT_FAMILY, color: labelColor,
    }).setOrigin(0, 0.5);

    if (alignRight) {
      numLbl.x = anchorX - gap;
      tierLbl.x = anchorX + iconSize + gap;
    } else {
      numLbl.x = anchorX;
      icon.x = anchorX + numLbl.width + gap;
      tierLbl.x = anchorX + numLbl.width + gap + iconSize + gap;
    }
    return [numLbl, icon, tierLbl];
  }

  // Блок улучшения на вкладке «Экипировка», в нижней трети панели под стойкой брони:
  // вход → выход, кнопка «Улучшить». Логика расчёта — craftPreview() из src/items/craft.ts.
  private buildUpgradePanel(cx: number, top: number) {
    const S = 44;
    const inputX = cx - 54, arrowX = cx, resultX = cx + 54;
    const slotY = top + 37;
    const item = this.upgradeInputItem;
    const resultItem = this.upgradeResultItem;

    // Превью улучшения одного предмета: следующая редкость + стоимость.
    // Пока в правой ячейке лежит неснятый результат, крафтить дальше нельзя — сначала забрать.
    let previewResult: ItemInstance | null = null;
    let canCraft = false;
    let craftError: string | null = null;
    let essenceCost: EssencePool | null = null;

    if (item && resultItem) {
      craftError = 'Заберите результат из ячейки справа';
    } else if (item) {
      const pv = craftPreview(item, null);
      if (pv.result) {
        previewResult = pv.result;
        essenceCost = pv.essenceCost;
        canCraft = !essenceCost || MetaStore.canAffordEssence(essenceCost);
      } else {
        craftError = pv.error;
      }
    }

    const divider = this.add.rectangle(cx, top - 2, 340, 1, 0x333344);

    // Входной слот
    const s1Bg = this.add.rectangle(inputX, slotY, S, S, 0x2a2a3a)
      .setStrokeStyle(2, item ? RARITY_COLORS[item.rarity] : 0x555566);
    const s1Content = item
      ? this.add.image(inputX, slotY, itemIconKey(item.item_id)).setDisplaySize(34, 34)
      : this.add.image(inputX, slotY, upgradeIconKey('plus')).setDisplaySize(22, 22);

    // "→"
    const arrowActive = !!(previewResult || resultItem);
    const arrowLbl = this.add.text(arrowX, slotY, '→', {
      fontSize: '28px', fontFamily: FONT_FAMILY, color: arrowActive ? '#667766' : '#333344',
    }).setOrigin(0.5);

    // Слот результата: пока идёт выбор — полупрозрачное превью; после апгрейда — настоящий предмет, который можно забрать.
    const s3Bg = this.add.rectangle(resultX, slotY, S, S, 0x252530)
      .setStrokeStyle(2, resultItem ? RARITY_COLORS[resultItem.rarity] : previewResult ? RARITY_COLORS[previewResult.rarity] : 0x333344);
    let s3Content: Phaser.GameObjects.Image | null = null;
    if (resultItem) {
      s3Content = this.add.image(resultX, slotY, itemIconKey(resultItem.item_id)).setDisplaySize(34, 34);
    } else if (previewResult) {
      s3Content = this.add.image(resultX, slotY, itemIconKey(previewResult.item_id)).setDisplaySize(34, 34).setAlpha(0.3);
    } else {
      s3Content = this.add.image(resultX, slotY, upgradeIconKey('question_mark')).setDisplaySize(20, 20);
    }

    // DragDrop: входной слот принимает только перетаскивание (клик по предмету в сундуке
    // на этой вкладке экипирует его на стойку — это основной сценарий, не конфликтуем с ним).
    if (this.dragDrop) {
      this.dragDrop.registerSlot({
        id: 'upgrade_input_slot',
        placeable: true,
        alwaysHighlight: (it) => craftPreview(it, null).result !== null,
        rect: this.panelRect(inputX - S / 2, slotY - S / 2, S, S),
        item: item ?? null,
        onRemove: () => { const it = this.upgradeInputItem; this.upgradeInputItem = null; return it; },
        onAccept: (it) => { this.upgradeInputItem = it; EventBus.emit('item_placed_smith'); this.time.delayedCall(0, () => this.rebuildPanel()); },
      });
      this.dragDrop.registerSlot({
        id: 'upgrade_zone',
        placeable: true,
        allowOccupied: true,
        rect: this.panelRect(cx - 170, top, 340, 150),
        item: null,
        onRemove: () => null,
        onAccept: (it) => {
          if (!this.upgradeInputItem) { this.upgradeInputItem = it; EventBus.emit('item_placed_smith'); }
          else { MetaStore.addToChest(it); this.showMessage('Слот занят'); }
          this.time.delayedCall(0, () => this.rebuildPanel());
        },
      });
      // Слот результата — только забрать drag'ом, положить в него нельзя.
      if (resultItem) {
        this.dragDrop.registerSlot({
          id: 'upgrade_result_slot',
          rect: this.panelRect(resultX - S / 2, slotY - S / 2, S, S),
          item: resultItem,
          onRemove: () => { const it = this.upgradeResultItem; this.upgradeResultItem = null; return it; },
          onAccept: () => {},
        });
      }
    }

    // Взаимодействие с входным слотом
    if (item) {
      s1Bg.setInteractive({ useHandCursor: true });
      s1Bg.on('pointerover', () => {
        s1Bg.setFillStyle(0x3a3a5a);
        this.tooltip.showItem(item, this.panelX(inputX + S / 2 + 8), this.panelY(slotY - S / 2 - 8));
      });
      s1Bg.on('pointerout', () => { s1Bg.setFillStyle(0x2a2a3a); this.tooltip.hide(); });
      if (this.dragDrop) {
        s1Bg.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
          if (this.dragDrop?.isHolding()) return;
          this.pendingDrag = {
            slotId: 'upgrade_input_slot', downX: ptr.x, downY: ptr.y,
            fallback: () => { MetaStore.addToChest(this.upgradeInputItem!); this.upgradeInputItem = null; this.rebuildPanel(); },
          };
        });
      } else {
        s1Bg.on('pointerdown', () => { MetaStore.addToChest(this.upgradeInputItem!); this.upgradeInputItem = null; this.rebuildPanel(); });
      }
    }

    // Взаимодействие со слотом результата
    if (resultItem) {
      // Готовый предмет — можно забрать drag'ом (клик берёт в руку / зажатие тащит).
      s3Bg.setInteractive({ useHandCursor: true });
      s3Bg.on('pointerover', () => {
        s3Bg.setFillStyle(0x35354a);
        this.tooltip.showItem(resultItem, this.panelX(resultX + S / 2 + 8), this.panelY(slotY - S / 2 - 8));
      });
      s3Bg.on('pointerout', () => { s3Bg.setFillStyle(0x252530); this.tooltip.hide(); });
      if (this.dragDrop) {
        s3Bg.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
          if (this.dragDrop?.isHolding()) return;
          this.pendingDrag = { slotId: 'upgrade_result_slot', downX: ptr.x, downY: ptr.y };
        });
      } else {
        s3Bg.on('pointerdown', () => { MetaStore.addToChest(this.upgradeResultItem!); this.upgradeResultItem = null; this.rebuildPanel(); });
      }
    } else if (previewResult) {
      // Только превью следующего шага — без взаимодействия, кроме тултипа.
      s3Bg.setInteractive({ useHandCursor: false });
      s3Bg.on('pointerover', () => {
        this.tooltip.showItem(previewResult!, this.panelX(resultX + S / 2 + 8), this.panelY(slotY - S / 2 - 8), { defaultCost: 'essence' });
      });
      s3Bg.on('pointerout', () => { this.tooltip.hide(); });
    }

    // Кнопка — всегда «Улучшить», активна только когда хватает ресурсов.
    const btnY = slotY + S / 2 + 26;
    const BTN_W = 170, BTN_H = 32;
    const btnEnabled = canCraft;
    const btnColor = btnEnabled ? 0x335533 : 0x222233;
    const btn = this.add.rectangle(cx, btnY, BTN_W, BTN_H, btnColor);
    if (btnEnabled) btn.setInteractive({ useHandCursor: true });
    const btnLbl = this.add.text(cx, btnY, 'Улучшить', {
      fontSize: '14px', fontFamily: FONT_FAMILY,
      color: btnEnabled ? '#aaffaa' : '#555566', align: 'center',
    }).setOrigin(0.5);
    if (btnEnabled && previewResult) {
      btn.on('pointerdown', () => {
        if (this.dragDrop?.isHolding()) return; // с предметом в руке клик кладёт его в зону, а не улучшает
        if (essenceCost) MetaStore.spendEssence(essenceCost);
        // Улучшенный предмет уходит в правую ячейку, входной слот освобождается.
        this.upgradeResultItem = { item_id: previewResult!.item_id, rarity: previewResult!.rarity };
        this.upgradeInputItem = null;
        EventBus.emit('item_crafted');
        EventBus.emit('items_combined');
        this.refreshHUD();
        this.rebuildPanel();
      });
    }

    // Стоимость под кнопкой: каждая валюта — своя строка (иконка + «есть / нужно»), красная если не хватает.
    const costLbls: Phaser.GameObjects.GameObject[] = [];
    if (previewResult) {
      const meta = MetaStore.get();
      const rows: { icon: string; need: number; have: number }[] = [];
      if (essenceCost) {
        for (let i = ESSENCE_TIERS.length - 1; i >= 0; i--) {
          const tier = ESSENCE_TIERS[i];
          const need = essenceCost[tier];
          if (need > 0) rows.push({ icon: essenceIconKey(tier), need, have: meta.essence[tier] });
        }
      }
      let ry = btnY + BTN_H / 2 + 16;
      for (const row of rows) {
        const enough = row.have >= row.need;
        costLbls.push(resourceTag(this, row.icon, `${row.have} / ${row.need}`, {
          iconSize: 14, fontSize: 10, originX: 0.5, color: enough ? '#88aa88' : '#dd5555',
        }).setPosition(cx, ry));
        ry += 16;
      }
    } else if (craftError) {
      costLbls.push(this.add.text(cx, btnY + BTN_H / 2 + 18, craftError, {
        fontSize: '10px', fontFamily: FONT_FAMILY, color: '#886655', align: 'center',
        wordWrap: { width: 220 },
      }).setOrigin(0.5));
    }

    const toAdd: Phaser.GameObjects.GameObject[] = [
      divider, s1Bg, s1Content, arrowLbl, s3Bg, btn, btnLbl, ...costLbls,
    ];
    if (s3Content) toAdd.push(s3Content);
    this.panelContainer.add(toAdd);
  }

  private buildDealerContent() {
    const content = this.add.container(0, 0);
    this.buildQuestList(content);
    this.panelContainer.add(content);
  }

  private buildChestStandContent() {
    const cx = 379;

    const tabs = this.buildStandTabs(cx, 210);

    const si = this.selectedStandIndex;
    const onStandSlotClick = (slotId: SlotId) => {
      const item = MetaStore.getArmorStand(si)[slotId];
      if (item) {
        MetaStore.setArmorStandSlot(si, slotId, null);
        MetaStore.addToChest(item);
        this.rebuildPanel();
      }
    };

    // Крест слотов по центру между табами стоек (y=210) и разделительной линией блока улучшения (y=502).
    const stands = this.buildArmorStands(cx, 290, onStandSlotClick);
    this.panelContainer.add([...tabs, ...stands]);
    this.buildUpgradePanel(cx, 504);
  }

  // Табы выбора активной стойки-пресета (1/2/3): переключают selectedStandIndex.
  private buildStandTabs(cx: number, y: number): Phaser.GameObjects.GameObject[] {
    const objs: Phaser.GameObjects.GameObject[] = [];
    const W = 46, H = 26, GAP = 8;
    const total = ARMOR_STAND_COUNT * W + (ARMOR_STAND_COUNT - 1) * GAP;
    const startX = cx - total / 2 + W / 2;
    for (let i = 0; i < ARMOR_STAND_COUNT; i++) {
      const x = startX + i * (W + GAP);
      const active = i === this.selectedStandIndex;
      const bg = this.add.rectangle(x, y, W, H, active ? 0x3a4a6a : 0x222233)
        .setStrokeStyle(1, active ? 0x88aaff : 0x444455)
        .setInteractive({ useHandCursor: true });
      const lbl = this.add.text(x, y, `${i + 1}`, {
        fontSize: '10px', fontFamily: FONT_FAMILY, color: active ? '#cfe0ff' : '#8899aa',
      }).setOrigin(0.5);
      if (!active) {
        bg.on('pointerover', () => bg.setFillStyle(0x2a2a3a));
        bg.on('pointerout',  () => bg.setFillStyle(0x222233));
        bg.on('pointerdown', () => { this.tabClickGuard = true; this.selectedStandIndex = i; this.rebuildPanel(); });
      }
      objs.push(bg, lbl);
    }
    return objs;
  }

  private getChestClickHandler(): ((inst: ItemInstance, idx: number) => void) | undefined {
    if (this.panelState === 'smith') {
      if (!this.smithHammerMode) return undefined; // без режима разборки клик по сундуку ничего не делает
      return (inst, idx) => {
        // Разборка — мгновенно, без подтверждения.
        const ptr = this.input.activePointer;
        const keepHammer = !!(ptr?.event as MouseEvent)?.shiftKey;
        const clickX = ptr?.x ?? CX, clickY = ptr?.y ?? 400;
        MetaStore.removeFromChest(idx);
        this.performSalvage(inst, clickX, clickY, keepHammer);
      };
    }
    if (this.panelState === 'chest') {
      return (inst, idx) => {
        const beh = getItemBehavior(inst.item_id);
        const si = this.selectedStandIndex;
        const stand = MetaStore.getArmorStand(si);
        const slot = (beh.slots as SlotId[]).find(s => !stand[s]);
        if (slot) {
          MetaStore.removeFromChest(idx);
          MetaStore.setArmorStandSlot(si, slot, inst);
          EventBus.emit('item_equipped');
          this.rebuildPanel();
        } else {
          this.showMessage('Все подходящие слоты заняты');
        }
      };
    }
    return undefined;
  }

  private buildSharedChestPane(
    onItemClick?: (inst: ItemInstance, idx: number) => void,
  ) {
    const CHEST_CX = 830;
    const showFilters = true;

    const FILTER_CELL = 52;
    const CELL_GAP = 6;
    const N_FILTER_CELLS = 7;
    const FILTER_ROW_W = N_FILTER_CELLS * FILTER_CELL + (N_FILTER_CELLS - 1) * CELL_GAP;
    const FILTER_START_X = CHEST_CX - FILTER_ROW_W / 2;
    const FILTER_Y1 = 210;
    const FILTER_Y2 = FILTER_Y1 + FILTER_CELL + CELL_GAP;

    const CONTENT_TOP = Math.ceil(FILTER_Y2 + FILTER_CELL / 2 + 6);
    const CONTENT_BOTTOM = 648;
    const CONTENT_H = CONTENT_BOTTOM - CONTENT_TOP;
    const SIZE = 52;
    const GAP = 6;
    const ROW_H = SIZE + GAP;
    const COLS = 5;
    const ROWS_VIS = Math.floor(CONTENT_H / ROW_H);

    this.panelContainer.add(this.add.text(CHEST_CX, 163, 'Сундук', {
      fontSize: '16px', fontFamily: FONT_FAMILY, color: '#aaaaaa',
    }).setOrigin(0.5));

    if (showFilters) {
      const SLOT_TYPES: SlotType[] = ['head', 'body', 'legs', 'hand_left', 'hand_right', 'ring', 'amulet'];

      for (let i = 0; i < SLOT_TYPES.length; i++) {
        const slot = SLOT_TYPES[i];
        const cx = FILTER_START_X + i * (FILTER_CELL + CELL_GAP) + FILTER_CELL / 2;
        const isActive = this.chestSlotFilter === slot;
        const bg = this.add.rectangle(cx, FILTER_Y1, FILTER_CELL, FILTER_CELL,
          isActive ? 0x334466 : 0x222233)
          .setStrokeStyle(1, isActive ? 0x8899cc : 0x555566)
          .setInteractive({ useHandCursor: true });
        const icon = this.add.image(cx, FILTER_Y1, slotSilhouetteKey(slot))
          .setDisplaySize(36, 36)
          .setAlpha(isActive ? 1 : 0.4);
        bg.on('pointerover', () => { if (!isActive) { bg.setFillStyle(0x2a2a44); icon.setAlpha(0.65); } });
        bg.on('pointerout', () => { if (!isActive) { bg.setFillStyle(0x222233); icon.setAlpha(0.4); } });
        bg.on('pointerdown', () => {
          this.chestSlotFilter = isActive ? null : slot;
          this.rebuildPanel();
        });
        this.panelContainer.add([bg, icon]);
      }

      const RARITY_FILTER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

      for (let i = 0; i < RARITY_FILTER.length; i++) {
        const rarity = RARITY_FILTER[i];
        const cx = FILTER_START_X + i * (FILTER_CELL + CELL_GAP) + FILTER_CELL / 2;
        const isActive = this.chestRarityFilter === rarity;
        const col = RARITY_COLORS[rarity];
        const bg = this.add.rectangle(cx, FILTER_Y2, FILTER_CELL, FILTER_CELL,
          isActive ? 0x2a2a3a : 0x1e1e2e)
          .setStrokeStyle(isActive ? 2 : 1, isActive ? col : 0x555566)
          .setInteractive({ useHandCursor: true });
        const icon = this.add.image(cx, FILTER_Y2, essenceIconKeyByRarity(rarity))
          .setDisplaySize(28, 28)
          .setAlpha(isActive ? 1 : 0.4);
        bg.on('pointerover', () => { if (!isActive) { bg.setFillStyle(0x252530); icon.setAlpha(0.65); } });
        bg.on('pointerout', () => { if (!isActive) { bg.setFillStyle(0x1e1e2e); icon.setAlpha(0.4); } });
        bg.on('pointerdown', () => {
          this.chestRarityFilter = isActive ? null : rarity;
          this.rebuildPanel();
        });
        this.panelContainer.add([bg, icon]);
      }

      // Sort button — 6th cell in rarity row
      {
        const cx = FILTER_START_X + 5 * (FILTER_CELL + CELL_GAP) + FILTER_CELL / 2;
        const bg = this.add.rectangle(cx, FILTER_Y2, FILTER_CELL, FILTER_CELL, 0x1e1e2e)
          .setStrokeStyle(1, 0x555566)
          .setInteractive({ useHandCursor: true });
        const lbl = this.add.text(cx, FILTER_Y2, '▲▼', {
          fontSize: '14px', fontFamily: FONT_FAMILY, color: '#666677',
        }).setOrigin(0.5);
        bg.on('pointerover', () => { bg.setFillStyle(0x252530); lbl.setColor('#9999aa'); });
        bg.on('pointerout', () => { bg.setFillStyle(0x1e1e2e); lbl.setColor('#666677'); });
        bg.on('pointerdown', () => { MetaStore.sortChest(); this.rebuildPanel(); });
        this.panelContainer.add([bg, lbl]);
      }
    }

    const meta = MetaStore.get();

    const filteredItems: { item: ItemInstance; origIdx: number }[] = [];
    meta.chest.forEach((item, idx) => {
      if (showFilters && this.chestSlotFilter) {
        const beh = getItemBehavior(item.item_id);
        if (!beh.slots.includes(this.chestSlotFilter)) return;
      }
      if (showFilters && this.chestRarityFilter && item.rarity !== this.chestRarityFilter) return;
      filteredItems.push({ item, origIdx: idx });
    });

    // Стак: одинаковый item_id + rarity рисуется одним квадратом с счётчиком.
    // Хранилище остаётся плоским; представитель стака — ПОСЛЕДНИЙ экземпляр
    // (по индексу в chest), при продаже/использовании удаляется он. Так splice
    // не сдвигает индексы первых вхождений других стаков — визуальный порядок
    // стабилен, слот съезжает только когда стак опустошается полностью.
    const stacks: { item: ItemInstance; origIdx: number; count: number }[] = [];
    const stackByKey = new Map<string, { item: ItemInstance; origIdx: number; count: number }>();
    for (const { item, origIdx } of filteredItems) {
      const key = `${item.item_id}|${item.rarity}`;
      const existing = stackByKey.get(key);
      if (existing) { existing.count++; existing.origIdx = origIdx; continue; }
      const s = { item, origIdx, count: 1 };
      stackByKey.set(key, s);
      stacks.push(s);
    }

    const neededSlots = Math.max(stacks.length, ROWS_VIS * COLS);
    const totalRows = Math.ceil(neededSlots / COLS);
    const totalSlots = totalRows * COLS;
    const maxScroll = Math.max(0, (totalRows - ROWS_VIS) * ROW_H);

    if (this.dragDrop) {
      this.dragDrop.registerSlot({
        id: 'chest_drop',
        rect: this.panelRect(573, CONTENT_TOP, 512, CONTENT_H + 2),
        item: null,
        onRemove: () => null,
        onAccept: (it) => { MetaStore.addToChest(it); this.time.delayedCall(0, () => this.rebuildPanel()); },
      });
    }

    // Геометрическая маска живёт в экранных координатах (объект вне контейнера панели) — переводим.
    this.chestMaskGraphics = this.add.graphics();
    this.chestMaskGraphics.fillRect(
      this.panelX(573), this.panelY(CONTENT_TOP),
      512 * this.panelScale, (CONTENT_H + 2) * this.panelScale,
    );
    const mask = this.chestMaskGraphics.createGeometryMask();

    const itemsCtr = this.add.container(0, 0);
    itemsCtr.setMask(mask);
    this.panelContainer.add(itemsCtr);

    let scrollPx = 0;

    const buildSlots = () => {
      itemsCtr.removeAll(true);
      for (let i = 0; i < totalSlots; i++) {
        const row = Math.floor(i / COLS);
        const col = i % COLS;
        const x = CHEST_CX - 2 * (SIZE + GAP) + col * (SIZE + GAP);
        const yTop = CONTENT_TOP + row * ROW_H - scrollPx;
        const yc = yTop + SIZE / 2;
        if (yc + SIZE / 2 < CONTENT_TOP || yc - SIZE / 2 > CONTENT_BOTTOM) continue;

        const entry = stacks[i];
        const inst = entry?.item;
        const slotBg = this.add.rectangle(x, yc, SIZE, SIZE, 0x2a2a3a)
          .setStrokeStyle(1, inst ? RARITY_COLORS[inst.rarity] : 0x555566);
        itemsCtr.add(slotBg);

        if (inst) {
          itemsCtr.add(this.add.image(x, yc, itemIconKey(inst.item_id)).setDisplaySize(38, 38));
          if (entry.count > 1) {
            itemsCtr.add(this.add.text(x + SIZE / 2 - 3, yc + SIZE / 2 - 3, `${entry.count}`, {
              fontSize: '12px', fontFamily: FONT_FAMILY, color: '#ffffff',
              stroke: '#000000', strokeThickness: 3,
            }).setOrigin(1, 1));
          }
          const idx = entry.origIdx;
          const item = inst;
          slotBg.setInteractive({ useHandCursor: true });
          slotBg.on('pointerover', () => {
            slotBg.setFillStyle(0x3a3a5a);
            this.tooltip.showItem(item, this.panelX(x + SIZE / 2 + 8), this.panelY(yc - SIZE / 2 - 8), {
              defaultCost: this.panelState === 'smith' ? 'essence' : 'none',
            });
          });
          slotBg.on('pointerout', () => { slotBg.setFillStyle(0x2a2a3a); this.tooltip.hide(); });

          if (this.dragDrop) {
            const chestSlotId = `chest_${idx}`;
            this.dragDrop.registerSlot({
              id: chestSlotId,
              rect: this.panelRect(x - SIZE / 2, yc - SIZE / 2, SIZE, SIZE),
              item: inst,
              onRemove: () => { MetaStore.removeFromChest(idx); return inst; },
              onAccept: () => {},
            });
            slotBg.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
              if (this.dragDrop?.isHolding()) return; // клик с предметом в руке обрабатывает pointerup
              this.tooltip.hide();
              this.pendingDrag = {
                slotId: chestSlotId, downX: ptr.x, downY: ptr.y,
                fallback: onItemClick ? () => onItemClick(item, idx) : undefined,
              };
            });
          } else if (onItemClick) {
            slotBg.on('pointerdown', () => { this.tooltip.hide(); onItemClick(item, idx); });
          }
        }
      }
      if (maxScroll > 0) {
        const trackH = CONTENT_H - 8;
        const thumbH = Math.max(24, trackH * (ROWS_VIS / totalRows));
        const thumbY = CONTENT_TOP + 4 + (scrollPx / maxScroll) * (trackH - thumbH);
        itemsCtr.add(this.add.rectangle(1083, CONTENT_TOP + 4 + trackH / 2, 3, trackH, 0x333344));
        itemsCtr.add(this.add.rectangle(1083, thumbY + thumbH / 2, 3, thumbH, 0x666688));
      }
    };

    buildSlots();

    this.panelWheelHandler = (_p: unknown, _g: unknown, _dx: unknown, deltaY: unknown) => {
      scrollPx = Math.max(0, Math.min(maxScroll, scrollPx + (deltaY as number) * 0.5));
      buildSlots();
    };
    this.input.on('wheel', this.panelWheelHandler!);
  }

  private openMapPanel() {
    if (this.panelState !== 'map') { this.closePanel(); this.panelState = 'map'; }
    this.rebuildPanel();
  }

  private buildMapContent() {
    const meta = MetaStore.get();
    const bg = this.add.image(640, 380, 'map-texture').setDisplaySize(660, 620);
    const border = this.add.rectangle(640, 380, 660, 620, 0x000000, 0).setStrokeStyle(2, 0x7a6040);
    const title = this.add.text(640, 100, 'Карта', {
      fontSize: '22px', fontFamily: FONT_FAMILY, color: '#3a2010',
      stroke: '#c8a86b', strokeThickness: 1,
    }).setOrigin(0.5);
    this.panelContainer.add([bg, border, title]);

    // Выбор стойки убран с карты: клик по зоне уходит с последней активной стойкой
    // (её меняют на стенде или прямо в бою). См. docs/ui.md.
    this.buildMapConnections();

    for (const entry of MAP_ZONE_LAYOUT) {
      this.buildMapZoneNode(entry, meta.unlocked_areas, meta.completed_areas, meta.stats.items_carried_out);
    }
  }

  // Направленные стрелки маршрута каждой фракции (из FACTION_ROUTES): задают порядок
  // прохождения зон. Линия обрезается до краёв узлов (170×80), на конце — наконечник.
  private buildMapConnections() {
    const pos = new Map(MAP_ZONE_LAYOUT.map(z => [z.id, { x: z.x, y: z.y }] as const));
    const EDGES: [string, string][] = [];
    for (const route of FACTION_ROUTES) {
      for (let i = 0; i + 1 < route.length; i++) EDGES.push([route[i], route[i + 1]]);
    }

    const g = this.add.graphics();
    g.lineStyle(2.5, 0x7a5228, 0.85);
    const HW = 85, HH = 40, PAD = 8, HEAD = 11;
    for (const [a, b] of EDGES) {
      const pa = pos.get(a), pb = pos.get(b);
      if (!pa || !pb) continue;
      const dx = pb.x - pa.x, dy = pb.y - pa.y;
      const len = Math.hypot(dx, dy);
      if (len === 0) continue;
      const ux = dx / len, uy = dy / len;
      // Расстояние от центра узла до его края вдоль направления линии + отступ.
      const trim = Math.min(HW / (Math.abs(ux) || 1e-6), HH / (Math.abs(uy) || 1e-6)) + PAD;
      const sx = pa.x + ux * trim, sy = pa.y + uy * trim;
      const ex = pb.x - ux * trim, ey = pb.y - uy * trim;
      g.lineBetween(sx, sy, ex, ey);
      // Наконечник стрелки у целевого узла.
      const ang = Math.atan2(ey - sy, ex - sx);
      g.lineBetween(ex, ey, ex + Math.cos(ang + Math.PI * 0.82) * HEAD, ey + Math.sin(ang + Math.PI * 0.82) * HEAD);
      g.lineBetween(ex, ey, ex + Math.cos(ang - Math.PI * 0.82) * HEAD, ey + Math.sin(ang - Math.PI * 0.82) * HEAD);
    }
    this.panelContainer.add(g);
  }

  private buildMapZoneNode(entry: MapZoneEntry, unlocked: string[], completed: string[], carriedOut: Record<string, number>) {
    const isWip = WIP_ZONE_IDS.has(entry.id);
    const isCenter = entry.id === 'battlefield';
    // Босс убит хотя бы раз — управляет гейтами (блокировка ниже, zonePrereqMet, isCenterUnlocked).
    const isCompleted = completed.includes(entry.id);
    // Зелёная метка «✓ Пройдена»: весь лут-пул зоны вынесен в сундук И босс убит хотя бы раз.
    // Чисто визуальный критерий, на геймплейные гейты открытия зон не влияет (см. план).
    const isFullyLooted = !isWip && !isCenter && isCompleted && isZoneFullyLooted(entry.id, carriedOut);
    // Центр — гейт по топологии (все 9 зон), а не через проходку/квесты.
    const isUnlocked = isCenter
      ? MetaStore.isCenterUnlocked()
      : unlocked.includes(entry.id);

    let fillColor = 0x333355;
    let borderColor = 0x555577;
    let labelColor = '#666688';

    if (isWip) {
      fillColor = 0x222233; borderColor = 0x333344; labelColor = '#444455';
    } else if (isUnlocked || isCompleted) {
      fillColor = isFullyLooted ? 0x224422 : 0x224466;
      borderColor = isFullyLooted ? 0x44aa44 : 0x4488cc;
      labelColor = '#ddddff';
    }

    const node = this.add.rectangle(entry.x, entry.y, 170, 80, fillColor).setStrokeStyle(2, borderColor);
    const nameText = this.add.text(entry.x, entry.y - 12, entry.label, {
      fontSize: '16px', fontFamily: FONT_FAMILY, color: labelColor,
      align: 'center', wordWrap: { width: 160 },
    }).setOrigin(0.5);
    this.panelContainer.add([node, nameText]);

    if (isWip) {
      this.panelContainer.add(this.add.text(entry.x, entry.y + 20, 'В разработке', {
        fontSize: '14px', fontFamily: FONT_FAMILY, color: '#333344',
      }).setOrigin(0.5));
      return;
    }

    if (this.zoneHasActiveQuest(entry.id)) {
      this.buildQuestMarker(entry.x + 78, entry.y - 28);
    }

    if (isFullyLooted) {
      this.panelContainer.add(this.add.text(entry.x, entry.y + 20, '✓ Пройдена', {
        fontSize: '14px', fontFamily: FONT_FAMILY, color: '#44aa44',
      }).setOrigin(0.5));
    }

    if (!isUnlocked && !isCompleted) {
      // Центр открывается автоматически зачисткой трёх конечных зон — проходку не купить.
      if (isCenter) {
        this.panelContainer.add(this.add.text(entry.x, entry.y + 20, '🔒 нужны 3 зоны', {
          fontSize: '14px', fontFamily: FONT_FAMILY, color: '#888888',
        }).setOrigin(0.5));
        node.setInteractive({ useHandCursor: true });
        nameText.setInteractive({ useHandCursor: true });
        [node, nameText].forEach(obj => {
          obj.on('pointerover', () => {
            node.setFillStyle(0x332233);
            this.tooltip.showText(['Центр закрыт', 'Пройди Склеп, Пастбище хищников', 'и Логово мародёров'], this.panelX(entry.x + 65), this.panelY(entry.y - 50));
          });
          obj.on('pointerout', () => { node.setFillStyle(fillColor); this.tooltip.hide(); });
        });
        return;
      }

      // Проходку можно купить только после прохождения предыдущей зоны маршрута.
      if (!zonePrereqMet(entry.id, completed)) {
        const prevLabel = zoneLabel(ZONE_PREREQ[entry.id]);
        this.panelContainer.add(this.add.text(entry.x, entry.y + 20, '🔒 пройди прошлую', {
          fontSize: '14px', fontFamily: FONT_FAMILY, color: '#886666',
        }).setOrigin(0.5));
        node.setInteractive({ useHandCursor: true });
        nameText.setInteractive({ useHandCursor: true });
        [node, nameText].forEach(obj => {
          obj.on('pointerover', () => {
            node.setFillStyle(0x332233);
            this.tooltip.showText(['Заблокировано', `Сначала пройди: ${prevLabel}`], this.panelX(entry.x + 65), this.panelY(entry.y - 50));
          });
          obj.on('pointerout', () => { node.setFillStyle(fillColor); this.tooltip.hide(); });
        });
        return;
      }

      // Разблокируется наградой квеста сбора предметов предыдущей зоны маршрута
      // (collect_<zone>_items → unlock_area), а не покупкой. Показываем его прогресс.
      const questId = AREA_UNLOCK_QUEST[entry.id];
      const def = questId ? QUEST_DEFS[questId] : undefined;
      const quests = MetaStore.get().quests;
      // Награда выдаётся только по клику «Забрать» у Скупщика (см. QuestSystem.claimQuestReward),
      // поэтому квест сбора может быть уже выполнен (в pending_reward, не в active) — тогда
      // прогресс = target, а не 0/target, и сообщение зовёт к Скупщику, а не «собери предметы».
      const isPendingClaim = questId ? quests.pending_reward.includes(questId) : false;
      const record = quests.active.find((q) => q.id === questId);
      const progress = isPendingClaim ? (def?.target ?? 0) : (record?.progress ?? 0);
      const target = def?.target ?? 0;
      const prevLabel = zoneLabel(ZONE_PREREQ[entry.id]);

      const lockLabel = isPendingClaim ? '🔒 забери награду у Скупщика' : `🔒 собери предметы ${progress}/${target}`;
      this.panelContainer.add(this.add.text(entry.x, entry.y + 20, lockLabel, {
        fontSize: '13px', fontFamily: FONT_FAMILY, color: '#886666', align: 'center', wordWrap: { width: 160 },
      }).setOrigin(0.5));

      node.setInteractive({ useHandCursor: true });
      nameText.setInteractive({ useHandCursor: true });
      [node, nameText].forEach(obj => {
        obj.on('pointerover', () => {
          node.setFillStyle(0x332233);
          this.tooltip.showText(isPendingClaim ? [
            'Заблокировано',
            'Награда уже готова — забери её у Скупщика',
          ] : [
            'Заблокировано',
            `Собери в «${prevLabel}» все предметы (${progress}/${target})`,
          ], this.panelX(entry.x + 65), this.panelY(entry.y - 50));
        });
        obj.on('pointerout', () => { node.setFillStyle(fillColor); this.tooltip.hide(); });
      });
      return;
    }

    node.setInteractive({ useHandCursor: true });
    nameText.setInteractive({ useHandCursor: true });
    const cfg = getZoneConfig(entry.id);
    [node, nameText].forEach(obj => {
      obj.on('pointerover', () => {
        node.setFillStyle(isFullyLooted ? 0x336633 : 0x336688);
        // Имя — в цвет эссенции награды зоны; ниже — краткий лор. Бои/фракцию не показываем.
        const lines: { text: string; color: string; iconRow?: { texture: string; discovered: boolean }[] }[] = [
          { text: cfg.name, color: zoneNameColor(cfg) },
        ];
        for (const l of wrapText(cfg.description ?? '')) lines.push({ text: l, color: '#bbbbbb' });
        // Endless-зона (docs/content.zones.format.md) — цель рекордная, не «прохождение»: показываем
        // лучший результат прямо в тултипе карты, не только на экране смерти.
        if (cfg.endless) {
          lines.push({ text: `Рекорд: ${MetaStore.get().battlefield_best_depth}`, color: '#cc88ff' });
        }
        // Ряд иконок предметов зоны: найден (вынесен в сундук) → обычная иконка, иначе — затемнённая + «?».
        const itemIds = getZoneLootItemIds(entry.id);
        if (itemIds.length > 0) {
          const carriedOut = MetaStore.get().stats.items_carried_out;
          lines.push({ text: '', color: '#bbbbbb' });
          lines.push({
            text: '', color: '#ffffff',
            iconRow: itemIds.map(id => ({ texture: itemIconKey(id), discovered: !!carriedOut[id] })),
          });
        }
        this.tooltip.showLines(lines, this.panelX(entry.x + 65), this.panelY(entry.y - 70));
      });
      obj.on('pointerout', () => { node.setFillStyle(fillColor); this.tooltip.hide(); });
      obj.on('pointerdown', () => {
        this.tooltip.hide();
        const standIndex = this.selectedStandIndex;
        this.closePanel();
        this.scene.start('ExpeditionScene', { zoneId: entry.id, standIndex });
      });
    });
  }

  private showMessage(msg: string) {
    const text = this.add.text(CX, 740, msg, {
      fontSize: '15px', fontFamily: FONT_FAMILY, color: '#ffaa44',
    }).setOrigin(0.5).setDepth(200);
    this.time.delayedCall(2500, () => text.destroy());
  }

  private onQuestCompleted(questId: string) {
    const def = QUEST_DEFS[questId];
    if (def) this.showMessage(`Задание выполнено: ${def.title}! Заберите награду у Скупщика`);
    this.questTracker.rebuild();
    this.refreshDealerAlert();
  }

  private onRewardClaimed(_questId: string) {
    this.questTracker.rebuild();
    this.refreshDealerAlert();
  }

  shutdown() {
    EventBus.off('quest_completed', this.onQuestCompleted, this);
    EventBus.off('quest_reward_claimed', this.onRewardClaimed, this);
    SoundManager.stopMusic();
  }
}
