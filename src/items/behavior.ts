import type { Rarity, SlotType, ItemType, ItemInstance } from './types';
import type { EmergencyHealConfig } from '../combat/types';
import type { ChannelContribution } from '../combat/channels';
import type { TriggerDef } from '../combat/triggers';
import type { RunItemState } from '../combat/runState';

/** Снимок боя «только для чтения», доступный каналам/триггерам для условных синергий. */
export interface CombatView {
  heroHp: number;
  heroMaxHp: number;
  enemies: { id: string; hp: number; maxHp: number; slot: number; isBoss?: boolean }[];
  equipment: Partial<Record<SlotType, ItemInstance>>;
  // Базовый урон надетого hand_right (см. ItemBehavior.weapon), посчитан один раз за dispatch —
  // чтобы кросс-slot эффекты (напр. контрудар buckler) не лезли в registry сами (циклический импорт).
  mainWeaponBaseDamage?: number;
}

export interface StatLine {
  text: string;
  color: string;
}

/**
 * Вклад предмета в мета-петлю (вне боя). Суммируется по всей экипировке и читается в нужных точках
 * (лут-ролл, длина забега…). Пока реализован `magicFind`. Независим от боевой channel/trigger-модели.
 */
export interface MetaModifiers {
  magicFind?: number;   // шанс улучшить редкость каждого выпавшего предмета на тир (геометрически, до кап предмета)
  fightDelta?: number;  // ± число рядовых боёв в забеге; фиксируется при старте экспедиции
}

/** Форма атаки оружия — авторится общей стадией движка (`resolution.ts`), не хуком предмета. */
export interface WeaponAuthoring {
  interval: number; // секунды
  baseDamage: number;
  shape: 'single' | 'multihit' | 'cleave' | 'pierce';
  shapeParams?: {
    hits?: number;          // multihit: число ударов по той же цели
    splashRatios?: number[]; // cleave: доля урона по дальности от основной цели
  };
}

/** Идентичность предмета (бывший config.json) — обязательны для любого предмета. Цена продажи
 *  считается от редкости (`itemSellPrice` в craft.ts), не хранится на предмете. Имя — не тут,
 *  см. `src/i18n/content/items.ts` (`itemDisplayName`, ключ — item_id, он же ключ реестра
 *  `ITEM_BEHAVIORS`). */
export interface ItemIdentity {
  slots: SlotType[];
  type: ItemType;
  tags?: string[];
}

/**
 * Поведение предмета. Всё, кроме identity-полей, опционально — отсутствие поля = «ничего не делает».
 * - `weapon` — делает предмет оружием: форма атаки + база урона/интервала, автор — общая стадия
 *   движка (крит и таргетинг multihit/cleave/pierce живут в `resolution.ts`, не в предмете).
 * - `channels` — статические числовые вклады («сколько») — броня, крит, блок, шипы, лайфстил,
 *   cross-slot модификаторы таймера оружия. Агрегируются один раз при сборке героя/моба. Получает
 *   `slot`, в котором СЕЙЧАС лежит этот конкретный экземпляр — нужно предметам, чей вклад зависит
 *   от собственного слота (напр. `dagger`, который штрафует себя же только будучи в hand_left, а
 *   не любое оружие в hand_left вообще — см. `weapon_interval_mult` в `channels.ts`).
 * - `triggers` — декларативные правила «на событие → действие» («когда») для того, что не сводится
 *   к числовому каналу (напр. контрудар `buckler`, читающий чужой базовый урон).
 * - `invuln`/`emergencyHeal`/`killHeal`/`hitLeech` — не хуки, а декларативные значения, читаемые
 *   ДВИЖКОМ один раз при входе в забег в per-run стейт-бэг (`syncRunState`) — сама механика
 *   (гашение урона, разовый порог, трата заряда, затухание шанса) живёт стадиями в `CombatEngine`,
 *   не здесь: ей нужно мутируемое состояние, которого у стейтлес channels/triggers нет. Все
 *   четыре лимита живут ЗАБЕГ, а не бой (docs/content.items.amulet.md).
 * - `stats` — строки для тултипа (единый источник правды по статам, пишется вручную и должен
 *   брать числа из тех же констант, что `channels`/`weapon`/`triggers`).
 */
export interface ItemBehavior extends ItemIdentity {
  weapon?: (rarity: Rarity) => WeaponAuthoring;
  channels?: (rarity: Rarity, slot: SlotType) => ChannelContribution[];
  // TriggerDef<any>: каждый предмет декларирует триггеры на разные типы событий (`event: 'damage'`
  // и т.п.), список неизбежно разнороден по T — рантайм-диспетчер (`runTriggers`) сам фильтрует по
  // `t.event === e.type` перед вызовом, так что сужение типа тут не нужно и мешало бы литералам.
  triggers?: (rarity: Rarity) => TriggerDef<any>[];
  invuln?: (rarity: Rarity) => { charges: number };
  emergencyHeal?: (rarity: Rarity) => EmergencyHealConfig;
  // Лечение за убийство: `amount` HP за каждого убитого врага, но не больше `charges` раз за забег.
  killHeal?: (rarity: Rarity) => { amount: number; charges: number };
  // Лайфстил за удар: `chance` на прок, каждый прок множит шанс на `decay` до конца забега.
  hitLeech?: (rarity: Rarity) => { chance: number; decay: number; amount: number };
  // `slot` — куда сейчас надет предмет (undefined для рюкзака/сундука — там показываем базовые
  // статы «как в hand_right»). Нужен предметам вроде `dagger`, чей эффективный DPS зависит от
  // слота (см. cross-slot `weapon_interval_mult` в src/combat/channels.ts).
  // `run` — состояние ЭТОГО предмета в текущем забеге (`RunStateBag[item_id]`, приезжает из
  // Tooltip): позволяет показать не стартовое, а фактическое число — остаток зарядов, затухший
  // шанс (`leech_bead`). Вне забега (лагерь, сундук, витрина крафта) — undefined, показываем базу.
  stats?: (rarity: Rarity, slot?: SlotType, run?: RunItemState) => StatLine[];
  meta?: (rarity: Rarity) => MetaModifiers;
}

/** Часть `ItemBehavior` без identity-полей — то, что возвращают фабрики (`standardWeapon` и т.п.). */
export type ItemCombatBehavior = Omit<ItemBehavior, keyof ItemIdentity>;
