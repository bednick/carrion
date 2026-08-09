import Phaser from 'phaser';
import type { FloaterType } from '../core/EventBus';
import { FONT_FAMILY } from './theme';

const COLORS: Record<FloaterType, number> = {
  damage: 0xff4444,
  heal: 0x44ff88,
  essence: 0x44ddff,
  miss: 0xcccccc,
  block: 0x55bbff, // защитный голубой (отличается от бирюзового неуязвимости)
  counter: 0xff8844,
  invuln: 0x66ccff,
};

const LABELS: Record<FloaterType, (v: number) => string> = {
  damage: v => `-${v}`,
  heal: v => `+${v} HP`,
  essence: v => `+${v}`,
  miss: () => 'промах',
  block: () => 'Блок',
  counter: () => 'Контрудар!',
  invuln: () => 'Неуязвимость!',
};

const FONT_SIZE = 20;
// heal — на 10% мельче базового, чтобы не спорил по весу с цифрой урона.
const FONT_SIZES: Partial<Record<FloaterType, number>> = {
  heal: FONT_SIZE * 0.9,
};

// Крит-стиль: только для type='damage'. Цвет — как обычный урон (красный), но крупнее и с иконкой молнии
// того же цвета вместо восклицательного знака.
const CRIT_FONT_SIZE = 30;
const CRIT_BOLT_H = 22;
const CRIT_BOLT_W = 13;
// Молния в нормированной коробке 0..1 (масштабируется до CRIT_BOLT_W×CRIT_BOLT_H).
const BOLT_PTS: ReadonlyArray<readonly [number, number]> = [
  [0.5, 0], [0.1, 0.55], [0.45, 0.55], [0.25, 1], [0.9, 0.4], [0.55, 0.4], [0.75, 0],
];

export function spawnFloater(scene: Phaser.Scene, type: FloaterType, value: number, x: number, y: number, opts?: { crit?: boolean }) {
  const isCrit = type === 'damage' && !!opts?.crit;
  // Цифры урона рисуем поверх длинных надписей (Блок/промах), чтобы не терялись при наложении.
  const depth = type === 'damage' ? 320 : 300;
  const text = scene.add.text(x, y, LABELS[type](value), {
    fontSize: `${isCrit ? CRIT_FONT_SIZE : (FONT_SIZES[type] ?? FONT_SIZE)}px`,
    fontFamily: FONT_FAMILY,
    color: '#' + COLORS[type].toString(16).padStart(6, '0'),
    stroke: '#000000',
    strokeThickness: isCrit ? 4 : 3,
  }).setOrigin(0.5).setDepth(depth);

  const targets: Phaser.GameObjects.GameObject[] = [text];

  if (isCrit) {
    // Молния справа от числа, того же красного цвета (COLORS.damage), с чёрной обводкой как у текста.
    const boltX = x + text.width / 2 + 2;
    const boltY = y - CRIT_BOLT_H / 2;
    const bolt = scene.add.graphics({ x: boltX, y: boltY }).setDepth(depth);
    bolt.fillStyle(COLORS.damage, 1);
    bolt.lineStyle(2, 0x000000, 1);
    bolt.beginPath();
    BOLT_PTS.forEach(([px, py], i) => {
      const pt: [number, number] = [px * CRIT_BOLT_W, py * CRIT_BOLT_H];
      if (i === 0) bolt.moveTo(pt[0], pt[1]);
      else bolt.lineTo(pt[0], pt[1]);
    });
    bolt.closePath();
    bolt.fillPath();
    bolt.strokePath();
    targets.push(bolt);
  }

  scene.tweens.add({
    targets,
    y: '-=60',
    alpha: 0,
    duration: 1350,
    ease: 'Power1',
    onComplete: () => targets.forEach(t => t.destroy()),
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
