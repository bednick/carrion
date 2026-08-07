import type { SlotType } from '../items/types';
import type { EnemySpec } from '../zones/types';

// Урон безоружного героя — фолбэк и для дефолт-автора движка (CombatEngine.apply), и для
// кросс-slot эффектов, читающих «базовый урон hand_right» (CombatView.mainWeaponBaseDamage),
// когда рука пуста. Живёт в events.ts (не в CombatEngine.ts), чтобы предметы могли импортировать
// его без обратной зависимости items → combat/CombatEngine.
export const UNARMED_DAMAGE = 1;

// Боевой источник/цель события: герой (+ каким слотом бьёт) или конкретный враг.
// idx — индекс врага в state.enemies (для применения движком); id — для отрисовки/атрибуции.
export type Side =
  | { side: 'hero'; slot?: SlotType }
  | { side: 'enemy'; id: string; idx: number };

// Технический источник: ЧТО породило событие в пайплайне (атрибуция, защита от петель, отладка).
export type Origin =
  | { from: 'engine' }
  | { from: 'character' }
  | { from: 'item'; slot: SlotType }
  | { from: 'enemy'; id: string }; // защита моба (броня/шипы/уклонение) породила событие

export interface EventMeta {
  origin: Origin;
  cause?: GameEvent; // событие-родитель в каскаде (для цепочки/отладки)
}

export type EventType =
  | 'fight_start'
  | 'fight_end'
  | 'attack_ready'
  | 'attack'
  | 'damage'
  | 'block'
  | 'dodge'
  | 'counter'
  | 'heal'
  | 'kill'
  | 'summon';

export type GameEvent = EventMeta &
  (
    | { type: 'fight_start'; enemies: string[] }
    | { type: 'fight_end'; outcome: 'win' }
    | { type: 'attack_ready'; source: Side; target: Side } // часы: поток стамины заполнен
    // armorPierce — сколько ОЧКОВ брони цели снимает этот удар (напр. крит `war_pick`); движок
    // переносит поле с `attack` на выведенный `damage` (см. `CombatEngine.apply`), `enemyDefend` его читает.
    // splash — true у побочных (не основной цели) тиков урона (напр. cleave `broadaxe`); движок переносит поле
    // так же, как armorPierce. Он-хит эффекты героя (лайфстил и т.п.) должны игнорировать splash: true.
    // thorns — true у урона, порождённого самими шипами (моба или предмета героя). Шипы обеих сторон
    // обязаны игнорировать входящий урон с этой меткой — иначе шипы моба и шипы героя отражают друг
    // друга по кругу (гасится только предохранителем MAX_CASCADE, давая длинную серию урона по 1).
    // crit — презентационная метка крит-удара (war_pick/heavy_gloves). HP-математику не меняет (урон уже
    // домножен автором), нужна только для отрисовки: движок переносит поле с `attack` на выведенный `damage`
    // так же, как armorPierce/splash, и отдаёт его в onDamageDealt для крит-флоатера.
    | { type: 'attack'; source: Side; target: Side; amount: number; armorPierce?: number; splash?: boolean; crit?: boolean } // взмах, авторённый предметом
    // raw — урон удара ДО любых снижений (брони/блока), проставляется один раз при рождении из `attack`
    // (CombatEngine.apply) и едет по цепочке хуков нетронутым. Нужен процентным шипам героя
    // (spiked_cuirass/spiked_shield), чтобы доля считалась от исходного удара, а не от того, что от
    // него осталось после чужой брони/блока.
    | { type: 'damage'; source: Side; target: Side; amount: number; raw?: number; armorPierce?: number; splash?: boolean; thorns?: boolean; crit?: boolean } // экземпляр урона «в полёте»
    // thorns — унаследована с погашенного шипами-флагом damage (см. ниже): нужна даунстрим on.block
    // хукам (spiked_cuirass), чтобы не отражать заблокированный урон от ЧУЖИХ шипов (тот же
    // антициклический гард, что и на `damage`).
    | { type: 'block'; source: Side; target: Side; prevented: number; thorns?: boolean } // урон полностью отклонён (щит либо броня, срезавшая удар в 0)
    | { type: 'dodge'; source: Side; target: Side } // враг уклонился — входящий урон погашен
    | { type: 'counter'; source: Side; target: Side } // чисто презентационное: «это был контрудар», HP не трогает
    | { type: 'heal'; source: Side; target: Side; amount: number }
    | { type: 'kill'; source: Side; target: Side }
    | { type: 'summon'; source: Side; spec: EnemySpec; position?: number } // призыв врага в свободную ячейку доски
  );

/** Событие конкретного типа (для точной типизации триггеров). */
export type EventOf<T extends EventType> = Extract<GameEvent, { type: T }>;
