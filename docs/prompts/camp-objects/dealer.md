# Промпт: Скупщик (Dealer NPC)

## Технические параметры

| Параметр               | Значение                                                        |
|------------------------|-----------------------------------------------------------------|
| Позиция в лагере       | x=1120, y=480 (правая треть)                                    |
| Размер спрайта         | 64×96 px на кадр                                                |
| Анимации               | `idle` (6 кадров), опционально `interest` (3–4 кадра при hover) |
| Спрайт-лист            | горизонтальный: все кадры idle в одну строку → 384×96 px        |
| Midjourney (лист)      | `--ar 4:1`                                                      |
| Midjourney (один кадр) | `--ar 2:3`                                                      |

## Описание персонажа

Скупщик — худощавый, юркий торговец с хитрым взглядом. Одет богаче кузнеца,
но всё равно потрёпано. Плащ, капюшон или широкополая шляпа. Торгует информацией,
скупает трофеи. Подозрительный, но не враждебный.

Расположен **справа** в лагере — рядом с повозкой или навесом торговца.
Не включать фон — только персонаж на прозрачном фоне.

## Промпт — один кадр (для прототипа)

```
pixel art dark fantasy merchant fence NPC character sprite, single frame,
lean cunning thin man in tattered dark cloak and wide-brimmed hat,
arms crossed with one hand stroking chin thoughtfully, shifty expression,
pouch on belt, fingerless gloves, standing idle pose facing slightly left,
full body visible, transparent background, dark fantasy RPG camp NPC,
64x96 pixel art sprite, grim atmosphere, no background
--ar 2:3 --style raw --v 6.1 --q 2
--no background scenery text UI bright colors cartoon anime
```

## Промпт — спрайт-лист idle (6 кадров)

```
pixel art dark fantasy shady merchant NPC idle animation sprite sheet,
6 frames in a single horizontal row, same character all frames,
lean man in dark cloak and hat, subtle breathing and occasional glance side to side,
slight sway in cloak fabric between frames,
consistent pixel art style, transparent background,
dark RPG character sprite sheet, grim dark fantasy, 384x96 total size
--ar 4:1 --style raw --v 6.1 --q 2
--no background scenery text UI multiple rows bright colors cartoon
```

## Цветовые ориентиры

- Плащ: тёмно-зелёный или сине-серый (#2a3a2a / #2a2a3a)
- Шляпа: тёмно-коричневый (#3a2a10)
- Кожа: бледноватая (#7a6a5a)
- Сумка: потрёпанная кожа (#5a4a2a)
- Акценты: пряжки, монеты, потёртый металл

## Анимация `interest` (при hover, опционально)

Скупщик приподнимает шляпу или поднимает бровь, наклоняется к игроку.
Жест «заходи, поговорим». 3–4 кадра.

```
pixel art dark fantasy merchant NPC interest animation sprite sheet,
3-4 frames horizontal row, character tips hat or raises eyebrow invitingly,
leans forward slightly, same visual style as idle, transparent background,
64x96 per frame, dark RPG
--ar 4:1 --style raw --v 6.1 --q 2
--no background text UI bright colors cartoon
```
