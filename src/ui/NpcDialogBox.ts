import Phaser from 'phaser';
import { FONT_FAMILY } from './theme';
import { CX, GAME_W, GAME_H } from './layout';
import type { DialogEntry, DialogNpc } from '../dialogs/definitions';

// Портрет и подпись — по существующим НПС лагеря (см. CampScene.buildNPCs), без нового арта.
const NPC_TEXTURE: Record<DialogNpc, string> = { dealer: 'npc-dealer', smith: 'npc-smith' };
const NPC_NAME: Record<DialogNpc, string> = { dealer: 'Информатор', smith: 'Кузнец' };

const BOX_W = 900;
// Высота бокса под текст на +50% (см. NAME_FONT_SIZE/BODY_FONT_SIZE) — иначе длинные реплики
// (напр. про фракцию Нежити) обрезались бы: те же ~103 символа в строке при более крупном
// шрифте занимают заметно больше строк.
const BOX_H = 260;
const BOTTOM_MARGIN = 18; // отступ низа бокса от низа экрана — не меняется при росте BOX_H
// Портрет — тоже ×1.5 (было 96×144), вместе с текстом.
const ICON_W = 144;
const ICON_H = 216;
const ICON_LEFT_PAD = 22; // отступ левого края иконки от левого края бокса
const ICON_TEXT_GAP = 32; // зазор между иконкой и текстом
const TEXT_X_PAD = ICON_LEFT_PAD + ICON_W + ICON_TEXT_GAP; // от левого края бокса до текста
const NAME_FONT_SIZE = 23; // 15px ×1.5
const BODY_FONT_SIZE = 21; // 14px ×1.5
const HINT_FONT_SIZE = 17; // 11px ×1.5
const TYPE_DELAY_MS = 18;
const DEPTH = 250;

/**
 * Реплика НПС: иконка персонажа слева, текст с посимвольной анимацией печати справа.
 * Первый клик по открытому диалогу доскролливает текст целиком, второй — закрывает (и
 * переходит к следующей реплике очереди, если она есть). Один инстанс на сцену (CampScene),
 * `show()` можно звать повторно — предыдущая очередь при этом обрывается.
 */
export class NpcDialogBox {
  private scene: Phaser.Scene;
  private queue: DialogEntry[] = [];
  private container?: Phaser.GameObjects.Container;
  private icon?: Phaser.GameObjects.Image;
  private nameText?: Phaser.GameObjects.Text;
  private bodyText?: Phaser.GameObjects.Text;
  private typeEvent?: Phaser.Time.TimerEvent;
  private fullText = '';
  private state: 'idle' | 'typing' | 'revealed' = 'idle';
  private onQueueEmpty?: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  isOpen(): boolean {
    return this.state !== 'idle';
  }

  /** Показывает реплики по очереди; `onDone` вызывается, когда очередь исчерпана и оверлей закрыт. */
  show(queue: DialogEntry[], onDone?: () => void) {
    if (queue.length === 0) return;
    this.container?.destroy(true);
    this.typeEvent?.remove();
    this.queue = [...queue];
    this.onQueueEmpty = onDone;
    this.buildContainer();
    this.advance();
  }

  private buildContainer() {
    const boxY = GAME_H - BOTTOM_MARGIN - BOX_H / 2;
    const iconX = CX - BOX_W / 2 + ICON_LEFT_PAD + ICON_W / 2;
    const textX = CX - BOX_W / 2 + TEXT_X_PAD;

    const overlay = this.scene.add.rectangle(CX, GAME_H / 2, GAME_W, GAME_H, 0x000000, 0.35).setInteractive();
    const box = this.scene.add.rectangle(CX, boxY, BOX_W, BOX_H, 0x14121e, 0.97)
      .setStrokeStyle(2, 0x554488).setInteractive();
    const iconFrame = this.scene.add.rectangle(iconX, boxY, ICON_W + 10, ICON_H + 10, 0x0a0a12)
      .setStrokeStyle(2, 0x554488);
    this.icon = this.scene.add.image(iconX, boxY, 'npc-dealer').setDisplaySize(ICON_W, ICON_H);
    this.nameText = this.scene.add.text(textX, boxY - BOX_H / 2 + 16, '', {
      fontSize: `${NAME_FONT_SIZE}px`, fontFamily: FONT_FAMILY, color: '#ffdd44', fontStyle: 'bold',
    });
    this.bodyText = this.scene.add.text(textX, boxY - BOX_H / 2 + 46, '', {
      fontSize: `${BODY_FONT_SIZE}px`, fontFamily: FONT_FAMILY, color: '#dddddd', lineSpacing: 8,
      wordWrap: { width: CX + BOX_W / 2 - textX - 24 },
    });
    const hint = this.scene.add.text(CX + BOX_W / 2 - 14, boxY + BOX_H / 2 - 12, '(клик)', {
      fontSize: `${HINT_FONT_SIZE}px`, fontFamily: FONT_FAMILY, color: '#888888',
    }).setOrigin(1, 1);

    this.container = this.scene.add.container(0, 0, [overlay, box, iconFrame, this.icon, this.nameText, this.bodyText, hint])
      .setDepth(DEPTH);

    overlay.on('pointerdown', () => this.onClick());
    box.on('pointerdown', () => this.onClick());
  }

  private advance() {
    const entry = this.queue.shift();
    if (!entry) {
      this.close();
      return;
    }
    this.icon!.setTexture(NPC_TEXTURE[entry.npc]);
    this.nameText!.setText(NPC_NAME[entry.npc]);
    this.fullText = entry.text;
    this.bodyText!.setText('');
    this.state = 'typing';

    let shown = 0;
    this.typeEvent = this.scene.time.addEvent({
      delay: TYPE_DELAY_MS,
      repeat: this.fullText.length - 1,
      callback: () => {
        shown++;
        this.bodyText!.setText(this.fullText.slice(0, shown));
        if (shown >= this.fullText.length) this.state = 'revealed';
      },
    });
  }

  private onClick() {
    if (this.state === 'typing') {
      this.typeEvent?.remove();
      this.bodyText!.setText(this.fullText);
      this.state = 'revealed';
      return;
    }
    if (this.state === 'revealed') this.advance();
  }

  private close() {
    this.typeEvent?.remove();
    this.container?.destroy(true);
    this.container = undefined;
    this.state = 'idle';
    const cb = this.onQueueEmpty;
    this.onQueueEmpty = undefined;
    cb?.();
  }
}
