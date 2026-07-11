import Phaser from 'phaser';
import { rewardIconKey, essenceIconKey } from './rewards';
import type { EssenceTier } from '../items/types';

// Единый способ показать ресурс в UI: иконка + число вместо текстовых «10g» / «золота».
// Возвращает контейнер (по умолчанию левый край = x, центр по вертикали = y).
export interface ResourceTagOpts {
  iconSize?: number;   // сторона иконки, px (default 18)
  fontSize?: number;   // кегль числа, px (default 12)
  color?: string;      // цвет числа (default '#ffffff')
  gap?: number;        // зазор иконка↔число, px (default 4)
  originX?: number;    // 0 — левый край в x (default), 0.5 — центр, 1 — правый край
  prefix?: string;     // приписка перед числом (например '+')
}

export function resourceTag(
  scene: Phaser.Scene,
  iconKey: string,
  value: number | string,
  opts: ResourceTagOpts = {},
): Phaser.GameObjects.Container {
  const iconSize = opts.iconSize ?? 18;
  const fs = opts.fontSize ?? 12;
  const gap = opts.gap ?? 4;
  const color = opts.color ?? '#ffffff';

  const icon = scene.add.image(0, 0, iconKey).setDisplaySize(iconSize, iconSize).setOrigin(0, 0.5);
  const text = scene.add.text(iconSize + gap, 0, `${opts.prefix ?? ''}${value}`, {
    fontSize: `${fs}px`, fontFamily: 'monospace', color,
  }).setOrigin(0, 0.5);

  const w = iconSize + gap + text.width;
  const ox = (opts.originX ?? 0) * w;
  icon.x -= ox;
  text.x -= ox;

  const c = scene.add.container(0, 0, [icon, text]);
  c.setSize(w, Math.max(iconSize, text.height));
  return c;
}

/** Тег золота. */
export function goldTag(
  scene: Phaser.Scene, value: number | string, opts: ResourceTagOpts = {},
): Phaser.GameObjects.Container {
  return resourceTag(scene, rewardIconKey('gold'), value, { color: '#ffcc00', ...opts });
}

/** Тег эссенции конкретного тира. */
export function essenceTag(
  scene: Phaser.Scene, tier: EssenceTier, value: number | string, opts: ResourceTagOpts = {},
): Phaser.GameObjects.Container {
  return resourceTag(scene, essenceIconKey(tier), value, { color: '#cbe6ff', ...opts });
}
