import { MetaStore } from './MetaStore';
import { getZoneFaction } from '../zones/registry';
import { isEssenceExchangeUnlocked, isFuseUnlocked } from '../items/craft';
import type { EssenceTier } from '../items/types';
import { FACTION_INFO, FACTION_GIFT, FACTION_RECOMMEND, SMITH_UNLOCK_DIALOG, FUSE_UNLOCK_DIALOG, TUTORIAL_REWARD_DIALOG } from '../dialogs/definitions';
import type { DialogEntry } from '../dialogs/definitions';

/**
 * Триггеры разовых реплик НПС (см. `src/ui/NpcDialogBox.ts` за рендером, `src/dialogs/definitions.ts`
 * за контентом). Каждая функция сама решает, показывать ли что-то (по `MetaStore.seen_npc_dialogs`),
 * и сама помечает диалог увиденным — вызывающему коду (`CampScene`) достаточно вызвать функцию и
 * показать очередь, если она непустая.
 */

/**
 * Первая смерть игрока в зоне фракции: реплика о боевой идентичности фракции, и вторым
 * сообщением — либо дарим стартовое контр-оружие (если его нигде нет: ни в сундуке, ни на
 * стойках), либо, если оно уже есть, советуем взять его на следующую вылазку.
 */
export function checkFactionDeathDialogs(zoneId: string | undefined): DialogEntry[] | null {
  if (!zoneId) return null;
  const faction = getZoneFaction(zoneId);
  if (!faction) return null;

  const dialogId = `faction_hint_${faction}`;
  if (MetaStore.hasSeenDialog(dialogId)) return null;
  MetaStore.markDialogSeen(dialogId);

  const queue: DialogEntry[] = [FACTION_INFO[faction]];
  const gift = FACTION_GIFT[faction];
  if (!MetaStore.hasItemAnywhere(gift.itemId)) {
    MetaStore.addToChest({ item_id: gift.itemId, rarity: gift.rarity });
    queue.push(gift.dialog);
  } else {
    queue.push(FACTION_RECOMMEND[faction]);
  }
  return queue;
}

/**
 * Награда за обучающую зону (training-camp) — одноразовая реплика Информатора сразу после
 * возврата в лагерь с MetaStore.tutorial_completed === true. В отличие от FACTION_GIFT, предмет
 * не условный (не зависит от того, что уже есть у игрока) — «Латы отчаяния» выдаются всегда,
 * это гарантированная, а не рекомендательная награда.
 */
export function checkTutorialRewardDialog(): DialogEntry[] | null {
  const dialogId = 'tutorial_reward';
  if (MetaStore.hasSeenDialog(dialogId)) return null;
  if (!MetaStore.get().tutorial_completed) return null;

  MetaStore.markDialogSeen(dialogId);
  MetaStore.addToChest({ item_id: 'desperate_plate', rarity: 'common' });
  return TUTORIAL_REWARD_DIALOG;
}

/** Первое открытие слияния у кузнеца (после трёх стартовых зон) — одноразовая реплика Кузнеца. */
export function checkFuseUnlockDialog(): DialogEntry[] | null {
  const dialogId = 'fuse_unlock';
  if (MetaStore.hasSeenDialog(dialogId)) return null;
  if (!isFuseUnlocked(MetaStore.get().completed_areas)) return null;

  MetaStore.markDialogSeen(dialogId);
  return [FUSE_UNLOCK_DIALOG];
}

// Тиры выше базового (uncommon) — у него обмена вниз нет (ESSENCE_EXCHANGE_TARGET.uncommon === null),
// поэтому «новый обмен» осмысленно появляется только с rare/epic.
const NON_BASE_TIERS: EssenceTier[] = ['rare', 'epic'];

/** Первое открытие обмена эссенции у кузнеца выше базового тира — одноразовая реплика Кузнеца. */
export function checkSmithUnlockDialog(): DialogEntry[] | null {
  const dialogId = 'smith_unlock';
  if (MetaStore.hasSeenDialog(dialogId)) return null;

  const completed = MetaStore.get().completed_areas;
  const unlocked = NON_BASE_TIERS.some((tier) => isEssenceExchangeUnlocked(tier, completed));
  if (!unlocked) return null;

  MetaStore.markDialogSeen(dialogId);
  return [SMITH_UNLOCK_DIALOG];
}
