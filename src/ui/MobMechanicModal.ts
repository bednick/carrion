import Phaser from 'phaser';
import { FONT_FAMILY } from './theme';
import { CX, GAME_W, GAME_H } from './layout';
import { MetaStore } from '../core/MetaStore';
import { MOB_MECHANIC_DEFS, MOB_MECHANIC_COLOR_NUM, mobMechanicIconKey, type MechanicId } from './mobMechanics';
import { mechanicTitle, mechanicDescription } from '../i18n/content';
import { t } from '../i18n/t';

/** Управление боем со стороны владельца окна — чтобы модалка не знала про ExpeditionScene. */
export interface MobMechanicModalHooks {
  pause(): void;
  resume(): void;
  isPaused(): boolean;
  /** Погасить тултип гнезда: окно открывается по клику ровно по тому объекту, на котором он висит. */
  hideTooltip(): void;
}

// Выше диалога отступления (200) и плавающих чисел (300/320), ниже тултипа (400) — см. docs/ui.md.
const DEPTH = 260;

const BOX_W = 460;
const BOX_H = 300;
const BOX_CY = 400; // центр арены, как у диалога отступления

/**
 * Пояснение к механике моба (уворот/блок/защита/шипы/призыв/фаза).
 *
 * Два входа:
 *  - `queueFirstTime` — механика встретилась игроку впервые за сейв: бой встаёт на паузу, окна
 *    показываются по очереди, пауза снимается после последнего. Факт показа пишется в мету
 *    (`MetaStore.markMechanicSeen`) при ЗАКРЫТИИ, а не при открытии: если сцена перезапустится с
 *    открытым окном (F11 → ExpeditionScene.relayoutOnResize), пояснение не потеряется — враги
 *    пересоберутся и триггер сработает заново.
 *  - `showOnDemand` — игрок сам кликнул по загоревшемуся гнезду механики: бой НЕ останавливается.
 *
 * Закрытие — клик по любому месту экрана, а также ESC/SPACE (см. конструктор): интерактивен
 * только полноэкранный оверлей, коробка и тексты не перехватывают ввод, поэтому клик по ним
 * доходит до оверлея. Отдельной кнопки нет.
 *
 * Без твинов и без `this.time`: при паузе часы сцены заморожены (ExpeditionScene.pause), а
 * анимировать появление незачем.
 */
export class MobMechanicModal {
  private container: Phaser.GameObjects.Container | null = null;
  private queue: MechanicId[] = [];
  // Ставили ли паузу мы сами. Если игрок нажал паузу до окна — не снимаем её при закрытии
  // (тот же приём, что в ExpeditionScene.confirmRetreat).
  private pausedByUs = false;
  private currentId: MechanicId | null = null;
  private currentFromQueue = false;

  constructor(private scene: Phaser.Scene, private hooks: MobMechanicModalHooks) {
    // Регистрируется после ExpeditionScene.keydown-SPACE (тот создаётся в create() раньше, чем
    // this.mechanicModal в buildUI()) — сцена успевает проверить isOpen() ещё до того, как этот
    // хэндлер закроет окно, и не переключит паузу поверх закрывающегося окна.
    const closeIfOpen = () => { if (this.isOpen()) this.closeCurrent(); };
    this.scene.input.keyboard?.on('keydown-ESC', closeIfOpen);
    this.scene.input.keyboard?.on('keydown-SPACE', closeIfOpen);
  }

  isOpen(): boolean {
    return this.container !== null;
  }

  /** Первая за сейв встреча с механиками `ids` — очередь окон с паузой боя. */
  queueFirstTime(ids: MechanicId[]) {
    if (ids.length === 0) return;
    for (const id of ids) {
      if (!this.queue.includes(id)) this.queue.push(id);
    }
    if (this.container) return; // окно уже висит — следующее откроется при его закрытии
    this.openNextFromQueue();
  }

  /** Клик по гнезду механики: перечитать пояснение, не останавливая бой. */
  showOnDemand(id: MechanicId) {
    if (this.container) return;
    this.open(id, false);
  }

  destroy() {
    this.container?.destroy(true);
    this.container = null;
    this.currentId = null;
    this.queue = [];
    this.pausedByUs = false;
  }

  /**
   * Единственная точка перехода между окнами. Зовётся и на закрытии окна очереди, и на закрытии
   * окна «по клику»: пока последнее висит, бой идёт, и подошедший саммон мог поставить в очередь
   * незнакомую механику — её нельзя оставить непоказанной.
   */
  private openNextFromQueue() {
    const id = this.queue.shift();
    if (id === undefined) {
      if (this.pausedByUs) {
        this.pausedByUs = false;
        this.hooks.resume();
      }
      return;
    }
    // Пауза ставится ровно перед первым окном очереди (не в момент постановки в очередь): к этому
    // моменту игрок мог поставить её сам — тогда мы её и не снимем.
    if (!this.hooks.isPaused()) {
      this.hooks.pause();
      this.pausedByUs = true;
    }
    this.open(id, true);
  }

  private open(id: MechanicId, fromQueue: boolean) {
    this.hooks.hideTooltip();
    const def = MOB_MECHANIC_DEFS[id];
    const colorNum = MOB_MECHANIC_COLOR_NUM[id];

    const c = this.scene.add.container(0, 0).setDepth(DEPTH);
    const overlay = this.scene.add.rectangle(CX, GAME_H / 2, GAME_W, GAME_H, 0x000000, 0.72).setInteractive();
    const box = this.scene.add.rectangle(CX, BOX_CY, BOX_W, BOX_H, 0x1a1a2a).setStrokeStyle(2, colorNum);

    const icon = this.scene.add.image(CX, BOX_CY - 86, mobMechanicIconKey(id)).setDisplaySize(96, 96);
    const title = this.scene.add.text(CX, BOX_CY - 18, mechanicTitle(id), {
      fontSize: '22px', fontFamily: FONT_FAMILY, color: def.color,
    }).setOrigin(0.5);
    const desc = this.scene.add.text(CX, BOX_CY + 30, mechanicDescription(id), {
      fontSize: '16px', fontFamily: FONT_FAMILY, color: '#cccccc', align: 'center',
      wordWrap: { width: BOX_W - 80 },
    }).setOrigin(0.5);
    // Окно даёт только правило; числа (сколько именно брони, какой шанс блока) — в тултипе
    // конкретного моба, см. docs/ui.md «Тултипы».
    const numbersHint = this.scene.add.text(CX, BOX_CY + BOX_H / 2 - 50, t('mob_mechanic_hover_hint'), {
      fontSize: '14px', fontFamily: FONT_FAMILY, color: '#999999', align: 'center',
      wordWrap: { width: BOX_W - 60 },
    }).setOrigin(0.5);
    const hint = this.scene.add.text(CX, BOX_CY + BOX_H / 2 - 24, t('mob_mechanic_continue_hint'), {
      fontSize: '12px', fontFamily: FONT_FAMILY, color: '#777777',
    }).setOrigin(0.5);

    c.add([overlay, box, icon, title, desc, numbersHint, hint]);
    this.container = c;
    this.currentId = id;
    this.currentFromQueue = fromQueue;

    overlay.on('pointerdown', () => this.closeCurrent());
  }

  private closeCurrent() {
    if (!this.container) return;
    if (this.currentFromQueue && this.currentId !== null) MetaStore.markMechanicSeen(this.currentId);
    this.container.destroy(true);
    this.container = null;
    this.currentId = null;
    this.openNextFromQueue();
  }
}
