// Детерминированный рандом похода.
//
// Сцена экспедиции перезапускается на лету (перекладка под новый размер окна, src/ui/resize.ts), и без
// сида каждый такой рестарт заново бросал бы кубики: F11 посреди боя менял бы противника, лут и редкость.
// Поэтому у похода есть seed, а каждое решение берёт СВОЙ независимый поток с ключом
// `seed + назначение + номер боя` — см. rngFor.
//
// Ключи вместо одного последовательного потока: последовательный ломается от любого изменения числа
// бросков и требует восстанавливать позицию после рестарта, а ключевой воспроизводим по построению.
//
// Без Phaser: модуль тянут боевой движок и headless-симулятор баланса (src/balance/simulate.ts грузится
// в том числе из Node, `npm run balance`).

export interface Rng {
  /** Дробное в [0, 1). */
  frac(): number;
  /** Целое в [min, max], границы включительно. */
  int(min: number, max: number): number;
  /** Дробное в [min, max). */
  float(min: number, max: number): number;
  /** Перемешанная КОПИЯ массива (вход не мутируется). */
  shuffle<T>(items: T[]): T[];
}

/** Строку любой длины — в 32-битное зерно (xmur3). */
function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/** mulberry32 — компактный PRNG с периодом 2^32, качества хватает на выбор мобов и лут. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fromFrac(frac: () => number): Rng {
  return {
    frac,
    int: (min, max) => min + Math.floor(frac() * (max - min + 1)),
    float: (min, max) => min + frac() * (max - min),
    shuffle: <T>(items: T[]): T[] => {
      const out = [...items];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(frac() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
  };
}

/** Сид на один поход. Генерится при входе в зону и переживает рестарты сцены. */
export function makeRunSeed(): string {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 0xffffffff).toString(36)}`;
}

/**
 * Поток для конкретного решения. Одинаковые (seed, key) всегда дают одну и ту же последовательность,
 * сколько бы раз сцену ни перезапустили: `rngFor(seed, 'mob', 3)` — моб третьего боя, `rngFor(seed,
 * 'loot', 3)` — его лут.
 */
export function rngFor(seed: string, ...key: (string | number)[]): Rng {
  return fromFrac(mulberry32(hashSeed([seed, ...key].join('|'))));
}

/** Math.random — для мест, где детерминизм не нужен, и как дефолт необязательных параметров. */
export const unseededRng: Rng = fromFrac(Math.random);
