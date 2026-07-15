// Браузерный UI баланса предметов (balance-items.html). Пока одна таблица — оружие
// (см. src/balance/weaponStats.ts); остальные типы предметов добавлять по мере надобности.

import { RARITIES, RARITY_LABEL } from './rarity';
import { getWeaponRows } from './weaponStats';
import type { Rarity } from '../items/types';

const raritySelect = document.getElementById('rarity') as HTMLSelectElement;
const weaponTableEl = document.getElementById('weaponTable') as HTMLDivElement;

for (const r of RARITIES) {
  const opt = document.createElement('option');
  opt.value = r;
  opt.textContent = RARITY_LABEL[r];
  raritySelect.appendChild(opt);
}

function renderWeaponTable(rarity: Rarity) {
  const rows = getWeaponRows(rarity);

  let html = `<table>
    <tr>
      <th>Предмет</th>
      <th>Архетип</th>
      <th>Урон</th>
      <th>Перезарядка</th>
      <th>УВС × 1 цель</th>
      <th>УВС × 2 цели</th>
      <th>УВС × 4 цели</th>
      <th>Доп. эффекты</th>
    </tr>`;

  for (const row of rows) {
    html += `<tr>
      <td>${row.name}</td>
      <td class="tags">${row.tags.join(', ')}</td>
      <td class="num">${row.damage}</td>
      <td class="num">${row.interval.toFixed(2)}s</td>
      <td class="num">${row.dps1.toFixed(2)}</td>
      <td class="num">${row.dps2.toFixed(2)}</td>
      <td class="num">${row.dps4.toFixed(2)}</td>
      <td class="effects">${row.effects.join('<br>') || '—'}</td>
    </tr>`;
  }

  html += '</table>';
  weaponTableEl.innerHTML = html;
}

raritySelect.addEventListener('change', () => renderWeaponTable(raritySelect.value as Rarity));
renderWeaponTable('common');
