import Phaser from 'phaser';

export type FloaterType = 'damage' | 'heal' | 'essence' | 'gold' | 'miss' | 'block' | 'absorb';

export interface FloaterEvent {
  type: FloaterType;
  value: number;
  x: number;
  y: number;
}

export const EventBus = new Phaser.Events.EventEmitter();
