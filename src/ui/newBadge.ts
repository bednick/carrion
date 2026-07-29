import Phaser from 'phaser';
import { FONT_FAMILY } from './theme';

// Наклонённый пульсирующий значок «NEW» для карточек с предметом, который игрок
// ещё ни разу не выносил из похода (MetaStore.stats.items_carried_out) и которого нет
// в рюкзаке текущего похода (см. ExpeditionScene.isNewItem).
// Не интерактивен: лежит поверх карточки, но хит-тест Phaser его игнорирует,
// поэтому ховер и клик достаются карточке под ним.
export function newBadge(
  scene: Phaser.Scene, x: number, y: number,
): Phaser.GameObjects.Container {
  const text = scene.add.text(0, 0, 'NEW', {
    fontSize: '12px', fontFamily: FONT_FAMILY, color: '#1a1a2a',
  }).setOrigin(0.5);

  const w = text.width + 10;
  const h = text.height + 4;
  const plate = scene.add.rectangle(0, 0, w, h, 0xffdd44).setStrokeStyle(1, 0x8a6a00);

  const c = scene.add.container(x, y, [plate, text]);
  c.setSize(w, h);
  c.setRotation(-0.22);

  const tween = scene.tweens.add({
    targets: c,
    scale: 1.15,
    rotation: -0.13,
    yoyo: true,
    repeat: -1,
    duration: 620,
    ease: 'Sine.easeInOut',
  });
  // Иначе после destroy контейнера tween продолжит писать в уничтоженный объект.
  c.once('destroy', () => tween.remove());

  return c;
}
