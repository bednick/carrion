// CLI-обёртка над src/balance/simulate.ts (Node-специфика: argv, чтение build-файла, печать).
// Та же логика доступна в браузере — balance.html / src/balance/main.ts — числа совпадают,
// потому что обе точки входа зовут один и тот же runMonteCarlo/runExpedition.
//
// Запуск: npm run balance -- <zoneId> [--trials=5000] [--build=path/to/build.json]
// Без --build — безоружный герой (базовый урон 1/3.0s, без брони).

import { readFileSync } from 'node:fs';
import { getZoneConfig } from '../src/zones/registry.ts';
import { runMonteCarlo } from '../src/balance/simulate.ts';
import type { ItemInstance, SlotType, Rarity } from '../src/items/types';
import type { ZoneConfig } from '../src/zones/types';

function parseArgs(argv: string[]) {
  const zoneId = argv[0];
  if (!zoneId) {
    console.error('Использование: npm run balance -- <zoneId> [--trials=5000] [--build=path.json]');
    process.exit(1);
  }
  let trials = 5000;
  let buildPath: string | null = null;
  for (const a of argv.slice(1)) {
    if (a.startsWith('--trials=')) trials = Number(a.slice('--trials='.length));
    else if (a.startsWith('--build=')) buildPath = a.slice('--build='.length);
  }
  return { zoneId, trials, buildPath };
}

function loadBuild(path: string | null): Partial<Record<SlotType, ItemInstance>> {
  if (!path) return {};
  const raw = JSON.parse(readFileSync(path, 'utf-8')) as Record<string, { item_id: string; rarity: Rarity }>;
  const equipment: Partial<Record<SlotType, ItemInstance>> = {};
  for (const [slot, inst] of Object.entries(raw)) {
    equipment[slot as SlotType] = { item_id: inst.item_id, rarity: inst.rarity };
  }
  return equipment;
}

function main() {
  const { zoneId, trials, buildPath } = parseArgs(process.argv.slice(2));
  const zoneCfg: ZoneConfig = getZoneConfig(zoneId);
  const equipment = loadBuild(buildPath);

  const s = runMonteCarlo(equipment, zoneCfg, trials);

  console.log(`Зона: ${zoneCfg.name} (${zoneId}), звёзд: ${zoneCfg.star}, боёв: ${zoneCfg.fights?.min ?? 0}-${zoneCfg.fights?.max ?? 0} + босс`);
  console.log(`Сборка: ${buildPath ?? '(безоружный, без брони)'}`);
  console.log(`Прогонов: ${trials}`);
  console.log('---');
  console.log(`Winrate: ${(s.wins / s.trials * 100).toFixed(1)}%`);
  console.log(`Смерть до босса: ${(s.deaths / s.trials * 100).toFixed(1)}%`);
  if (s.stalemates > 0) console.log(`⚠ Патовых ситуаций (>10 мин виртуального времени): ${(s.stalemates / s.trials * 100).toFixed(1)}%`);
  console.log(`Средний остаток HP перед боссом: ${s.bossStartHpCount > 0 ? (s.bossStartHpSum / s.bossStartHpCount).toFixed(1) : '—'} / 100`);
  console.log(`Средний остаток HP после победы над боссом: ${s.bossEndHpCount > 0 ? (s.bossEndHpSum / s.bossEndHpCount).toFixed(1) : '—'} / 100`);
  console.log(`Среднее число пройденных рядовых боёв: ${(s.fightsSum / s.trials).toFixed(1)}`);
  if (s.deaths > 0) {
    console.log('Распределение смертей по номеру рядового боя:');
    for (const [fight, count] of Object.entries(s.deathAtFight).sort((a, b) => Number(a[0]) - Number(b[0]))) {
      console.log(`  после боя ${fight}: ${count} (${(count / s.trials * 100).toFixed(1)}%)`);
    }
  }
}

main();
