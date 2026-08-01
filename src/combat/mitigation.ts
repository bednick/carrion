/**
 * Мультипликативное снижение урона на долю `pct` (0..1) — модель **брони героя** (`standardArmor` и
 * инлайн-хуки нагрудников). Несколько источников стакаются
 * последовательным умножением (каждый хук вызывает эту функцию над `amount`, уже уменьшенным
 * предыдущим источником) — см. `docs/combat-events.md` §5, `docs/mechanics.md` §«Броня vs щит».
 *
 * НЕ округляет: урон едет по цепочке хуков дробным, чтобы стак брони был точным
 * `(1-p₁)×(1-p₂)×…` без потерь на промежуточных округлениях. Единственное округление —
 * стохастическое, в `CombatEngine.applyDamage` (см. `stochasticRound`).
 */
export function mitigateDamage(before: number, pct: number): number {
  if (before <= 0) return before;
  return before * (1 - pct);
}

/**
 * Плоский вычет `flat` очков — модель **брони мобов** (`defense.armor`, `CombatEngine.enemyDefend`).
 * В отличие от процентной брони героя (`mitigateDamage`) зависит от размера удара: мелкий чип гасит
 * в ноль, тяжёлому пробою почти не мешает. Модели сознательно разные — см. `docs/mechanics.md`
 * §«Броня vs щит».
 *
 * Пола нет: удар, полностью съеденный бронёй, движок показывает как «Блок» (см. `applyDamage`).
 * Как и `mitigateDamage`, НЕ округляет — единственное округление ждёт в `applyDamage`.
 */
export function mitigateFlat(before: number, flat: number): number {
  if (before <= 0) return before;
  return Math.max(0, before - flat);
}

/**
 * Стохастическое округление: дробный остаток становится вероятностью округлить вверх.
 * `E[stochasticRound(x)] === x`, поэтому процент брони работает одинаково на ударе любого размера —
 * обычный `Math.round` терял бы всю нижнюю половину шкалы (броня 10% против удара в 2 давала
 * `round(1.8) = 2`, то есть не работала вовсе).
 *
 * Пола в 1 урон нет: броня 90% против удара в 1 даёт 0 в 90% случаев — полное гашение удара
 * (движок показывает его как «Блок»).
 */
export function stochasticRound(value: number, rng: () => number): number {
  const floor = Math.floor(value);
  const frac = value - floor;
  return frac > 0 && rng() < frac ? floor + 1 : floor;
}
