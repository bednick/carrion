# Промпт: Лагерь (CampScene)

## Технические параметры

| Параметр    | Значение                                |
|-------------|-----------------------------------------|
| Сцена       | CampScene — статичный полноэкранный фон |
| Размер      | 1280×800                                |
| Соотношение | 16:10                                   |
| Слоёв       | 1 (статика)                             |
| Midjourney  | `--ar 16:10`                            |

## Описание сцены

Лагерь игрока у края поля после крупного сражения. Ночь или поздние сумерки.
Персонажи (кузнец, скупщик, герой у костра) — **не включать**, они добавляются движком поверх.
Фон должен читаться как место: земля, дальний план, небо.

Левая треть — место кузнеца (темновато, кирпичная кладка или деревянный навес).
Центр — место костра (слегка освещено тёплым огнём снизу, земля вытоптана).
Правая треть — место скупщика (навес или повозка, фонарь или факел).

## Промпт (английский)

```
pixel art dark fantasy camp background, post-war encampment at the edge of a battlefield,
late dusk or overcast night, no people or characters,
left side: stone forge or wooden smithing shelter with glowing embers,
center: cleared dirt ground for campfire, scorched ring in earth, warm light source from below,
right side: merchant wagon or covered stall with hanging lantern,
background: silhouettes of dead trees, ruined stone wall fragments, distant foggy battlefield,
collapsed fence and scattered crates along edges, muddy worn ground,
dark desaturated color palette, cold blue-gray ambient light with warm orange fire glow in center,
pixel art RPG camp environment, grim atmosphere, 16-bit style, no UI no text no characters,
hand-crafted pixel art background art
--ar 16:10 --style raw --v 6.1 --q 2
--no people warriors monsters characters animals text logos UI buttons
```

## Цветовые ориентиры

- Небо: тёмно-синий/серый (#1a1a2e — цвет фона игры)
- Земля: тёмно-коричневый, мокрый грунт
- Свет костра: тёплый оранжевый (#cc6600), только в центре
- Факелы/фонари: слабый жёлтый по краям
- Деревья/руины вдали: почти силуэты, тёмно-серый
