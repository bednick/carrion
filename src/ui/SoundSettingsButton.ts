import Phaser from 'phaser';
import { SoundManager } from '../core/SoundManager';
import { EventBus } from '../core/EventBus';
import type { SoundCategory } from '../core/SoundRegistry';
import { FONT_FAMILY } from './theme';
import { rightX, GAME_W, GAME_H } from './layout';
import { t } from '../i18n/t';

// Геометрия: виджет прижат к правому верхнему углу экрана. Отступы от правого края — константы, но сам
// правый край (GAME_W) меняется при ресайзе окна, поэтому x-координаты считаются в конструкторе/при
// открытии панели, а не на уровне модуля (иначе после пересчёта layout виджет остался бы на старом
// месте). См. src/ui/layout.ts.
const BTN_W = 40;
const BTN_H = 24;
const CY = 17;

const PANEL_W = 210;
const PANEL_TOP = 32;
const ROW_H = 26;
const TRACK_LEFT = 86;
const TRACK_W = 90;

const COLOR_ON = 0x66ccff;
const COLOR_OFF = 0x555555;
const TEXT_ON = '#66ccff';
const TEXT_OFF = '#555555';

const DEPTH_OVERLAY = 104;
const DEPTH_PANEL = 105;

interface RowSpec {
  label: string;
  get: () => number;
  set: (v: number) => void;
  /** Короткий сэмпл на отпускании — для категорий, которые вживую не слышно. */
  sample?: boolean;
}

/** Одна строка «подпись — дорожка — процент» внутри панели настроек. */
class SliderRow {
  private fill: Phaser.GameObjects.Rectangle;
  private handle: Phaser.GameObjects.Rectangle;
  private percent: Phaser.GameObjects.Text;
  readonly spec: RowSpec;

  constructor(
    scene: Phaser.Scene,
    container: Phaser.GameObjects.Container,
    y: number,
    spec: RowSpec,
    onGrab: (row: SliderRow) => void,
  ) {
    this.spec = spec;

    const label = scene.add.text(10, y, spec.label, {
      fontSize: '12px', fontFamily: FONT_FAMILY, color: '#ddddee',
    }).setOrigin(0, 0.5);
    const track = scene.add.rectangle(TRACK_LEFT, y, TRACK_W, 4, 0x333344).setOrigin(0, 0.5);
    this.fill = scene.add.rectangle(TRACK_LEFT, y, 0, 4, COLOR_ON).setOrigin(0, 0.5);
    this.handle = scene.add.rectangle(TRACK_LEFT, y, 8, 14, COLOR_ON).setOrigin(0.5);
    this.percent = scene.add.text(PANEL_W - 10, y, '', {
      fontSize: '12px', fontFamily: FONT_FAMILY, color: '#aaaabb',
    }).setOrigin(1, 0.5);

    // Зона захвата чуть шире дорожки — удобнее попадать.
    const hit = scene.add.rectangle(TRACK_LEFT + TRACK_W / 2, y, TRACK_W + 16, 20, 0xffffff, 0)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerdown', (p: Phaser.Input.Pointer) => {
      onGrab(this);
      this.setFromPointer(p.x, container.x);
    });

    container.add([label, track, this.fill, this.handle, this.percent, hit]);
    this.refresh();
  }

  setFromPointer(worldX: number, containerX: number): void {
    const v = Phaser.Math.Clamp((worldX - containerX - TRACK_LEFT) / TRACK_W, 0, 1);
    this.spec.set(v);
    this.refresh();
  }

  refresh(): void {
    const v = this.spec.get();
    const dim = SoundManager.isMuted() || v === 0;
    this.fill.width = v * TRACK_W;
    this.fill.setFillStyle(dim ? COLOR_OFF : COLOR_ON);
    this.handle.x = TRACK_LEFT + v * TRACK_W;
    this.handle.setFillStyle(dim ? COLOR_OFF : COLOR_ON);
    this.percent.setText(Math.round(v * 100) + '%');
    this.percent.setColor(dim ? TEXT_OFF : '#aaaabb');
  }
}

/**
 * Кнопка настроек звука в правом верхнем углу и выпадающая из неё панель:
 * тумблер «Без звука» + четыре ползунка (общая / окружение / музыка / эффекты).
 * Состояние целиком живёт в SoundManager (он же персистит его в localStorage) — панель
 * только рисует его и подписана на 'sound_settings_changed', чтобы не разъезжаться
 * с глобальной клавишей M и с ползунком флейтиста.
 * Создаётся в каждой сцене заново; умирает вместе со сценой.
 */
export class SoundSettingsButton {
  private scene: Phaser.Scene;
  private icon: Phaser.GameObjects.Text;
  private overlay?: Phaser.GameObjects.Rectangle;
  private panel?: Phaser.GameObjects.Container;
  private rows: SliderRow[] = [];
  private muteMark?: Phaser.GameObjects.Text;
  private dragging?: SliderRow;
  private moveHandler: (p: Phaser.Input.Pointer) => void;
  private upHandler: () => void;
  private onSettingsChanged: () => void;
  /** Сцена уже гасится: объекты уничтожены движком, перерисовывать нечего. */
  private dead = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const bx = rightX(4 + BTN_W / 2);
    const bg = scene.add.rectangle(bx, CY, BTN_W, BTN_H, 0x000000, 0.55).setOrigin(0.5).setDepth(100)
      .setInteractive({ useHandCursor: true });
    this.icon = scene.add.text(bx, CY, '♪', {
      fontSize: '16px', fontFamily: FONT_FAMILY, color: TEXT_ON,
    }).setOrigin(0.5).setDepth(101);

    bg.on('pointerdown', () => this.toggle());

    this.moveHandler = (p) => {
      if (this.dragging && this.panel) this.dragging.setFromPointer(p.x, this.panel.x);
    };
    this.upHandler = () => {
      if (!this.dragging) return;
      const sample = this.dragging.spec.sample;
      this.dragging = undefined;
      if (sample) SoundManager.play('loot_pickup'); // короткий сэмпл для оценки громкости на слух
    };
    scene.input.on('pointermove', this.moveHandler);
    scene.input.on('pointerup', this.upHandler);

    this.onSettingsChanged = () => this.refresh();
    EventBus.on('sound_settings_changed', this.onSettingsChanged);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());

    this.refresh();
  }

  private toggle(): void {
    if (this.panel) this.close();
    else this.open();
  }

  private open(): void {
    const scene = this.scene;
    const specs: RowSpec[] = [
      { label: t('sound_master'), get: () => SoundManager.getVolume(), set: (v) => this.setMaster(v) },
      { label: t('sound_ambient'), get: () => SoundManager.getCategoryVolume('ambient'), set: (v) => this.setCat('ambient', v) },
      { label: t('camp_music_label'), get: () => SoundManager.getCategoryVolume('music'), set: (v) => this.setCat('music', v) },
      { label: t('sound_sfx'), get: () => SoundManager.getCategoryVolume('sfx'), set: (v) => this.setCat('sfx', v), sample: true },
    ];

    const panelH = 34 + ROW_H * (specs.length + 1) + 6;

    // Полноэкранный оверлей ловит клики мимо панели (клик по самой панели до него не доходит: topOnly).
    this.overlay = scene.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000000, 0)
      .setDepth(DEPTH_OVERLAY).setInteractive();
    this.overlay.on('pointerdown', () => this.close());

    // Контейнер прижат к правому краю; локальные координаты — от левого верхнего угла панели.
    const px = Math.max(4, rightX(4) - PANEL_W);
    this.panel = scene.add.container(px, PANEL_TOP).setDepth(DEPTH_PANEL);

    const bg = scene.add.rectangle(PANEL_W / 2, panelH / 2, PANEL_W, panelH, 0x1e1e2e, 0.97)
      .setStrokeStyle(2, 0x555577).setInteractive();
    const title = scene.add.text(10, 8, t('sound_panel_title'), {
      fontSize: '12px', fontFamily: FONT_FAMILY, color: '#ddddee',
    }).setOrigin(0, 0);
    this.panel.add([bg, title]);

    // Строка мьюта.
    const muteY = 34 + ROW_H / 2;
    this.muteMark = scene.add.text(10, muteY, '', {
      fontSize: '12px', fontFamily: FONT_FAMILY, color: TEXT_OFF,
    }).setOrigin(0, 0.5);
    const muteLabel = scene.add.text(34, muteY, t('sound_mute'), {
      fontSize: '12px', fontFamily: FONT_FAMILY, color: '#ddddee',
    }).setOrigin(0, 0.5);
    const muteHit = scene.add.rectangle(PANEL_W / 2, muteY, PANEL_W - 12, ROW_H - 4, 0xffffff, 0)
      .setInteractive({ useHandCursor: true });
    muteHit.on('pointerdown', () => {
      const muted = SoundManager.toggleMute();
      if (!muted) SoundManager.play('loot_pickup');
    });
    this.panel.add([this.muteMark, muteLabel, muteHit]);

    this.rows = specs.map((spec, i) => new SliderRow(
      scene, this.panel!, 34 + ROW_H * (i + 1) + ROW_H / 2, spec, (row) => { this.dragging = row; },
    ));

    this.refresh();
  }

  private setMaster(v: number): void {
    SoundManager.setVolume(v);
    if (v > 0 && SoundManager.isMuted()) SoundManager.setMuted(false);
  }

  private setCat(cat: SoundCategory, v: number): void {
    SoundManager.setCategoryVolume(cat, v);
    if (v > 0 && SoundManager.isMuted()) SoundManager.setMuted(false);
  }

  private close(): void {
    this.dragging = undefined;
    this.rows = [];
    this.muteMark = undefined;
    this.overlay?.destroy();
    this.overlay = undefined;
    this.panel?.destroy();
    this.panel = undefined;
    this.refresh();
  }

  private refresh(): void {
    if (this.dead || !this.icon.active) return;
    const muted = SoundManager.isMuted();
    this.icon.setText(muted ? '×' : '♪');
    this.icon.setColor(muted ? TEXT_OFF : TEXT_ON);
    this.muteMark?.setText(muted ? '[×]' : '[ ]');
    this.muteMark?.setColor(muted ? TEXT_ON : TEXT_OFF);
    for (const row of this.rows) row.refresh();
  }

  destroy(): void {
    this.dead = true;
    this.scene.input.off('pointermove', this.moveHandler);
    this.scene.input.off('pointerup', this.upHandler);
    EventBus.off('sound_settings_changed', this.onSettingsChanged);
    this.close();
  }
}
