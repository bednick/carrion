import { MetaStore } from './MetaStore';
import { EventBus } from './EventBus';
import { QUEST_DEFS, type QuestDef } from '../quests/definitions';

function applyInstantEffects(questId: string) {
  const def = QUEST_DEFS[questId];
  if (!def) return;
  for (const reward of def.rewards) {
    if (reward.type === 'unlock_area' && reward.areaId) {
      MetaStore.unlockArea(reward.areaId);
    }
  }
  if (def.next) {
    for (const nextId of def.next) {
      MetaStore.addActiveQuest(nextId, QUEST_DEFS[nextId]?.target ?? 1);
    }
  }
}

export function claimQuestReward(questId: string) {
  const def = QUEST_DEFS[questId];
  if (!def) return;
  for (const reward of def.rewards) {
    if (reward.type === 'gold' && reward.value) {
      MetaStore.addGold(reward.value);
      EventBus.emit('floater', { type: 'gold', value: reward.value, x: 640, y: 400 });
    }
  }
  MetaStore.claimQuestReward(questId);
  EventBus.emit('quest_reward_claimed', questId);
}

function tryComplete(questId: string) {
  if (!MetaStore.isQuestActive(questId)) return;
  const done = MetaStore.progressQuest(questId);
  if (done) {
    applyInstantEffects(questId);
    MetaStore.moveToPendingReward(questId);
    EventBus.emit('quest_completed', questId);
  }
}

/** Текущее значение stat-условия (по конкретному id или сумма по всем id). */
function conditionValue(c: NonNullable<QuestDef['condition']>): number {
  const bucket = MetaStore.get().stats[c.stat];
  if (c.id) return bucket[c.id] ?? 0;
  return Object.values(bucket).reduce((sum, n) => sum + n, 0);
}

/**
 * Сверяет все активные квесты со stat-условием против текущей статистики и
 * засчитывает выполненные. Срабатывает и задним числом — при выдаче квеста
 * ('quest_granted') и при любом изменении статов ('stats_changed').
 */
function evaluateStatQuests() {
  // Копия: tryComplete мутирует список активных (и может выдать следующий квест).
  for (const q of [...MetaStore.get().quests.active]) {
    const def = QUEST_DEFS[q.id];
    if (!def?.condition) continue;
    if (conditionValue(def.condition) >= (def.condition.count ?? 1)) {
      tryComplete(q.id);
    }
  }
}

let initialized = false;

export function initQuestSystem() {
  // Каждый заход в лагерь пересверяет stat-квесты (могли выполниться вне лагеря
  // или ещё до того, как стали stat-зависимыми).
  evaluateStatQuests();

  // Слушателей EventBus регистрируем один раз: шина глобальна и переживает
  // перезапуски сцен, иначе обработчики дублировались бы.
  if (initialized) return;
  initialized = true;

  EventBus.on('stats_changed', evaluateStatQuests);
  EventBus.on('quest_granted', evaluateStatQuests);

  EventBus.on('item_equipped', () => {
    tryComplete('tutorial_equip');
  });

  EventBus.on('item_sold', () => {
    tryComplete('tutorial_sell');
  });

  EventBus.on('item_disassembled', () => {
    tryComplete('tutorial_disassemble');
  });

  // Зональные квесты (<zone>_clear) засчитываются через stat-условие
  // zones_returned в evaluateStatQuests (растёт при добивании босса зоны).
}
