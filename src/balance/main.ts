// Браузерный UI балансировочного симулятора (balance.html). Никакого Phaser — просто DOM.
// Вся боевая логика — в src/balance/simulate.ts, общей с CLI (tools/balance-sim.mts):
// числа тут и в консоли гарантированно совпадают, потому что это один и тот же код.

import { ALL_ZONE_IDS, getZoneConfig } from '../zones/registry';
import { ITEM_CONFIGS } from '../items/registry';
import { emptySummary, mergeResult, runExpedition, HIST_BUCKETS, HIST_BUCKET_SIZE, type SimSummary } from './simulate';
import type { ItemInstance, SlotType, Rarity } from '../items/types';
import type { ZoneConfig } from '../zones/types';

const SLOTS: { id: SlotType; label: string }[] = [
  { id: 'hand_right', label: 'Правая рука' },
  { id: 'hand_left', label: 'Левая рука' },
  { id: 'head', label: 'Голова' },
  { id: 'body_upper', label: 'Верх тела' },
  { id: 'body_lower', label: 'Низ тела' },
  { id: 'legs', label: 'Ноги' },
];

const RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const RARITY_LABEL: Record<Rarity, string> = {
  common: 'Обычный', uncommon: 'Необычный', rare: 'Редкий', epic: 'Эпический', legendary: 'Легендарный',
};

const zoneSelect = document.getElementById('zone') as HTMLSelectElement;
const zoneMeta = document.getElementById('zoneMeta') as HTMLDivElement;
const slotsContainer = document.getElementById('slots') as HTMLDivElement;
const trialsInput = document.getElementById('trials') as HTMLInputElement;
const runOneBtn = document.getElementById('runOne') as HTMLButtonElement;
const runAllBtn = document.getElementById('runAll') as HTMLButtonElement;
const progressEl = document.getElementById('progress') as HTMLDivElement;
const resultsEl = document.getElementById('results') as HTMLDivElement;

// ─── Зона ───────────────────────────────────────────────────────────────────────────────────

for (const id of ALL_ZONE_IDS) {
  const cfg = getZoneConfig(id);
  const opt = document.createElement('option');
  opt.value = id;
  opt.textContent = `${cfg.name} (${'★'.repeat(cfg.star)}${'☆'.repeat(3 - cfg.star)}) — ${cfg.faction}`;
  zoneSelect.appendChild(opt);
}
zoneSelect.value = 'dead-fields';

function updateZoneMeta() {
  const cfg = getZoneConfig(zoneSelect.value);
  const fights = cfg.fights ? `${cfg.fights.min}–${cfg.fights.max} рядовых боёв + босс` : 'только босс';
  zoneMeta.textContent = `${fights} · моб-пул: ${cfg.mob_pool?.length ?? 0} записей · босс: ${cfg.boss.mob_id}`;
}
zoneSelect.addEventListener('change', updateZoneMeta);
updateZoneMeta();

// ─── Билд ───────────────────────────────────────────────────────────────────────────────────

const itemSelects: Partial<Record<SlotType, HTMLSelectElement>> = {};
const raritySelects: Partial<Record<SlotType, HTMLSelectElement>> = {};

for (const slot of SLOTS) {
  const row = document.createElement('div');
  row.className = 'row';

  const label = document.createElement('label');
  label.textContent = slot.label;
  row.appendChild(label);

  const itemSelect = document.createElement('select');
  itemSelect.className = 'item-select';
  const emptyOpt = document.createElement('option');
  emptyOpt.value = '';
  emptyOpt.textContent = '— пусто —';
  itemSelect.appendChild(emptyOpt);
  for (const [id, cfg] of Object.entries(ITEM_CONFIGS)) {
    if (!cfg.slots.includes(slot.id)) continue;
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = `${cfg.name} (${cfg.type})`;
    itemSelect.appendChild(opt);
  }
  row.appendChild(itemSelect);

  const raritySelect = document.createElement('select');
  raritySelect.className = 'rarity-select';
  for (const r of RARITIES) {
    const opt = document.createElement('option');
    opt.value = r;
    opt.textContent = RARITY_LABEL[r];
    raritySelect.appendChild(opt);
  }
  row.appendChild(raritySelect);

  slotsContainer.appendChild(row);
  itemSelects[slot.id] = itemSelect;
  raritySelects[slot.id] = raritySelect;
}

function readEquipment(): Partial<Record<SlotType, ItemInstance>> {
  const equipment: Partial<Record<SlotType, ItemInstance>> = {};
  for (const slot of SLOTS) {
    const itemId = itemSelects[slot.id]!.value;
    if (!itemId) continue;
    equipment[slot.id] = { item_id: itemId, rarity: raritySelects[slot.id]!.value as Rarity };
  }
  return equipment;
}

// ─── Прогон с чанками (не морозит вкладку на больших trials) ──────────────────────────────

const BATCH = 200;

async function runBatched(
  equipment: Partial<Record<SlotType, ItemInstance>>,
  zoneCfg: ZoneConfig,
  trials: number,
  onProgress: (done: number) => void,
): Promise<SimSummary> {
  const s = emptySummary();
  for (let done = 0; done < trials; done += BATCH) {
    const n = Math.min(BATCH, trials - done);
    for (let j = 0; j < n; j++) mergeResult(s, runExpedition(equipment, zoneCfg));
    onProgress(done + n);
    await new Promise((r) => setTimeout(r, 0));
  }
  return s;
}

function setBusy(busy: boolean) {
  runOneBtn.disabled = busy;
  runAllBtn.disabled = busy;
}

// ─── Рендер результатов ────────────────────────────────────────────────────────────────────

function statTile(value: string, label: string): string {
  return `<div class="stat"><div class="v">${value}</div><div class="l">${label}</div></div>`;
}

// ─── Гистограмма HP (SVG, без зависимостей) ────────────────────────────────────────────────
// Валидированный секвенциальный синий (#3987e5, шаг 400) проходит контраст на тёмных
// поверхностях страницы (#14141f / #201f33) — см. dataviz-скилл, references/palette.md.
const HIST_BAR_COLOR = '#3987e5';
const HIST_MEAN_COLOR = '#ffcc44';
const HIST_AXIS_COLOR = '#3a3a55';
const HIST_TEXT_COLOR = '#8899aa';

function renderHistogramSVG(hist: number[], total: number, mean: number | null, title: string): string {
  const W = 500, H = 150;
  const padL = 8, padR = 8, padT = 22, padB = 20;
  const usableW = W - padL - padR;
  const yBase = H - padB;
  const yTop = padT;
  const maxCount = Math.max(1, ...hist);

  const slotW = usableW / HIST_BUCKETS;
  const barW = Math.min(24, slotW - 2); // спека: бар ≤24px, 2px зазор между барами

  let bars = '';
  for (let i = 0; i < HIST_BUCKETS; i++) {
    const count = hist[i];
    const pct = total > 0 ? (count / total * 100) : 0;
    const x = padL + i * slotW + (slotW - barW) / 2;
    const barH = maxCount > 0 ? (count / maxCount) * (yBase - yTop) : 0;
    const y = yBase - barH;
    const r = Math.min(4, barH / 2, barW / 2);
    const lo = Math.round(i * HIST_BUCKET_SIZE);
    const hi = Math.round((i + 1) * HIST_BUCKET_SIZE);
    if (barH <= 0.01) continue;
    const path = r > 0.1
      ? `M ${x} ${yBase} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} L ${x + barW - r} ${y} Q ${x + barW} ${y} ${x + barW} ${y + r} L ${x + barW} ${yBase} Z`
      : `M ${x} ${yBase} L ${x} ${y} L ${x + barW} ${y} L ${x + barW} ${yBase} Z`;
    bars += `<path d="${path}" fill="${HIST_BAR_COLOR}"><title>HP ${lo}–${hi}: ${count} (${pct.toFixed(1)}%)</title></path>`;
  }

  let meanLine = '';
  if (mean !== null && total > 0) {
    const mx = padL + (mean / 100) * usableW;
    const clampedX = Math.max(padL + 20, Math.min(W - padR - 20, mx));
    meanLine = `
      <line x1="${mx}" y1="${yTop - 6}" x2="${mx}" y2="${yBase}" stroke="${HIST_MEAN_COLOR}" stroke-width="2" />
      <text x="${clampedX}" y="${yTop - 10}" fill="${HIST_MEAN_COLOR}" font-size="10" text-anchor="middle">среднее ${mean.toFixed(1)}</text>
    `;
  }

  let ticks = '';
  for (const v of [0, 25, 50, 75, 100]) {
    const tx = padL + (v / 100) * usableW;
    ticks += `<text x="${tx}" y="${H - 5}" fill="${HIST_TEXT_COLOR}" font-size="10" text-anchor="middle">${v}</text>`;
  }

  return `
    <div class="hist-title">${title}</div>
    <svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="${title}">
      <line x1="${padL}" y1="${yBase}" x2="${W - padR}" y2="${yBase}" stroke="${HIST_AXIS_COLOR}" stroke-width="1" />
      ${bars}
      ${meanLine}
      ${ticks}
    </svg>
  `;
}

function renderSingle(zoneCfg: ZoneConfig, s: SimSummary) {
  const winrate = (s.wins / s.trials * 100);
  const avgBossStartHp = s.bossStartHpCount > 0 ? s.bossStartHpSum / s.bossStartHpCount : null;
  const avgBossEndHp = s.bossEndHpCount > 0 ? s.bossEndHpSum / s.bossEndHpCount : null;
  let html = `<div class="stat-grid">
    ${statTile(`${winrate.toFixed(1)}%`, 'Winrate')}
    ${statTile(`${(s.deaths / s.trials * 100).toFixed(1)}%`, 'Смерть до босса')}
    ${statTile(`${avgBossStartHp !== null ? avgBossStartHp.toFixed(1) : '—'} / 100`, 'HP перед боссом (среднее)')}
    ${statTile(`${avgBossEndHp !== null ? avgBossEndHp.toFixed(1) : '—'} / 100`, 'HP после победы над боссом (среднее)')}
  </div>`;
  if (s.stalemates > 0) {
    html += `<div class="zone-meta">⚠ Патовых ситуаций (&gt;10 мин виртуального времени): ${(s.stalemates / s.trials * 100).toFixed(1)}%</div>`;
  }
  html += `<div class="hist-grid">
    <div class="hist-box">${renderHistogramSVG(s.bossStartHist, s.bossStartHpCount, avgBossStartHp, 'Распределение HP перед боссом')}</div>
    <div class="hist-box">${renderHistogramSVG(s.bossEndHist, s.bossEndHpCount, avgBossEndHp, 'Распределение HP после победы над боссом (только выигранные)')}</div>
  </div>`;
  const entries = Object.entries(s.deathAtFight).sort((a, b) => Number(a[0]) - Number(b[0]));
  if (entries.length > 0) {
    html += '<table><tr><th>Смерть после боя №</th><th>Прогонов</th><th>%</th></tr>';
    for (const [fight, count] of entries) {
      html += `<tr><td>${fight}</td><td>${count}</td><td>${(count / s.trials * 100).toFixed(1)}%</td></tr>`;
    }
    html += '</table>';
  }
  resultsEl.innerHTML = html;
  void zoneCfg;
}

async function onRunOne() {
  setBusy(true);
  const zoneCfg = getZoneConfig(zoneSelect.value);
  const equipment = readEquipment();
  const trials = Math.max(1, Number(trialsInput.value) || 3000);
  resultsEl.innerHTML = '';
  const s = await runBatched(equipment, zoneCfg, trials, (done) => {
    progressEl.textContent = `${done} / ${trials}...`;
  });
  progressEl.textContent = `Готово: ${trials} прогонов.`;
  renderSingle(zoneCfg, s);
  setBusy(false);
}

async function onRunAll() {
  setBusy(true);
  const equipment = readEquipment();
  const trials = Math.max(1, Number(trialsInput.value) || 3000);
  resultsEl.innerHTML = '';
  const rows: { zoneCfg: ZoneConfig; s: SimSummary }[] = [];
  for (const id of ALL_ZONE_IDS) {
    const zoneCfg = getZoneConfig(id);
    const s = await runBatched(equipment, zoneCfg, trials, (done) => {
      progressEl.textContent = `${zoneCfg.name}: ${done} / ${trials}...`;
    });
    rows.push({ zoneCfg, s });
  }
  progressEl.textContent = `Готово: ${ALL_ZONE_IDS.length} зон × ${trials} прогонов.`;

  let html = '<table><tr><th>Зона</th><th>Звёзды</th><th>Фракция</th><th>Winrate</th><th>HP до босса</th><th>HP после босса</th><th>Боёв пройдено</th></tr>';
  for (const { zoneCfg, s } of rows) {
    const winrate = s.trials > 0 ? (s.wins / s.trials * 100) : 0;
    const avgBossStartHp = s.bossStartHpCount > 0 ? (s.bossStartHpSum / s.bossStartHpCount).toFixed(1) : '—';
    const avgBossEndHp = s.bossEndHpCount > 0 ? (s.bossEndHpSum / s.bossEndHpCount).toFixed(1) : '—';
    html += `<tr>
      <td>${zoneCfg.name}</td>
      <td>${'★'.repeat(zoneCfg.star)}${'☆'.repeat(3 - zoneCfg.star)}</td>
      <td>${zoneCfg.faction}</td>
      <td>${winrate.toFixed(1)}%<div class="winrate-bar"><div style="width:${winrate}%"></div></div></td>
      <td>${avgBossStartHp}</td>
      <td>${avgBossEndHp}</td>
      <td>${(s.fightsSum / s.trials).toFixed(1)}</td>
    </tr>`;
  }
  html += '</table>';
  resultsEl.innerHTML = html;
  setBusy(false);
}

runOneBtn.addEventListener('click', () => void onRunOne());
runAllBtn.addEventListener('click', () => void onRunAll());
