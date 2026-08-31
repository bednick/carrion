import type { QuestRecord } from '../quests/definitions';
import { getItemBehavior, hasItemBehavior } from '../items/registry';
import type { EssenceTier, EssencePool, Rarity } from '../items/types';
import { rarityIndex } from '../items/rarity';
import { EventBus } from './EventBus';

// Гейт центра: три конечные зоны фракций. Поле битвы открывается автоматически,
// когда все они в completed_areas. «Финальность» — топология карты, не поле зоны.
const CENTER_GATE_ZONES = ['crypt', 'predator-pasture', 'marauder-lair'];

// Версионирование схемы пока не поддерживается (проект играется только локально).
// Несовместимые изменения формата допустимы без бампа ключа — после них нужно явно
// сбросить прогресс (MetaStore.resetAll или очистка localStorage). См. docs/meta-progression.md.
const STORAGE_KEY = 'carrion.meta.v1';

export type SlotId = 'head' | 'body' | 'legs' | 'hand_left' | 'hand_right' | 'ring' | 'amulet';

export interface ItemInstance {
  item_id: string;
  rarity: Rarity;
}

export type ArmorStand = Record<SlotId, ItemInstance | null>;

/** Ровно столько стоек-пресетов держит игрок (см. docs/mechanics.md, 3 стойки). */
export const ARMOR_STAND_COUNT = 3;

/**
 * Глобальная накопительная статистика игрока (общая для всех персонажей).
 * Счётчики-словари ключуются по id (mob_id / item_id / zone_id); set-поля
 * (`*_encountered`, `*_discovered`) хранят только факт «видел/нашёл».
 * Часть квестов сверяется именно с этими полями — см. QuestDef.condition.
 */
export interface PlayerStats {
  mobs_encountered: string[];          // встречал в бою (вкл. боссов и саммонов)
  mobs_killed: Record<string, number>; // убил (боссы и саммоны — тут же)
  items_crafted: Record<string, number>;     // улучшил редкость предмета (крафт = только улучшение)
  items_carried_out: Record<string, number>; // вынес из похода в сундук
  items_discovered: string[];          // выпал хоть раз с любого врага
  zones_entered: Record<string, number>;  // заходов в зону (без учёта «продолжить поиски»)
  zones_returned: Record<string, number>; // выходов живым (возврат или удачный побег)
}

export interface MetaState {
  essence: EssencePool;
  completed_areas: string[];
  unlocked_areas: string[];
  chest: ItemInstance[];
  armor_stands: ArmorStand[]; // ровно ARMOR_STAND_COUNT стоек-пресетов
  active_stand: number;       // индекс последней выбранной стойки (0..ARMOR_STAND_COUNT-1)
  // Фиксация предмета между стойками: slotId -> индекс стойки-владельца зафиксированного
  // предмета. Один лок на slotId — ровно как один физический предмет занимает слот этого
  // типа только на одной стойке; на двух других слот в этом случае пуст (см. CampScene).
  armor_stand_locks: Partial<Record<SlotId, number>>;
  run_speed: number;          // ускорение последнего забега (1|2|4) — восстанавливается в новом
  // Рекорд endless-зоны (battlefield, docs/content.zones.format.md): сколько мобов подряд убито
  // за лучший забег. Цель игры в этой зоне — превзойти это число, не «пройти» зону.
  battlefield_best_depth: number;

  stats: PlayerStats;
  quests: {
    active: QuestRecord[];
    pending_reward: string[];
    completed: string[];
  };
  // Id разовых реплик НПС (см. src/core/DialogSystem.ts), уже показанных игроку — вставки
  // вроде «первая смерть на территории фракции» показываются ровно один раз за сейв.
  seen_npc_dialogs: string[];
  // Механики мобов (MechanicId, см. src/ui/mobMechanics/index.ts), пояснение к которым игрок уже
  // видел: при первой за сейв встрече бой встаёт на паузу и всплывает модалка (MobMechanicModal).
  // Тип string[], а не MechanicId[] — чтобы core не импортировал ui (та же причина, что у
  // seen_npc_dialogs выше).
  seen_mob_mechanics: string[];
  // Пройдена обучающая зона (training-camp, см. docs/zones/training-camp.md). Пока false — карта
  // лагеря показывает только её плитку (CampScene.buildMapContent), «Мёртвые поля» не открыты и
  // их квесты не посажены (см. QuestSystem.grantTutorialUnlock). У сейвов до этого поля (создан
  // раньше правки) при загрузке трактуется как true — см. MetaStore.init().
  tutorial_completed: boolean;
}

function emptyStand(): ArmorStand {
  return {
    head: null,
    body: null,
    legs: null,
    hand_left: null,
    hand_right: null,
    ring: null,
    amulet: null,
  };
}

/** Три пустые стойки; в первой — стартовое оружие (всегда `short_sword`) в правой руке. */
function defaultStands(): ArmorStand[] {
  const stands = Array.from({ length: ARMOR_STAND_COUNT }, () => emptyStand());
  stands[0].hand_right = { item_id: 'short_sword', rarity: 'common' };
  return stands;
}

/**
 * Приводит стойки из сейва к ровно ARMOR_STAND_COUNT: недостающие — пустые,
 * лишние — отбрасываются, отсутствующие слоты добираются из emptyStand().
 */
function normalizeStands(saved: ArmorStand[] | undefined): ArmorStand[] {
  if (!saved || saved.length === 0) return defaultStands();
  return Array.from({ length: ARMOR_STAND_COUNT }, (_, i) => ({
    ...emptyStand(),
    ...(saved[i] ?? {}),
  }));
}

/** Зажимает индекс стойки в допустимый диапазон (битый/старый сейв ⇒ первая стойка). */
function clampStand(i: number | undefined): number {
  if (typeof i !== 'number' || !Number.isFinite(i)) return 0;
  return Math.max(0, Math.min(ARMOR_STAND_COUNT - 1, Math.floor(i)));
}

// Допустимые ускорения забега — те же кнопки, что в ExpeditionScene (×1/×2/×4).
const RUN_SPEEDS = [1, 2, 4];
function clampRunSpeed(v: number | undefined): number {
  return RUN_SPEEDS.includes(v as number) ? (v as number) : 1;
}

function emptyEssence(): EssencePool {
  return { uncommon: 0, rare: 0, epic: 0 };
}

function emptyStats(): PlayerStats {
  return {
    mobs_encountered: [],
    mobs_killed: {},
    items_crafted: {},
    items_carried_out: {},
    items_discovered: [],
    zones_entered: {},
    zones_returned: {},
  };
}

function createDefault(): MetaState {
  return {
    essence: emptyEssence(),
    completed_areas: [],
    // «Мёртвые поля» больше не открыты с ходу — их открывает и сеет свои квесты
    // QuestSystem.grantTutorialUnlock() сразу после прохождения обучающей зоны
    // (training-camp, вне карты/маршрутов, см. docs/zones/training-camp.md).
    unlocked_areas: [],
    chest: [],
    armor_stands: defaultStands(),
    active_stand: 0,
    // Стартовый меч (defaultStands()) кладётся напрямую в массив стоек, минуя
    // setArmorStandSlot, поэтому авто-фиксацию (см. setArmorStandSlot) нужно проставить
    // здесь явно — иначе новый сейв стартовал бы с разлоченным дефолтом.
    armor_stand_locks: { hand_right: 0 },
    run_speed: 1,
    battlefield_best_depth: 0,
    stats: emptyStats(),
    seen_npc_dialogs: [],
    seen_mob_mechanics: [],
    quests: {
      active: [],
      pending_reward: [],
      completed: [],
    },
    tutorial_completed: false,
  };
}

let state: MetaState;

export const MetaStore = {
  init() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      state = createDefault();
      return;
    }
    const parsed = JSON.parse(raw) as Partial<MetaState>;
    const defaults = createDefault();
    state = {
      essence: { ...defaults.essence, ...(parsed.essence ?? {}) },
      completed_areas: parsed.completed_areas ?? defaults.completed_areas,
      unlocked_areas: parsed.unlocked_areas ?? defaults.unlocked_areas,
      chest: parsed.chest ?? defaults.chest,
      armor_stands: normalizeStands(parsed.armor_stands),
      active_stand: clampStand(parsed.active_stand),
      armor_stand_locks: parsed.armor_stand_locks ?? defaults.armor_stand_locks,
      run_speed: clampRunSpeed(parsed.run_speed),
      battlefield_best_depth: parsed.battlefield_best_depth ?? defaults.battlefield_best_depth,
      // Поверхностного merge достаточно: каждое поле stats независимо, а недостающие
      // (в старых сейвах) добираются из emptyStats(). Версионирование схемы не ведём.
      stats: { ...defaults.stats, ...(parsed.stats ?? {}) },
      seen_npc_dialogs: parsed.seen_npc_dialogs ?? defaults.seen_npc_dialogs,
      // Поля нет у сейвов, созданных до пояснительных модалок механик — трактуем как «ничего не
      // показывали»: игрок увидит пояснение при следующей встрече с каждой механикой. Это и есть
      // желаемое поведение (в отличие от tutorial_completed ниже, где пустое поле нужно читать как true).
      seen_mob_mechanics: parsed.seen_mob_mechanics ?? defaults.seen_mob_mechanics,
      quests: {
        active: parsed.quests?.active ?? defaults.quests.active,
        pending_reward: parsed.quests?.pending_reward ?? [],
        completed: parsed.quests?.completed ?? defaults.quests.completed,
      },
      // Поле добавлено вместе с обучающей зоной (training-camp) — у сейвов, созданных раньше,
      // его нет в JSON. Такой сейв по определению уже прошёл через старый прямой старт с
      // «Мёртвыми полями», поэтому отсутствие поля трактуется как «туториал пройден» (true), а не
      // false — иначе игрока с прогрессом откинуло бы обратно в обучение. Только у по-настоящему
      // новых сейвов (нет raw вовсе, см. ветку выше) поле явно false.
      tutorial_completed: parsed.tutorial_completed ?? true,
    };
    this.purgeUnknownItems();
  },

  // Удалённые/переименованные предметы (отсутствующие в реестре) выбрасываем из сейва,
  // иначе getItemBehavior(item_id) бросает и ломает UI (фильтры сундука, экипировку).
  purgeUnknownItems() {
    state.chest = state.chest.filter((it) => hasItemBehavior(it.item_id));
    for (const stand of state.armor_stands) {
      for (const slot of Object.keys(stand) as SlotId[]) {
        const it = stand[slot];
        if (it && !hasItemBehavior(it.item_id)) stand[slot] = null;
      }
    }
    for (const slot of Object.keys(state.armor_stand_locks) as SlotId[]) {
      const owner = state.armor_stand_locks[slot];
      if (owner === undefined || !state.armor_stands[owner]?.[slot]) {
        delete state.armor_stand_locks[slot];
      }
    }
  },

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },

  resetAll() {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  },

  get(): MetaState {
    return state;
  },

  addEssence(tier: EssenceTier, amount: number) {
    state.essence[tier] = Math.max(0, state.essence[tier] + amount);
    this.save();
  },

  /** Хватает ли эссенции на весь пул затрат (по каждому тиру). */
  canAffordEssence(cost: EssencePool): boolean {
    return (Object.keys(cost) as EssenceTier[]).every((t) => state.essence[t] >= cost[t]);
  },

  /** Списывает пул эссенции целиком; ничего не списывает, если не хватает. */
  spendEssence(cost: EssencePool): boolean {
    if (!this.canAffordEssence(cost)) return false;
    for (const t of Object.keys(cost) as EssenceTier[]) state.essence[t] -= cost[t];
    this.save();
    return true;
  },

  unlockArea(zoneId: string) {
    if (!state.unlocked_areas.includes(zoneId)) {
      state.unlocked_areas.push(zoneId);
      this.save();
    }
  },

  completeArea(zoneId: string) {
    if (!state.completed_areas.includes(zoneId)) {
      state.completed_areas.push(zoneId);
      this.save();
    }
  },

  /**
   * Обучающая зона (training-camp) пройдена — вызывается из ExpeditionScene вместо обычного
   * completeArea (зона вне completed_areas-семантики, не часть карты/маршрутов). Открытие
   * «Мёртвых полей» и посадка её квестов — отдельно, в QuestSystem.grantTutorialUnlock(),
   * читающей этот флаг при каждом evaluateQuests().
   */
  completeTutorial() {
    if (state.tutorial_completed) return;
    state.tutorial_completed = true;
    this.save();
  },

  /** true, если depth — новый рекорд endless-зоны (battlefield, см. ExpeditionScene). */
  recordBattlefieldDepth(depth: number): boolean {
    const isRecord = depth > state.battlefield_best_depth;
    if (isRecord) state.battlefield_best_depth = depth;
    this.save();
    return isRecord;
  },

  /** Центр (battlefield) открыт, когда все 9 обычных зон зачищены. */
  isCenterUnlocked(): boolean {
    return CENTER_GATE_ZONES.every((z) => state.completed_areas.includes(z));
  },

  addToChest(item: ItemInstance) {
    state.chest.push(item);
    this.save();
    EventBus.emit('item_stored');
  },

  /** Кладёт несколько предметов за один проход + один save() + одно событие. */
  addToChestBatch(items: ItemInstance[]) {
    if (!items.length) return;
    state.chest.push(...items);
    this.save();
    EventBus.emit('item_stored');
  },

  removeFromChest(index: number): ItemInstance | null {
    const item = state.chest[index] ?? null;
    if (item) {
      state.chest.splice(index, 1);
      this.save();
    }
    return item;
  },

  /** Удаляет предметы по набору индексов за один проход + один save(). */
  removeFromChestBatch(indices: number[]): ItemInstance[] {
    const drop = new Set(indices);
    const removed: ItemInstance[] = [];
    state.chest = state.chest.filter((item, i) => {
      if (!drop.has(i)) return true;
      removed.push(item);
      return false;
    });
    if (removed.length) this.save();
    return removed;
  },

  /**
   * Страховка от безоружного забега: если оружия (предмета, влезающего в правую руку) нет ни в одном
   * слоте любой стойки, ни в сундуке — кладём стартовый `short_sword` в правую руку первой стойки.
   * Та же гарантия, что даёт defaultStands() новому сейву, но восстановленная задним числом:
   * оружие можно потерять слиянием или разбором. Возвращает true, если меч был выдан.
   */
  ensureStarterWeapon(): boolean {
    const isWeapon = (it: ItemInstance) =>
      hasItemBehavior(it.item_id) && getItemBehavior(it.item_id).slots.includes('hand_right');
    const onStands = state.armor_stands.some(
      (stand) => Object.values(stand).some((it) => it && isWeapon(it)),
    );
    if (onStands || state.chest.some(isWeapon)) return false;
    // Слот правой руки первой стойки пуст по построению: будь там предмет, он был бы оружием.
    this.setArmorStandSlot(0, 'hand_right', { item_id: 'short_sword', rarity: 'common' });
    return true;
  },

  /** Всё надетое на всех стойках одним списком (пустые слоты отброшены). */
  getEquippedItems(): ItemInstance[] {
    return state.armor_stands.flatMap(
      (stand) => Object.values(stand).filter((it): it is ItemInstance => !!it),
    );
  },

  sortChest() {
    state.chest.sort((a, b) => {
      if (a.item_id !== b.item_id) return a.item_id.localeCompare(b.item_id);
      return rarityIndex(b.rarity) - rarityIndex(a.rarity);
    });
    this.save();
  },

  setArmorStandSlot(standIndex: number, slot: SlotId, item: ItemInstance | null) {
    // Любое изменение слота этого типа — на стойке-владельце или на «призрачной» — рвёт
    // фиксацию: реального предмета для показа на других стойках больше нет.
    if (state.armor_stand_locks[slot] !== undefined) {
      delete state.armor_stand_locks[slot];
    }
    state.armor_stands[standIndex][slot] = item;
    // Новый предмет по умолчанию фиксируется между стойками, если это возможно (см.
    // docs/ui.md «Фиксация предмета между стойками») — раньше фиксацию нужно было
    // включать вручную кликом по замочку.
    if (item && this.canLockStandSlot(standIndex, slot)) {
      state.armor_stand_locks[slot] = standIndex;
    }
    this.save();
  },

  getArmorStand(standIndex: number): ArmorStand {
    return state.armor_stands[standIndex];
  },

  getArmorStands(): ArmorStand[] {
    return state.armor_stands;
  },

  /** Стойка для боя: пустые слоты, зафиксированные за другой стойкой, подменяются реальным
   *  предметом владельца. Не использовать в UI стоек — там нужны «сырые» null для drag&drop. */
  getResolvedArmorStand(standIndex: number): ArmorStand {
    const stand = state.armor_stands[standIndex];
    const resolved = { ...stand };
    for (const [slot, owner] of Object.entries(state.armor_stand_locks) as [SlotId, number][]) {
      if (resolved[slot] == null && owner !== standIndex) {
        resolved[slot] = state.armor_stands[owner][slot];
      }
    }
    return resolved;
  },

  getStandLockOwner(slot: SlotId): number | undefined {
    return state.armor_stand_locks[slot];
  },

  canLockStandSlot(standIndex: number, slot: SlotId): boolean {
    if (state.armor_stand_locks[slot] !== undefined) return false;
    if (!state.armor_stands[standIndex][slot]) return false;
    return state.armor_stands.every((stand, i) => i === standIndex || !stand[slot]);
  },

  lockStandSlot(standIndex: number, slot: SlotId): boolean {
    if (!this.canLockStandSlot(standIndex, slot)) return false;
    state.armor_stand_locks[slot] = standIndex;
    this.save();
    return true;
  },

  unlockStandSlot(slot: SlotId) {
    if (state.armor_stand_locks[slot] === undefined) return;
    delete state.armor_stand_locks[slot];
    this.save();
  },

  /** Последняя выбранная стойка — с ней герой уходит на локацию (можно сменить в бою). */
  getActiveStand(): number {
    return clampStand(state.active_stand);
  },

  setActiveStand(index: number) {
    const i = clampStand(index);
    if (state.active_stand === i) return;
    state.active_stand = i;
    this.save();
  },

  /** Ускорение последнего забега — им же стартует следующий поход. */
  getRunSpeed(): number {
    return clampRunSpeed(state.run_speed);
  },

  setRunSpeed(speed: number) {
    const s = clampRunSpeed(speed);
    if (state.run_speed === s) return;
    state.run_speed = s;
    this.save();
  },

  addActiveQuest(id: string, target = 1) {
    if (state.quests.active.some(q => q.id === id)) return;
    if (state.quests.pending_reward.includes(id)) return;
    if (state.quests.completed.includes(id)) return;
    state.quests.active.push({ id, progress: 0, target });
    this.save();
    // Сигнал для QuestSystem: проверить, не выполнено ли stat-условие квеста заранее.
    EventBus.emit('quest_granted', id);
  },

  /**
   * Записывает прогресс квеста абсолютным значением — для условий, которые всегда можно
   * пересчитать по стате (zone_items, battlefield_depth), а не копить дельтой.
   * Заодно чинит `target`: в сейве он заморожен на момент выдачи квеста, а определение
   * с тех пор могло измениться (в зону добавили предмет — цель сбора выросла).
   * Возвращает true, когда квест выполнен.
   */
  setQuestProgress(id: string, progress: number, target: number): boolean {
    const q = state.quests.active.find(q => q.id === id);
    if (!q) return false;
    q.target = Math.max(1, target);
    q.progress = Math.min(q.target, Math.max(0, progress));
    this.save();
    return q.progress >= q.target;
  },

  progressQuest(id: string, amount = 1): boolean {
    const q = state.quests.active.find(q => q.id === id);
    if (!q) return false;
    q.progress = Math.min(q.target, q.progress + amount);
    this.save();
    return q.progress >= q.target;
  },

  moveToPendingReward(id: string) {
    state.quests.active = state.quests.active.filter(q => q.id !== id);
    if (!state.quests.pending_reward.includes(id)) {
      state.quests.pending_reward.push(id);
    }
    this.save();
  },

  claimQuestReward(id: string) {
    state.quests.pending_reward = state.quests.pending_reward.filter(q => q !== id);
    if (!state.quests.completed.includes(id)) {
      state.quests.completed.push(id);
    }
    this.save();
  },

  isQuestActive(id: string): boolean {
    return state.quests.active.some(q => q.id === id);
  },

  isQuestCompleted(id: string): boolean {
    return state.quests.completed.includes(id) || state.quests.pending_reward.includes(id);
  },

  hasPendingRewards(): boolean {
    return state.quests.pending_reward.length > 0;
  },

  // --- Статистика ---------------------------------------------------------
  // Все мутации статов шлют 'stats_changed', чтобы QuestSystem пересверил
  // активные квесты со stat-условиями (см. docs/meta-progression.md).

  recordMobEncountered(mobId: string) {
    if (state.stats.mobs_encountered.includes(mobId)) return;
    state.stats.mobs_encountered.push(mobId);
    this.save();
    EventBus.emit('stats_changed');
  },

  recordMobKilled(mobId: string) {
    state.stats.mobs_killed[mobId] = (state.stats.mobs_killed[mobId] ?? 0) + 1;
    this.save();
    EventBus.emit('stats_changed');
  },

  recordItemCrafted(itemId: string) {
    state.stats.items_crafted[itemId] = (state.stats.items_crafted[itemId] ?? 0) + 1;
    this.save();
    EventBus.emit('stats_changed');
  },

  recordItemCarriedOut(itemId: string) {
    state.stats.items_carried_out[itemId] = (state.stats.items_carried_out[itemId] ?? 0) + 1;
    this.save();
    EventBus.emit('stats_changed');
  },

  recordItemDiscovered(itemId: string) {
    if (state.stats.items_discovered.includes(itemId)) return;
    state.stats.items_discovered.push(itemId);
    this.save();
    EventBus.emit('stats_changed');
  },

  recordZoneEntered(zoneId: string) {
    state.stats.zones_entered[zoneId] = (state.stats.zones_entered[zoneId] ?? 0) + 1;
    this.save();
    EventBus.emit('stats_changed');
  },

  recordZoneReturned(zoneId: string) {
    state.stats.zones_returned[zoneId] = (state.stats.zones_returned[zoneId] ?? 0) + 1;
    this.save();
    EventBus.emit('stats_changed');
  },

  // --- Реплики НПС (src/core/DialogSystem.ts) -----------------------------

  hasSeenDialog(id: string): boolean {
    return state.seen_npc_dialogs.includes(id);
  },

  markDialogSeen(id: string) {
    if (state.seen_npc_dialogs.includes(id)) return;
    state.seen_npc_dialogs.push(id);
    this.save();
  },

  // --- Пояснения механик мобов (src/ui/MobMechanicModal.ts) ---------------

  hasSeenMechanic(id: string): boolean {
    return state.seen_mob_mechanics.includes(id);
  },

  markMechanicSeen(id: string) {
    if (state.seen_mob_mechanics.includes(id)) return;
    state.seen_mob_mechanics.push(id);
    this.save();
  },

  /** Есть ли хотя бы один экземпляр предмета в сундуке или на любой из стоек. */
  hasItemAnywhere(itemId: string): boolean {
    if (state.chest.some((it) => it.item_id === itemId)) return true;
    return state.armor_stands.some((stand) =>
      Object.values(stand).some((it) => it?.item_id === itemId),
    );
  },
};
