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
    | { type: 'attack'; source: Side; target: Side; amount: number } // взмах, авторённый предметом
    | { type: 'damage'; source: Side; target: Side; amount: number } // экземпляр урона «в полёте»
    | { type: 'block'; source: Side; target: Side; prevented: number } // урон полностью отклонён (щит)
    | { type: 'dodge'; source: Side; target: Side } // враг уклонился — входящий урон погашен
    | { type: 'counter'; source: Side; target: Side } // чисто презентационное: «это был контрудар», HP не трогает
    | { type: 'heal'; source: Side; target: Side; amount: number }
    | { type: 'kill'; source: Side; target: Side }
    | { type: 'summon'; source: Side; spec: EnemySpec; position?: number } // призыв врага в свободную ячейку доски
  );

/** Событие конкретного типа (для точной типизации хуков). */
export type EventOf<T extends EventType> = Extract<GameEvent, { type: T }>;

/**
 * Результат хука-трансформера.
 * - `replace` — чем стало ТЕКУЩЕЕ событие; продолжает путь со СЛЕДУЮЩЕГО обработчика.
 *   Отсутствие `replace` ≡ событие проходит без изменений; `replace: []` — событие заглушено.
 * - `spawn` — НОВЫЕ события; уходят на свежий полный проход с начала.
 */
export interface EventResult {
  replace?: GameEvent[];
  spawn?: GameEvent[];
}
