/**
 * UI-хром на обоих языках. Один ключ — одна запись `{ ru, en }`, поэтому пара переводов не может
 * разъехаться по разным файлам. Интерполяция — плейсхолдеры `{param}` в самой строке, подставляются
 * в `t()` (см. `src/i18n/t.ts`). Ключи сгруппированы по сцене/компоненту-источнику.
 */
export const UI: Record<string, { ru: string; en: string }> = {
  // ── dialogs (NpcDialogBox) ──────────────────────────────────────────
  npc_dealer: { ru: 'Информатор', en: 'Informant' },
  npc_smith: { ru: 'Кузнец', en: 'Smith' },
  dialog_click_hint: { ru: '(клик)', en: '(click)' },

  // ── tooltip (Tooltip.ts) ────────────────────────────────────────────
  tooltip_slots: { ru: 'Слоты', en: 'Slots' },

  // ── mob mechanic modal (MobMechanicModal.ts) ───────────────────────
  mob_mechanic_hover_hint: { ru: 'Для точных значений наведись на противника', en: 'Hover the enemy for exact numbers' },
  mob_mechanic_continue_hint: { ru: 'клик — продолжить', en: 'click to continue' },

  // ── quest tracker (QuestTracker.ts) ─────────────────────────────────
  quest_tracker_pending_reward: { ru: '★ Заберите награду у Информатора ({count})', en: '★ Claim your reward from the Informant ({count})' },

  // ── item/mob stat labels — общий закрытый словарь, см. item-tooltips skill ─────────
  stat_damage: { ru: 'Урон', en: 'Damage' },
  stat_interval: { ru: 'Перезарядка', en: 'Recharge' },
  stat_armor: { ru: 'Броня', en: 'Armor' },
  stat_dodge: { ru: 'Уклон', en: 'Dodge' },
  stat_block: { ru: 'Блок', en: 'Block' },
  stat_thorns: { ru: 'Шипы', en: 'Thorns' },

  // ── expedition (ExpeditionScene.ts) ─────────────────────────────────
  expedition_starter_weapon_granted: { ru: 'Оружия не осталось — выдан {item}', en: 'Out of weapons — {item} granted' },
  expedition_zone_curse_title: { ru: 'Уровень проклятья зоны', en: 'Zone curse level' },
  expedition_zone_curse_desc: { ru: 'Входящий по персонажу урон увеличен на {pct}%', en: 'Incoming damage to your character increased by {pct}%' },
  expedition_fight_counter_unknown: { ru: 'Бой {cur} из ???', en: 'Fight {cur} of ???' },
  expedition_boss_fight: { ru: 'Босс локации!', en: 'Area boss!' },
  expedition_fight_counter: { ru: 'Бой {cur} / {total}', en: 'Fight {cur} / {total}' },
  expedition_hero_placeholder_letter: { ru: 'С', en: 'W' },
  expedition_panel_backpack: { ru: 'Рюкзак', en: 'Backpack' },
  expedition_panel_equipment: { ru: 'Экипировка', en: 'Equipment' },
  expedition_panel_mechanics: { ru: 'Механики', en: 'Mechanics' },
  expedition_stand_empty: { ru: 'Стойка пуста', en: 'Loadout empty' },
  expedition_stand_switched: { ru: 'Стойка {n}', en: 'Loadout {n}' },
  expedition_retreat_to_camp: { ru: 'В лагерь', en: 'To camp' },
  expedition_curse_readout: { ru: 'Проклятие: {pct}%', en: 'Curse: {pct}%' },
  expedition_retreat_confirm_title: { ru: 'Вернуться в лагерь?', en: 'Return to camp?' },
  expedition_retreat_confirm_sub_endless: { ru: 'Собранный лут сохранится.\nРекорд глубины засчитается.', en: 'Your loot will be kept.\nThe depth record will count.' },
  expedition_retreat_confirm_sub_normal: { ru: 'Собранный лут сохранится.\nЗона не будет зачтена.', en: 'Your loot will be kept.\nThe area will not be cleared.' },
  expedition_stay: { ru: 'Остаться', en: 'Stay' },
  expedition_walking_status: { ru: 'Персонаж идёт к следующему врагу...', en: 'The character is walking to the next enemy...' },
  expedition_hero_died_status: { ru: 'Герой пал! Лут сохранён.', en: 'The hero has fallen! Loot saved.' },
  expedition_you_died: { ru: 'Ты пал', en: 'You died' },
  expedition_mobs_killed: { ru: 'Убито мобов: {n}', en: 'Mobs killed: {n}' },
  expedition_new_record: { ru: 'Новый рекорд!', en: 'New record!' },
  expedition_zone_record: { ru: 'Рекорд зоны: {n}', en: 'Zone record: {n}' },
  expedition_victory_choose_reward: { ru: 'Победа! Выбери награду', en: 'Victory! Choose a reward' },
  expedition_essence: { ru: 'Эссенция', en: 'Essence' },

  // ── essence / rarity words (ResourceHUD.ts, CampScene.ts dealer panel) ──────────────
  // Именительный, ж.р., строчная — «необычная эссенция».
  essence_uncommon: { ru: 'необычная', en: 'uncommon' },
  essence_rare: { ru: 'редкая', en: 'rare' },
  essence_epic: { ru: 'эпическая', en: 'epic' },
  essence_title: { ru: '{tier} эссенция', en: '{tier} Essence' },
  essence_upgrade_desc: { ru: 'Позволяет улучшить предмет до {tier} уровня редкости', en: 'Lets you upgrade an item to {tier} rarity level' },
  // Родительный, муж.р. — «до необычного уровня».
  rarity_genitive_uncommon: { ru: 'необычного', en: 'uncommon' },
  rarity_genitive_rare: { ru: 'редкого', en: 'rare' },
  rarity_genitive_epic: { ru: 'эпического', en: 'epic' },

  // ── camp: dealer exchange (CampScene.ts) ────────────────────────────
  dealer_exchange_button: { ru: 'Обменять', en: 'Exchange' },
  dealer_exchange_locked_title: { ru: 'Обмен закрыт', en: 'Exchange locked' },
  dealer_exchange_locked_prefix: { ru: 'Сначала пройти ', en: 'First complete an ' },
  dealer_exchange_locked_suffix: { ru: ' область', en: ' area' },
  // Винительный, ж.р. — «пройти необычную область».
  exchange_locked_area_uncommon: { ru: 'Необычную', en: 'Uncommon' },
  exchange_locked_area_rare: { ru: 'Редкую', en: 'Rare' },
  exchange_locked_area_epic: { ru: 'Эпическую', en: 'Epic' },

  // ── camp: toast messages (CampScene.showMessage) ────────────────────
  msg_wrong_slot: { ru: 'Не тот слот', en: 'Wrong slot' },
  msg_slot_occupied: { ru: 'Слот занят', en: 'Slot occupied' },
  msg_exchange_not_open: { ru: 'Обмен ещё не открыт!', en: 'Exchange not open yet!' },
  msg_not_enough_essence: { ru: 'Недостаточно эссенции!', en: 'Not enough essence!' },
  msg_no_suitable_slots: { ru: 'Все подходящие слоты заняты', en: 'All suitable slots are occupied' },
  msg_rarity_must_match: { ru: 'Редкость должна совпадать', en: 'Rarity must match' },
  msg_quest_completed: { ru: 'Задание выполнено: {title}! Заберите награду у Информатора', en: 'Quest completed: {title}! Claim your reward from the Informant' },

  // ── camp: HUD / reset (CampScene.ts) ────────────────────────────────
  camp_title: { ru: 'Лагерь', en: 'Camp' },
  camp_reset_data: { ru: 'Сброс данных', en: 'Reset data' },
  camp_balance_tool: { ru: 'Баланс-тул', en: 'Balance tool' },
  camp_fill_chest: { ru: 'Все предметы', en: 'Fill chest' },
  camp_font_tool: { ru: 'Шрифты', en: 'Fonts' },
  camp_reset_confirm_text: { ru: '⚠ Сбросить весь прогресс? ⚠\n\n⚠⚠⚠ Действие необратимо! ⚠⚠⚠', en: '⚠ Reset all progress? ⚠\n\n⚠⚠⚠ This cannot be undone! ⚠⚠⚠' },
  camp_reset_confirm_yes: { ru: 'Сбросить', en: 'Reset' },
  camp_reset_confirm_no: { ru: 'Отмена', en: 'Cancel' },
  camp_go_expedition: { ru: 'В поход', en: 'Go on expedition' },
  camp_flutist_hover: { ru: 'Флейтист — громкость музыки', en: 'Flutist — music volume' },
  camp_music_label: { ru: 'Музыка', en: 'Music' },
  camp_chest_hover: { ru: 'Сундук и стойки', en: 'Chest & loadouts' },
  quest_ready_to_claim: { ru: 'Готово — забрать награду:', en: 'Ready — claim reward:' },
  quest_done: { ru: 'Выполнено', en: 'Done' },
  quest_claim: { ru: 'Забрать', en: 'Claim' },
  quest_none_active: { ru: 'Нет активных заданий', en: 'No active quests' },

  // ── craft/fuse (src/items/craft.ts, CampScene.ts) ───────────────────
  craft_error_add_item: { ru: 'Добавьте предмет', en: 'Add an item' },
  craft_error_single_item_only: { ru: 'Улучшается один предмет', en: 'Only one item can be upgraded' },
  craft_error_already_legendary: { ru: 'Легендарный — выше некуда', en: 'Legendary — nowhere higher to go' },
  craft_error_legendary_find_only: { ru: 'Легендарное только находится', en: 'Legendary can only be found' },
  craft_error_need_n_items: { ru: 'Нужно {count} предмета', en: 'Need {count} items' },
  craft_error_already_legendary_fuse: { ru: 'Уже легендарный — выше некуда', en: 'Already legendary — nowhere higher to go' },
  camp_fuse_description: { ru: 'Слияние: {count} предмета одной редкости → 1 следующей', en: 'Fuse: {count} items of one rarity → 1 of the next' },
  camp_fuse_button: { ru: 'Слить', en: 'Fuse' },
  camp_fuse_locked_hint: { ru: 'Слияние откроется после трёх стартовых зон (по одной от каждой фракции)', en: 'Fusing unlocks after the three starting areas (one per faction)' },
  camp_take_result_hint: { ru: 'Заберите результат из ячейки справа', en: 'Take the result from the slot on the right' },
  camp_upgrade_button: { ru: 'Улучшить', en: 'Upgrade' },
  camp_chest_title: { ru: 'Сундук', en: 'Chest' },
  camp_map_title: { ru: 'Карта', en: 'Map' },

  // ── camp: map zone nodes (CampScene.buildMapZoneNode) ───────────────
  camp_zone_wip: { ru: 'В разработке', en: 'In development' },
  camp_zone_cleared: { ru: '✓ Пройдена', en: '✓ Cleared' },
  camp_center_locked_need_zones: { ru: '🔒 нужны 3 зоны', en: '🔒 needs 3 areas' },
  camp_center_locked_title: { ru: 'Центр закрыт', en: 'Center locked' },
  camp_center_locked_l1: { ru: 'Пройди {a}, {b}', en: 'Clear {a}, {b}' },
  camp_center_locked_l2: { ru: 'и {c}', en: 'and {c}' },
  camp_zone_locked_prev: { ru: '🔒 пройди прошлую', en: '🔒 clear the previous one' },
  camp_locked_title: { ru: 'Заблокировано', en: 'Locked' },
  camp_locked_prev_hint: { ru: 'Сначала пройди: {zone}', en: 'First clear: {zone}' },
  camp_zone_locked_claim: { ru: '🔒 забери награду у Информатора', en: '🔒 claim reward from the Informant' },
  camp_zone_locked_collect: { ru: '🔒 собери предметы {progress}/{target}', en: '🔒 collect items {progress}/{target}' },
  camp_locked_reward_ready: { ru: 'Награда уже готова — забери её у Информатора', en: 'Reward is ready — claim it from the Informant' },
  camp_locked_collect_hint: { ru: 'Собери в «{zone}» все предметы ({progress}/{target})', en: 'Collect every item in "{zone}" ({progress}/{target})' },
  camp_zone_best_record: { ru: 'Рекорд: {n}', en: 'Record: {n}' },

  // ── floating combat text (Floater.ts) ────────────────────────────────
  floater_miss: { ru: 'промах', en: 'miss' },
  floater_counter: { ru: 'Контрудар!', en: 'Counter!' },
  floater_invuln: { ru: 'Неуязвимость!', en: 'Invulnerable!' },

  // ── sound settings panel (SoundSettingsButton.ts) ───────────────────
  sound_master: { ru: 'Общая', en: 'Master' },
  sound_ambient: { ru: 'Окружение', en: 'Ambient' },
  sound_sfx: { ru: 'Эффекты', en: 'SFX' },
  sound_panel_title: { ru: 'Звук', en: 'Sound' },
  sound_mute: { ru: 'Без звука', en: 'Mute' },

  // ── preload (PreloadScene.ts) ────────────────────────────────────────
  preload_loading: { ru: 'Загрузка...', en: 'Loading...' },

  // ── item tooltip stat labels (src/items/*/behavior.ts) — общий закрытый словарь,
  // см. docs/content.items*.md / скилл item-tooltips. Продолжение stat_* из блока выше. ──
  stat_defense: { ru: 'Защита', en: 'Defense' },
  stat_attack_speed: { ru: 'Скорость атаки', en: 'Attack speed' },
  stat_crit_chance: { ru: 'Шанс крита', en: 'Crit chance' },
  stat_crit_mult: { ru: 'Множитель крита', en: 'Crit multiplier' },
  stat_bonus_crit_chance: { ru: 'Доп. крит-шанс', en: 'Bonus crit chance' },
  stat_bonus_crit_damage: { ru: 'Доп. крит-урон', en: 'Bonus crit damage' },
  stat_counter: { ru: 'Контрудар', en: 'Counter' },
  stat_hits_per_attack: { ru: 'Ударов за атаку', en: 'Hits per attack' },
  stat_splash_damage_up_to: { ru: 'Сплеш урон до {pct}%', en: 'Splash damage up to {pct}%' },
  stat_pierce_behind_target: { ru: 'Наносит урон стоящему за целью противнику', en: 'Also damages the enemy standing behind the target' },
  stat_heal_chance_per_hit: { ru: 'Шанс лечения за удар: {chance}% (+{amount} HP)', en: 'Heal chance per hit: {chance}% (+{amount} HP)' },
  stat_heal_on_kill: { ru: 'Лечение за убийство: {amount} HP ({charges} раз за забег)', en: 'Heal on kill: {amount} HP ({charges} times per run)' },
  stat_first_hit_faster: { ru: 'Первый удар боя быстрее: −{pct}%', en: 'First hit of the fight is faster: −{pct}%' },
  stat_invuln_per_run: { ru: 'Неуязвимость: {hits} уд. за забег', en: 'Invulnerable: {hits} hits per run' },
  stat_emergency_heal: { ru: 'Аварийный хил при HP < {threshold}%: {amount} HP (раз за забег)', en: 'Emergency heal below {threshold}% HP: {amount} HP (once per run)' },
  stat_conditional_defense: { ru: 'Защита при HP < {threshold}%: {pct}%', en: 'Defense below {threshold}% HP: {pct}%' },
};
