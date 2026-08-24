import { ALL_MOB_IDS, getMobConfig } from './mobs/registry';
import type { MobUi } from './zones/types';
import { MOB_NAMES } from './i18n/content/mobs';

// Dev-инструмент — всегда на русском, независимо от языка игры (см. план локализации).
const mobNameRu = (id: string) => MOB_NAMES[id].ru;

// Геометрия зеркалит src/scenes/ExpeditionScene.ts: линия тени/бой (groundY=287), позиция героя
// (hx=560, y=219, 100x140, спрайт-лист idle.webp — 6 кадров), позиция моба в слоте 0 (x=700),
// бокс вписывания 150x130 / 210x165 для босса, формула ui.scale/ui.move — addEnemyGraphic (~843-882).
const GROUND_Y = 287;
const HERO_X = 560;
const HERO_Y_CENTER = 219;
const HERO_W = 100;
const HERO_H = 140;
const HERO_FRAME_COUNT = 6; // CHAR_ANIM_FRAMES.idle
const MOB_X = 700;
const REGULAR_BOX = { w: 150, h: 130 };
const BOSS_BOX = { w: 210, h: 165 };
const STAGE_W = 1280;
const STAGE_H = 400;

const SLIDER_IDS = ['scale', 'alpha', 'moveUp', 'moveDown', 'moveLeft', 'moveRight'] as const;
type SliderId = (typeof SLIDER_IDS)[number];

const sortedMobs = [...ALL_MOB_IDS].sort((a, b) =>
  mobNameRu(a).localeCompare(mobNameRu(b), 'ru'));

function readMobIdFromUrl(): string {
  const p = new URLSearchParams(location.search).get('mob');
  return p && sortedMobs.includes(p) ? p : sortedMobs[0];
}

function writeMobIdToUrl(id: string) {
  const url = new URL(location.href);
  url.searchParams.set('mob', id);
  history.replaceState(null, '', url);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

const mobSelect = document.getElementById('mobSelect') as HTMLSelectElement;
const prevBtn = document.getElementById('prevBtn') as HTMLButtonElement;
const nextBtn = document.getElementById('nextBtn') as HTMLButtonElement;
const bossToggle = document.getElementById('bossToggle') as HTMLInputElement;
const stage = document.getElementById('stage') as HTMLDivElement;
const stageWrap = document.getElementById('stageWrap') as HTMLDivElement;
const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;
const saveStatus = document.getElementById('saveStatus') as HTMLSpanElement;

const sliders = Object.fromEntries(
  SLIDER_IDS.map((id) => [id, document.getElementById(id) as HTMLInputElement]),
) as Record<SliderId, HTMLInputElement>;
const nums = Object.fromEntries(
  SLIDER_IDS.map((id) => [id, document.getElementById(`${id}Num`) as HTMLSpanElement]),
) as Record<SliderId, HTMLSpanElement>;

function sliderValue(id: SliderId): number {
  return parseFloat(sliders[id].value);
}

function setSlider(id: SliderId, value: number) {
  sliders[id].value = String(value);
  nums[id].textContent = value.toFixed(2);
}

function createShadow(): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'shadow';
  stage.appendChild(el);
  return el;
}

function positionShadow(el: HTMLDivElement, x: number, y: number, w: number, h: number, alpha: number) {
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.width = `${w}px`;
  el.style.height = `${h}px`;
  el.style.opacity = String(alpha);
}

// Герой — статичная референсная модель (1-й кадр idle-листа), сам по себе не тюнится.
const heroShadowOuter = createShadow();
const heroShadowInner = createShadow();
const heroEl = document.createElement('div');
heroEl.className = 'sprite';
heroEl.style.width = `${HERO_W}px`;
heroEl.style.height = `${HERO_H}px`;
heroEl.style.left = `${HERO_X - HERO_W / 2}px`;
heroEl.style.top = `${HERO_Y_CENTER - HERO_H / 2}px`;
heroEl.style.overflow = 'hidden';
heroEl.style.backgroundImage = "url('/sprites/characters/strongman/idle.webp')";
heroEl.style.backgroundSize = `${HERO_FRAME_COUNT * HERO_W}px ${HERO_H}px`;
heroEl.style.backgroundPosition = '0 0';
stage.appendChild(heroEl);

const heroShW = HERO_W * 0.8;
positionShadow(heroShadowOuter, HERO_X, GROUND_Y, heroShW * 1.1, 16 * 1.1, 0.22);
positionShadow(heroShadowInner, HERO_X, GROUND_Y, heroShW * 0.9, 16 * 0.9, 0.45);

// Моб — img, чтобы знать naturalWidth/naturalHeight для box-fit расчёта.
const mobShadowOuter = createShadow();
const mobShadowInner = createShadow();
const mobImg = document.createElement('img');
mobImg.className = 'sprite';
stage.appendChild(mobImg);

let currentMobId = sortedMobs[0];
let loadGen = 0;

function renderMob() {
  const nw = mobImg.naturalWidth;
  const nh = mobImg.naturalHeight;
  if (!nw || !nh) return;

  const box = bossToggle.checked ? BOSS_BOX : REGULAR_BOX;
  const sc = Math.min(box.w / nw, box.h / nh) * sliderValue('scale');
  const dispW = nw * sc;
  const dispH = nh * sc;
  const moveX = (sliderValue('moveRight') - sliderValue('moveLeft')) * dispW;
  const moveY = (sliderValue('moveDown') - sliderValue('moveUp')) * dispH;

  mobImg.style.width = `${dispW}px`;
  mobImg.style.height = `${dispH}px`;
  mobImg.style.left = `${MOB_X - dispW / 2 + moveX}px`;
  mobImg.style.top = `${GROUND_Y - dispH + moveY}px`;
  mobImg.style.opacity = String(sliderValue('alpha'));

  const shW = dispW * 0.8;
  positionShadow(mobShadowOuter, MOB_X, GROUND_Y, shW * 1.1, 16 * 1.1, 0.22);
  positionShadow(mobShadowInner, MOB_X, GROUND_Y, shW * 0.9, 16 * 0.9, 0.45);
}

function loadMobSprite(id: string) {
  const gen = ++loadGen;
  mobImg.onload = () => {
    if (gen !== loadGen) return;
    renderMob();
  };
  mobImg.src = `/sprites/mobs/${id}/base.webp`;
}

function loadUiIntoSliders(id: string) {
  const ui = getMobConfig(id).ui;
  setSlider('scale', ui?.scale ?? 1);
  setSlider('alpha', ui?.alpha ?? 1);
  setSlider('moveUp', ui?.move?.up ?? 0);
  setSlider('moveDown', ui?.move?.down ?? 0);
  setSlider('moveLeft', ui?.move?.left ?? 0);
  setSlider('moveRight', ui?.move?.right ?? 0);
}

function applyMob(id: string) {
  currentMobId = id;
  mobSelect.value = id;
  writeMobIdToUrl(id);
  saveStatus.textContent = '';
  saveStatus.classList.remove('error');
  loadUiIntoSliders(id);
  loadMobSprite(id);
}

function step(delta: number) {
  const idx = sortedMobs.indexOf(currentMobId);
  const next = sortedMobs[(idx + delta + sortedMobs.length) % sortedMobs.length];
  applyMob(next);
}

function collectUi(): MobUi | null {
  const ui: MobUi = {};
  const scale = round2(sliderValue('scale'));
  const alpha = round2(sliderValue('alpha'));
  if (scale !== 1) ui.scale = scale;
  if (alpha !== 1) ui.alpha = alpha;

  const move: NonNullable<MobUi['move']> = {};
  const up = round2(sliderValue('moveUp'));
  const down = round2(sliderValue('moveDown'));
  const left = round2(sliderValue('moveLeft'));
  const right = round2(sliderValue('moveRight'));
  if (up !== 0) move.up = up;
  if (down !== 0) move.down = down;
  if (left !== 0) move.left = left;
  if (right !== 0) move.right = right;
  if (Object.keys(move).length > 0) ui.move = move;

  return Object.keys(ui).length > 0 ? ui : null;
}

function updateStageScale() {
  const scale = Math.min(stageWrap.clientWidth / STAGE_W, stageWrap.clientHeight / STAGE_H);
  stage.style.transform = `scale(${scale})`;
}

for (const id of sortedMobs) {
  const opt = document.createElement('option');
  opt.value = id;
  opt.textContent = `${mobNameRu(id)} (${id})`;
  mobSelect.appendChild(opt);
}

for (const id of SLIDER_IDS) {
  sliders[id].addEventListener('input', () => {
    nums[id].textContent = sliderValue(id).toFixed(2);
    renderMob();
  });
}
bossToggle.addEventListener('change', renderMob);
mobSelect.addEventListener('change', () => applyMob(mobSelect.value));
prevBtn.addEventListener('click', () => step(-1));
nextBtn.addEventListener('click', () => step(1));
resetBtn.addEventListener('click', () => {
  setSlider('scale', 1);
  setSlider('alpha', 1);
  setSlider('moveUp', 0);
  setSlider('moveDown', 0);
  setSlider('moveLeft', 0);
  setSlider('moveRight', 0);
  renderMob();
});
saveBtn.addEventListener('click', async () => {
  saveStatus.textContent = 'Сохранение…';
  saveStatus.classList.remove('error');
  try {
    const res = await fetch('/__save-mob-ui', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobId: currentMobId, ui: collectUi() }),
    });
    if (!res.ok) throw new Error(await res.text());
    saveStatus.textContent = 'Сохранено';
  } catch (e) {
    saveStatus.textContent = `Ошибка: ${e instanceof Error ? e.message : String(e)}`;
    saveStatus.classList.add('error');
  }
});
window.addEventListener('resize', updateStageScale);

updateStageScale();
applyMob(readMobIdFromUrl());
