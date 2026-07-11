import type { QuestRecord } from '../quests/definitions';
import { getItemConfig, hasItemConfig, ITEM_CONFIGS } from '../items/registry';
import type { EssenceTier, EssencePool } from '../items/types';
import { EventBus } from './EventBus';

// Гейт центра: три конечные зоны фракций. Поле битвы открывается автоматически,
// когда все они в completed_areas. «Финальность» — топология карты, не поле зоны.
const CENTER_GATE_ZONES = ['crypt', 'predator-pasture', 'marauder-lair'];

// Версионирование схемы пока не поддерживается (проект играется только локально).
// Несовместимые изменения формата допустимы без бампа ключа — после них нужно явно
// сбросить прогресс (MetaStore.resetAll или очистка localStorage). См. docs/meta-progression.md.
const STORAGE_KEY = 'carrion.meta.v1';

// Переживает location.reload() между «Сбросить» и следующей инициализацией: выбор игрока на
// экране стартового оружия. Читается один раз в createDefault() и тут же стирается.
const PENDING_START_WEAPON_KEY = 'carrion.meta.pending_start_weapon';

export type SlotId = 'head' | 'body_upper' | 'body_lower' | 'legs' | 'hand_left' | 'hand_right';

export interface ItemInstance {
  item_id: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
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
  gold: number;
  essence: EssencePool;
  completed_areas: string[];
  unlocked_areas: string[];
  chest: ItemInstance[];
  armor_stands: ArmorStand[]; // ровно ARMOR_STAND_COUNT стоек-пресетов
  active_stand: number;       // индекс последней выбранной стойки (0..ARMOR_STAND_COUNT-1)
  run_speed: number;          // ускорение последнего забега (1|2|4) — восстанавливается в новом

  stats: PlayerStats;
  quests: {
    active: QuestRecord[];
    pending_reward: string[];
    completed: string[];
  };
}

function emptyStand(): ArmorStand {
  return {
    head: null,
    body_upper: null,
    body_lower: null,
    legs: null,
    hand_left: null,
    hand_right: null,
  };
}

/** Предмет валиден как стартовое оружие: существует, оружие, носится в правой руке. */
function isValidStartWeapon(itemId: string): boolean {
  if (!hasItemConfig(itemId)) return false;
  const cfg = getItemConfig(itemId);
  return cfg.type === 'weapon' && cfg.slots.includes('hand_right');
}

/** Три пустые стойки; в первой — стартовое оружие (по умолчанию `battle_staff`) в правой руке. */
function defaultStands(startWeaponId?: string): ArmorStand[] {
  const stands = Array.from({ length: ARMOR_STAND_COUNT }, () => emptyStand());
  const weaponId = startWeaponId && isValidStartWeapon(startWeaponId) ? startWeaponId : 'battle_staff';
  stands[0].hand_right = { item_id: weaponId, rarity: 'common' };
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
  const pendingStartWeapon = localStorage.getItem(PENDING_START_WEAPON_KEY) ?? undefined;
  if (pendingStartWeapon) localStorage.removeItem(PENDING_START_WEAPON_KEY);
  return {
    gold: 0,
    essence: emptyEssence(),
    completed_areas: [],
    unlocked_areas: ['dead-fields'],
    chest: [],
    armor_stands: defaultStands(pendingStartWeapon),
    active_stand: 0,
    run_speed: 1,
    stats: emptyStats(),
    quests: {
      active: [{ id: 'dead_fields_clear', progress: 0, target: 1 }],
      pending_reward: [],
      completed: [],
    },
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
      gold: parsed.gold ?? defaults.gold,
      essence: { ...defaults.essence, ...(parsed.essence ?? {}) },
      completed_areas: parsed.completed_areas ?? defaults.completed_areas,
      unlocked_areas: parsed.unlocked_areas ?? defaults.unlocked_areas,
      chest: parsed.chest ?? defaults.chest,
      armor_stands: normalizeStands(parsed.armor_stands),
      active_stand: clampStand(parsed.active_stand),
      run_speed: clampRunSpeed(parsed.run_speed),
      // Поверхностного merge достаточно: каждое поле stats независимо, а недостающие
      // (в старых сейвах) добираются из emptyStats(). Версионирование схемы не ведём.
      stats: { ...defaults.stats, ...(parsed.stats ?? {}) },
      quests: {
        active: parsed.quests?.active ?? defaults.quests.active,
        pending_reward: parsed.quests?.pending_reward ?? [],
        completed: parsed.quests?.completed ?? defaults.quests.completed,
      },
    };
    this.purgeUnknownItems();
  },

  // Удалённые/переименованные предметы (отсутствующие в реестре) выбрасываем из сейва,
  // иначе getItemConfig(item_id) бросает и ломает UI (фильтры сундука, экипировку).
  purgeUnknownItems() {
    state.chest = state.chest.filter((it) => hasItemConfig(it.item_id));
    for (const stand of state.armor_stands) {
      for (const slot of Object.keys(stand) as SlotId[]) {
        const it = stand[slot];
        if (it && !hasItemConfig(it.item_id)) stand[slot] = null;
      }
    }
  },

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },

  /** startWeaponId — выбор игрока на экране стартового оружия (см. CampScene); без него — battle_staff. */
  resetAll(startWeaponId?: string) {
    if (startWeaponId) localStorage.setItem(PENDING_START_WEAPON_KEY, startWeaponId);
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  },

  /** Список id предметов, годных как стартовое оружие (weapon, слот hand_right). */
  listStartWeapons(): string[] {
    return Object.keys(ITEM_CONFIGS).filter(isValidStartWeapon);
  },

  get(): MetaState {
    return state;
  },

  addGold(amount: number) {
    state.gold = Math.max(0, state.gold + amount);
    this.save();
  },

  addEssence(tier: EssenceTier, amount: number) {
    state.essence[tier] = Math.max(0, state.essence[tier] + amount);
    this.save();
  },

  spendGold(amount: number): boolean {
    if (state.gold < amount) return false;
    state.gold -= amount;
    this.save();
    return true;
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

  /** Центр (battlefield) открыт, когда все 9 обычных зон зачищены. */
  isCenterUnlocked(): boolean {
    return CENTER_GATE_ZONES.every((z) => state.completed_areas.includes(z));
  },

  addToChest(item: ItemInstance) {
    state.chest.push(item);
    this.save();
  },

  removeFromChest(index: number): ItemInstance | null {
    const item = state.chest[index] ?? null;
    if (item) {
      state.chest.splice(index, 1);
      this.save();
    }
    return item;
  },

  sortChest() {
    const order = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    state.chest.sort((a, b) => {
      if (a.item_id !== b.item_id) return a.item_id.localeCompare(b.item_id);
      return order.indexOf(b.rarity) - order.indexOf(a.rarity);
    });
    this.save();
  },

  setArmorStandSlot(standIndex: number, slot: SlotId, item: ItemInstance | null) {
    state.armor_stands[standIndex][slot] = item;
    this.save();
  },

  getArmorStand(standIndex: number): ArmorStand {
    return state.armor_stands[standIndex];
  },

  getArmorStands(): ArmorStand[] {
    return state.armor_stands;
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
};
