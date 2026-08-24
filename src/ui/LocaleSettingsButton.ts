import Phaser from 'phaser';
import { FONT_FAMILY } from './theme';
import { rightX } from './layout';
import { getLocale, setLocale } from '../core/Locale';

const BTN_W = 40;
const BTN_H = 24;
const CY = 17;
const GAP = 4;
// SoundSettingsButton занимает rightX(4..44) (см. SoundSettingsButton.ts) — встаём слева от неё.
const RIGHT_OFFSET = 4 + 40 + GAP;

/**
 * Переключатель языка RU⇄EN в правом верхнем углу лагеря, рядом со SoundSettingsButton.
 * Только два языка — без панели, один клик сразу меняет и рестартует сцену (см. src/core/Locale.ts:
 * текст сцены не подписан на locale_changed, весь UI перерисовывается заново при restart).
 * Показывается только в CampScene — см. план локализации (мидбоевой рестарт ExpeditionScene рискует
 * потерять состояние боя).
 */
export class LocaleSettingsButton {
  constructor(scene: Phaser.Scene) {
    const bx = rightX(RIGHT_OFFSET + BTN_W / 2);
    const bg = scene.add.rectangle(bx, CY, BTN_W, BTN_H, 0x000000, 0.55).setOrigin(0.5).setDepth(100)
      .setInteractive({ useHandCursor: true });
    scene.add.text(bx, CY, getLocale().toUpperCase(), {
      fontSize: '12px', fontFamily: FONT_FAMILY, color: '#66ccff',
    }).setOrigin(0.5).setDepth(101);

    bg.on('pointerover', () => bg.setFillStyle(0x000000, 0.75));
    bg.on('pointerout', () => bg.setFillStyle(0x000000, 0.55));
    bg.on('pointerdown', () => {
      setLocale(getLocale() === 'ru' ? 'en' : 'ru');
      scene.scene.restart();
    });
  }
}
