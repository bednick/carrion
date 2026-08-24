import Phaser from 'phaser';
import { FONT_FAMILY } from './theme';
import { CX, GAME_W, GAME_H } from './layout';
import { essenceIconKey } from './rewards';
import { addItemIcon, ItemIconView } from './itemIcon';
import { RARITY_HEX, RARITY_COLORS } from '../items/rarity';
import { itemDisplayName } from '../i18n/content';
import { t } from '../i18n/t';
import type { EssenceTier, Rarity } from '../items/types';
import type { DialogEntry, DialogNpc, DialogSegment } from '../dialogs/definitions';
import type { Tooltip } from './Tooltip';

// Портрет и подпись — по существующим НПС лагеря (см. CampScene.buildNPCs), без нового арта.
const NPC_TEXTURE: Record<DialogNpc, string> = { dealer: 'npc-dealer', smith: 'npc-smith' };
// Функция, а не module-level Record: должна резолвиться заново при каждом показе (не на импорте
// модуля) — иначе имя НПС замёрзло бы на языке, который был активен при первой загрузке страницы.
function npcName(npc: DialogNpc): string {
  return npc === 'dealer' ? t('npc_dealer') : t('npc_smith');
}

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
const NAME_FONT_SIZE = 24; // 15px ×1.5
const BODY_FONT_SIZE = 22; // 14px ×1.5
const HINT_FONT_SIZE = 18; // 11px ×1.5
const TYPE_DELAY_MS = 18;
const DEPTH = 250;

// Раскладка rich-реплик (DialogSegment[] — текст вперемешку с токенами «иконка + слово», см.
// src/dialogs/definitions.ts). Токены переносятся вручную по словам (аналог CampScene.layoutIconRow,
// только в потоке), печатаются не по символам, а по токенам — иконку нельзя допечатать наполовину.
const RICH_ICON = 20;
const RICH_ICON_GAP = 4;
const RICH_WORD_GAP = 6;
const RICH_LINE_H = 33;
const RICH_TYPE_DELAY_MS = 55;

type RichToken =
  | { kind: 'word'; text: string }
  | { kind: 'essence'; tier: EssenceTier; label: string }
  | { kind: 'item'; itemId: string; rarity: Rarity }
  | { kind: 'rarity'; rarity: Rarity; label: string };

function tokenizeSegments(segments: DialogSegment[]): RichToken[] {
  const tokens: RichToken[] = [];
  for (const seg of segments) {
    if ('text' in seg) {
      for (const w of seg.text.split(' ')) {
        if (w) tokens.push({ kind: 'word', text: w });
      }
    } else if ('essence' in seg) {
      tokens.push({ kind: 'essence', tier: seg.essence, label: seg.label });
    } else if ('item' in seg) {
      tokens.push({ kind: 'item', itemId: seg.item, rarity: seg.rarity });
    } else {
      tokens.push({ kind: 'rarity', rarity: seg.rarity, label: seg.label });
    }
  }
  return tokens;
}

/**
 * Реплика НПС: иконка персонажа слева, текст с посимвольной анимацией печати справа.
 * Первый клик по открытому диалогу доскролливает текст целиком, второй — закрывает (и
 * переходит к следующей реплике очереди, если она есть). Один инстанс на сцену (CampScene),
 * `show()` можно звать повторно — предыдущая очередь при этом обрывается.
 *
 * Реплика может быть обычной строкой (посимвольная печать, один цвет — как раньше) либо
 * DialogSegment[] (rich-режим: инлайновые иконки эссенции + цветные слова, печать по токенам).
 */
export class NpcDialogBox {
  private scene: Phaser.Scene;
  private tooltip: Tooltip;
  private queue: DialogEntry[] = [];
  private container?: Phaser.GameObjects.Container;
  private icon?: Phaser.GameObjects.Image;
  private nameText?: Phaser.GameObjects.Text;
  private bodyText?: Phaser.GameObjects.Text;
  private typeEvent?: Phaser.Time.TimerEvent;
  private fullText = '';
  private state: 'idle' | 'typing' | 'revealed' = 'idle';
  private onQueueEmpty?: () => void;

  // Ширина, в которую переносится текст реплики — общая и для word-wrap обычного bodyText,
  // и для ручного переноса rich-токенов.
  private wrapWidth = 0;

  // Rich-режим (DialogSegment[]): токены реплики хранятся сгруппированными по единицам показа
  // (слово — 1 объект, эссенция — [иконка, текст]) для почленной печати и общим списком — для очистки.
  private richMode = false;
  private richObjects: Phaser.GameObjects.GameObject[] = [];
  private richUnits: (Phaser.GameObjects.Text | Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle | ItemIconView)[][] = [];

  constructor(scene: Phaser.Scene, tooltip: Tooltip) {
    this.scene = scene;
    this.tooltip = tooltip;
  }

  isOpen(): boolean {
    return this.state !== 'idle';
  }

  /** Показывает реплики по очереди; `onDone` вызывается, когда очередь исчерпана и оверлей закрыт. */
  show(queue: DialogEntry[], onDone?: () => void) {
    if (queue.length === 0) return;
    this.container?.destroy(true);
    this.typeEvent?.remove();
    this.richObjects = [];
    this.richUnits = [];
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
    this.wrapWidth = CX + BOX_W / 2 - textX - 24;
    this.bodyText = this.scene.add.text(textX, boxY - BOX_H / 2 + 46, '', {
      fontSize: `${BODY_FONT_SIZE}px`, fontFamily: FONT_FAMILY, color: '#dddddd', lineSpacing: 8,
      wordWrap: { width: this.wrapWidth },
    });
    const hint = this.scene.add.text(CX + BOX_W / 2 - 14, boxY + BOX_H / 2 - 12, t('dialog_click_hint'), {
      fontSize: `${HINT_FONT_SIZE}px`, fontFamily: FONT_FAMILY, color: '#888888',
    }).setOrigin(1, 1);

    this.container = this.scene.add.container(0, 0, [overlay, box, iconFrame, this.icon, this.nameText, this.bodyText, hint])
      .setDepth(DEPTH);

    overlay.on('pointerdown', () => this.onClick());
    box.on('pointerdown', () => this.onClick());
  }

  /** Строит объекты rich-токенов реплики с ручным переносом строк, все со стартовой alpha=0. */
  // Иконка+слово (эссенция/предмет) дополнительно подчёркивается тонкой линией цвета редкости —
  // отличает «на это можно навести тултип» от обычных слов реплики. Ставится по финальным
  // label.x/y (после переноса строки), поэтому подчёркивание всегда точно под словом.
  private addUnderline(label: Phaser.GameObjects.Text, colorNum: number): Phaser.GameObjects.Rectangle {
    return this.scene.add
      .rectangle(label.x, label.y + label.height + 1, label.width, 2, colorNum)
      .setOrigin(0, 0).setAlpha(0);
  }

  private buildRich(segments: DialogSegment[]): { objs: Phaser.GameObjects.GameObject[]; units: (Phaser.GameObjects.Text | Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle | ItemIconView)[][] } {
    const textX = this.bodyText!.x;
    const textY = this.bodyText!.y;
    const tokens = tokenizeSegments(segments);
    const objs: Phaser.GameObjects.GameObject[] = [];
    const units: (Phaser.GameObjects.Text | Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle | ItemIconView)[][] = [];
    let cursorX = 0;
    let line = 0;

    for (const tok of tokens) {
      if (tok.kind === 'word') {
        const t = this.scene.add.text(0, 0, tok.text, {
          fontSize: `${BODY_FONT_SIZE}px`, fontFamily: FONT_FAMILY, color: '#dddddd',
        }).setAlpha(0);
        if (cursorX > 0 && cursorX + t.width > this.wrapWidth) { line++; cursorX = 0; }
        t.setPosition(textX + cursorX, textY + line * RICH_LINE_H);
        cursorX += t.width + RICH_WORD_GAP;
        objs.push(t);
        units.push([t]);
      } else if (tok.kind === 'essence') {
        const color = RARITY_HEX[tok.tier];
        const label = this.scene.add.text(0, 0, tok.label, {
          fontSize: `${BODY_FONT_SIZE}px`, fontFamily: FONT_FAMILY, color,
        }).setAlpha(0);
        const unitW = RICH_ICON + RICH_ICON_GAP + label.width;
        if (cursorX > 0 && cursorX + unitW > this.wrapWidth) { line++; cursorX = 0; }
        const iconY = textY + line * RICH_LINE_H + BODY_FONT_SIZE / 2;
        const icon = this.scene.add.image(textX + cursorX, iconY, essenceIconKey(tok.tier))
          .setDisplaySize(RICH_ICON, RICH_ICON).setOrigin(0, 0.5).setAlpha(0);
        label.setPosition(textX + cursorX + RICH_ICON + RICH_ICON_GAP, textY + line * RICH_LINE_H);
        const underline = this.addUnderline(label, RARITY_COLORS[tok.tier]);
        cursorX += unitW + RICH_WORD_GAP;
        objs.push(icon, label, underline);
        units.push([icon, label, underline]);
      } else if (tok.kind === 'item') {
        // Предмет: плашка редкости + иконка (как в инвентаре/тултипе), слово окрашено в цвет
        // редкости. Наведение на иконку+слово — тултип предмета (см. Tooltip.showItem).
        const { itemId, rarity } = tok;
        const label = this.scene.add.text(0, 0, itemDisplayName(itemId), {
          fontSize: `${BODY_FONT_SIZE}px`, fontFamily: FONT_FAMILY, color: RARITY_HEX[rarity],
        }).setAlpha(0);
        const unitW = RICH_ICON + RICH_ICON_GAP + label.width;
        if (cursorX > 0 && cursorX + unitW > this.wrapWidth) { line++; cursorX = 0; }
        const rowY = textY + line * RICH_LINE_H;
        const iconCenterY = rowY + BODY_FONT_SIZE / 2;
        const iconLeftX = textX + cursorX;
        const icon = addItemIcon(this.scene, iconLeftX + RICH_ICON / 2, iconCenterY, {
          itemId, rarity, size: RICH_ICON,
        }).setAlpha(0);
        label.setPosition(iconLeftX + RICH_ICON + RICH_ICON_GAP, rowY);
        const underline = this.addUnderline(label, RARITY_COLORS[rarity]);

        const hit = this.scene.add
          .rectangle(iconLeftX + unitW / 2, iconCenterY, unitW, RICH_LINE_H - 4, 0x000000, 0)
          .setInteractive({ useHandCursor: false });
        hit.on('pointerover', () => {
          this.tooltip.showItem({ item_id: itemId, rarity }, iconLeftX, rowY + RICH_LINE_H, this);
        });
        hit.on('pointerout', () => this.tooltip.hideFor(this));

        cursorX += unitW + RICH_WORD_GAP;
        objs.push(icon, label, underline, hit);
        units.push([icon, label, underline]);
      } else {
        // Просто слово, окрашенное в цвет редкости — без иконки/подчёркивания/тултипа
        // (реплика называет саму редкость, а не конкретный предмет/эссенцию).
        const t = this.scene.add.text(0, 0, tok.label, {
          fontSize: `${BODY_FONT_SIZE}px`, fontFamily: FONT_FAMILY, color: RARITY_HEX[tok.rarity],
        }).setAlpha(0);
        if (cursorX > 0 && cursorX + t.width > this.wrapWidth) { line++; cursorX = 0; }
        t.setPosition(textX + cursorX, textY + line * RICH_LINE_H);
        cursorX += t.width + RICH_WORD_GAP;
        objs.push(t);
        units.push([t]);
      }
    }
    return { objs, units };
  }

  private clearRich() {
    this.tooltip.hideFor(this);
    this.richObjects.forEach((o) => o.destroy());
    this.richObjects = [];
    this.richUnits = [];
  }

  private advance() {
    const entry = this.queue.shift();
    if (!entry) {
      this.close();
      return;
    }
    this.icon!.setTexture(NPC_TEXTURE[entry.npc]);
    this.nameText!.setText(npcName(entry.npc));
    this.typeEvent?.remove();
    this.clearRich();

    if (Array.isArray(entry.text)) {
      this.richMode = true;
      this.bodyText!.setText('');
      const { objs, units } = this.buildRich(entry.text);
      this.richObjects = objs;
      this.richUnits = units;
      this.container!.add(objs);
      this.state = units.length > 0 ? 'typing' : 'revealed';

      let shown = 0;
      this.typeEvent = this.scene.time.addEvent({
        delay: RICH_TYPE_DELAY_MS,
        repeat: Math.max(0, units.length - 1),
        callback: () => {
          units[shown]?.forEach((o) => o.setAlpha(1));
          shown++;
          if (shown >= units.length) this.state = 'revealed';
        },
      });
      return;
    }

    this.richMode = false;
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
      if (this.richMode) {
        this.richUnits.forEach((u) => u.forEach((o) => o.setAlpha(1)));
      } else {
        this.bodyText!.setText(this.fullText);
      }
      this.state = 'revealed';
      return;
    }
    if (this.state === 'revealed') this.advance();
  }

  private close() {
    this.typeEvent?.remove();
    this.clearRich();
    this.container?.destroy(true);
    this.container = undefined;
    this.state = 'idle';
    const cb = this.onQueueEmpty;
    this.onQueueEmpty = undefined;
    cb?.();
  }
}
