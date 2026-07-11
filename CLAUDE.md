# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Команды

```bash
npm run dev      # дев-сервер → http://localhost:5173 (hot reload)
npm run build    # tsc + vite build → dist/
npm run preview  # превью production-сборки
```

Тестов и линтера нет — проверка через браузер на http://localhost:5173.

## Документация проекта

Все решения по дизайну, механикам и архитектуре зафиксированы в `docs/`. Перед любой реализацией сверяйся с этими
файлами.

| Файл                                                               | Содержание                                                                  |
|--------------------------------------------------------------------|-----------------------------------------------------------------------------|
| [`docs/concept.md`](docs/concept.md)                               | Жанр, сеттинг, три фракции, основной цикл игры, тон                         |
| [`docs/mechanics.md`](docs/mechanics.md)                           | Экспедиция, бой, крафт, инвентарь, прогрессия                               |
| [`docs/content.md`](docs/content.md)                               | Персонажи, все 10 зон карты, мобы, предметы, лагерь                         |
| [`docs/content.mobs.format.md`](docs/content.mobs.format.md)       | Json-формат мобов: attacks, summons, phases, лут                            |
| [`docs/content.zones.format.md`](docs/content.zones.format.md)     | Json-формат зон: mob_pool, boss-ссылка, награда                             |
| [`docs/meta-progression.md`](docs/meta-progression.md)             | Ресурсы (золото/металл), персистентность, localStorage-схема                |
| [`docs/ui.md`](docs/ui.md)                                         | Все экраны: лагерь, карта, экспедиция, лента лута, эффекты                  |
| [`docs/art-spec.md`](docs/art-spec.md)                             | Размеры спрайтов, анимации, paper doll / оверлеи экипировки                 |
| [`docs/factions.md`](docs/factions.md)                             | Боевая идентичность фракций: доминанты, контр-механики героя, матрица       |
| [`docs/quests.md`](docs/quests.md)                                 | Квесты: обучающие, зональные цепочки, коллекционные                         |
| [`docs/content.items.md`](docs/content.items.md)                   | Предметы: правила R1–R9, слоты (роли, архетипы), теги, модель синергий      |
| [`docs/content.items.legs.md`](docs/content.items.legs.md)         | Обувь (слот legs): политика семейства, полюса мародёры/гонец, предметы      |
| [`docs/content.items.hand_right.md`](docs/content.items.hand_right.md) | Оружие (слот hand_right): формы урона, архетипы, характеристики, предметы |
| [`docs/combat-events.md`](docs/combat-events.md)                   | Событийная модель боя: типы событий, replace/spawn, диспетчер, attack_ready |
| [`docs/roadmap.md`](docs/roadmap.md)                               | Запланированный, но не реализованный функционал (механики «на вырост»)      |
| [`docs/concept_map.svg`](docs/concept_map.svg)                     | Визуальная схема карты с зонами и фракциями                                 |
| [`docs/zones/`](docs/zones/)                                       | Детальный контент каждой из 10 зон (мобы, предметы, лут)                    |

## Стек

- **Phaser 3** — игровой движок
- **TypeScript** — язык
- **Vite** — сборщик

## Ключевые архитектурные решения

### Сцены

Финальная архитектура сцен описана в `docs/ui.md`.

### Разрешение

Адаптивное через Phaser Scale Manager (`FIT`).
Логика позиционирования — в относительных координатах, не в абсолютных пикселях.

### Персонажи и экипировка (paper doll)

Три персонажа (Бродяга, Силач, Подмастерье) используют единый шаблон кадра.
Оверлеи экипировки — общие для всех персонажей. Подробности в `docs/art-spec.md`.

### Персистентность

`localStorage`, ключ `carrion.meta.v1`. Схема JSON описана в `docs/meta-progression.md`. Все ключи в json-конфигах
(мобы, зоны, предметы) и в персисте — `snake_case`.

Версионирование схемы пока не поддерживается (игра только локальная). Несовместимые изменения формата меты допустимы
без бампа ключа — нужно лишь явно описать правку и попросить сбросить прогресс. Подробнее — `docs/meta-progression.md`.
