import Phaser from 'phaser';
import type { FloaterType } from '../core/EventBus';
import { FONT_FAMILY } from './theme';

const COLORS: Record<FloaterType, number> = {
  damage: 0xff4444,
  heal: 0x44ff88,
  essence: 0x44ddff,
  gold: 0xffcc00,
  miss: 0xcccccc,
  block: 0xffdd00,
  absorb: 0x88bbdd,
  counter: 0xff8844,
};

const LABELS: Record<FloaterType, (v: number) => string> = {
  damage: v => `-${v}`,
  heal: v => `+${v} HP`,
  essence: v => `+${v}`,
  gold: v => `+${v}G`,
  miss: () => 'мимо',
  block: () => 'Блок',
  absorb: () => 'Отражено',
  counter: () => 'Контрудар!',
};

const FONT_SIZE = 20;
// heal — на 10% мельче базового, чтобы не спорил по весу с цифрой урона.
const FONT_SIZES: Partial<Record<FloaterType, number>> = {
  heal: FONT_SIZE * 0.9,
};

export function spawnFloater(scene: Phaser.Scene, type: FloaterType, value: number, x: number, y: number) {
  // Цифры урона рисуем поверх длинных надписей (Блок/Отражено/мимо), чтобы не терялись при наложении.
  const depth = type === 'damage' ? 320 : 300;
  const text = scene.add.text(x, y, LABELS[type](value), {
    fontSize: `${FONT_SIZES[type] ?? FONT_SIZE}px`,
    fontFamily: FONT_FAMILY,
    color: '#' + COLORS[type].toString(16).padStart(6, '0'),
    stroke: '#000000',
    strokeThickness: 3,
  }).setOrigin(0.5).setDepth(depth);

  scene.tweens.add({
    targets: text,
    y: y - 60,
    alpha: 0,
    duration: 1350,
    ease: 'Power1',
    onComplete: () => text.destroy(),
  });
}

/** Иконка ресурса + число, всплывает и гаснет так же, как spawnFloater (для разбора предметов и т.п.). */
export function spawnIconFloater(scene: Phaser.Scene, iconKey: string, text: string, x: number, y: number, color = '#44ddff') {
  const depth = 300;
  const icon = scene.add.image(x - 4, y, iconKey).setDisplaySize(22, 22).setOrigin(1, 0.5).setDepth(depth);
  const label = scene.add.text(x + 4, y, text, {
    fontSize: `${FONT_SIZE}px`,
    fontFamily: FONT_FAMILY,
    color,
    stroke: '#000000',
    strokeThickness: 3,
  }).setOrigin(0, 0.5).setDepth(depth);

  scene.tweens.add({
    targets: [icon, label],
    y: y - 60,
    alpha: 0,
    duration: 1350,
    ease: 'Power1',
    onComplete: () => { icon.destroy(); label.destroy(); },
  });
}
