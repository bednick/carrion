import { MetaStore } from './MetaStore';
import { EventBus } from './EventBus';
import { QUEST_DEFS, type QuestDef } from '../quests/definitions';

function applyInstantEffects(questId: string) {
  const def = QUEST_DEFS[questId];
  if (!def) return;
  for (const reward of def.rewards) {
    if (reward.type === 'unlock_area') {
      MetaStore.unlockArea(reward.areaId);
    } else if (reward.type === 'essence') {
      MetaStore.addEssence(reward.tier, reward.amount);
    }
  }
  if (def.next) {
    for (const nextId of def.next) {
      MetaStore.addActiveQuest(nextId, QUEST_DEFS[nextId]?.target ?? 1);
    }
  }
}

/**
 * Игрок нажал «Забрать» у Скупщика — только тут выдаётся сама награда (эссенция,
 * unlock_area) и следующие квесты из `next`. До этого момента квест лишь висит
 * в pending_reward: tryComplete переводит его туда при выполнении условия, но
 * эффекты не применяет — иначе награда «начисляется сама», не дожидаясь клика.
 */
export function claimQuestReward(questId: string) {
  if (!MetaStore.get().quests.pending_reward.includes(questId)) return;
  applyInstantEffects(questId);
  MetaStore.claimQuestReward(questId);
  EventBus.emit('quest_reward_claimed', questId);
}

function tryComplete(questId: string, amount = 1) {
  if (!MetaStore.isQuestActive(questId)) return;
  const done = MetaStore.progressQuest(questId, amount);
  if (done) {
    MetaStore.moveToPendingReward(questId);
    EventBus.emit('quest_completed', questId);
  }
}

/** Текущее значение stat-условия (по конкретному id или сумма по всем id). */
function statConditionValue(c: Extract<NonNullable<QuestDef['condition']>, { kind: 'stat' }>): number {
  const bucket = MetaStore.get().stats[c.stat];
  if (c.id) return bucket[c.id] ?? 0;
  return Object.values(bucket).reduce((sum, n) => sum + n, 0);
}

/**
 * Сверяет все активные квесты (stat- и zone_items-условия) против текущей статистики и
 * засчитывает выполненные. Срабатывает и задним числом — при выдаче квеста
 * ('quest_granted') и при любом изменении статов ('stats_changed').
 */
function evaluateQuests() {
  const carriedOut = MetaStore.get().stats.items_carried_out;
  // Копия: tryComplete мутирует список активных (и может выдать следующий квест).
  for (const q of [...MetaStore.get().quests.active]) {
    const def = QUEST_DEFS[q.id];
    if (!def?.condition) continue;

    if (def.condition.kind === 'stat') {
      if (statConditionValue(def.condition) >= (def.condition.count ?? 1)) {
        tryComplete(q.id);
      }
    } else {
      const have = def.condition.itemIds.filter((id) => (carriedOut[id] ?? 0) > 0).length;
      if (have > q.progress) {
        tryComplete(q.id, have - q.progress);
      }
    }
  }
}

let initialized = false;

export function initQuestSystem() {
  // Каждый заход в лагерь пересверяет квесты (могли выполниться вне лагеря
  // или ещё до того, как стали stat-зависимыми).
  evaluateQuests();

  // Слушателей EventBus регистрируем один раз: шина глобальна и переживает
  // перезапуски сцен, иначе обработчики дублировались бы.
  if (initialized) return;
  initialized = true;

  EventBus.on('stats_changed', evaluateQuests);
  EventBus.on('quest_granted', evaluateQuests);

  EventBus.on('item_equipped', () => {
    tryComplete('tutorial_equip');
  });

  EventBus.on('item_disassembled', () => {
    tryComplete('tutorial_disassemble');
  });

  // Зональные квесты (<zone>_clear) засчитываются через stat-условие
  // zones_returned в evaluateQuests (растёт при добивании босса зоны).
  // Квесты сбора (collect_<zone>_items) — через zone_items-условие там же.
}
