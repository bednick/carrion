# Промпт: Кузнец (Smith NPC)

## Технические параметры

| Параметр               | Значение                                                        |
|------------------------|-----------------------------------------------------------------|
| Позиция в лагере       | x=160, y=480 (левая треть)                                      |
| Размер спрайта         | 64×96 px на кадр (единый шаблон из art-spec)                    |
| Анимации               | `idle` (6 кадров), опционально `interest` (3–4 кадра при hover) |
| Спрайт-лист            | горизонтальный: все кадры idle в одну строку → 384×96 px        |
| Midjourney (лист)      | `--ar 4:1`                                                      |
| Midjourney (один кадр) | `--ar 2:3`                                                      |

## Описание персонажа

Кузнец — крупный, угрюмый мужчина в кожаном фартуке со следами копоти.
Стоит у наковальни или точильного камня. Руки сложены или держат молот.
Не герой — работяга, привыкший к войне. Тёмное фэнтези, не мультяшное.

Расположен **слева** в лагере — за ним кирпичная кладка или деревянный навес кузницы.
Не включать фон — только персонаж на прозрачном фоне.

## Промпт — один кадр (для прототипа)

```
pixel art dark fantasy blacksmith NPC character sprite, single frame,
heavyset gruff man in scorched leather apron, soot-stained arms crossed,
worn iron hammer tucked in belt, rough beard, hood or cap,
standing idle pose facing slightly right, full body visible,
transparent background, dark fantasy RPG camp NPC,
64x96 pixel art sprite, grim atmosphere, no background, isolated character
--ar 2:3 --style raw --v 6.1 --q 2
--no background scenery text UI bright colors cartoon anime
```

## Промпт — спрайт-лист idle (6 кадров)

```
pixel art dark fantasy blacksmith NPC idle animation sprite sheet,
6 frames in a single horizontal row, same character all frames,
heavyset gruff man in scorched leather apron, subtle breathing animation,
slight weight shift and occasional head turn between frames,
consistent pixel art style, transparent background,
dark RPG character sprite sheet, grim dark fantasy, 384x96 total size
--ar 4:1 --style raw --v 6.1 --q 2
--no background scenery text UI multiple rows bright colors cartoon
```

## Цветовые ориентиры

- Фартук: тёмная кожа (#3a2010)
- Кожа рук: тёмно-коричневый (#5a3a20)
- Металл молота: тёмно-серый (#4a4a4a)
- Одежда: угольно-серый (#2a2a2a)
- Акценты: следы ржавчины, копоть

## Анимация `interest` (при hover, опционально)

Короткое движение интереса: кузнец поднимает голову и смотрит на игрока,
слегка наклоняется вперёд. 3–4 кадра.

```
pixel art dark fantasy blacksmith NPC interest animation sprite sheet,
3-4 frames horizontal row, character looks up and leans forward with curiosity,
same visual style as idle, transparent background, 64x96 per frame
--ar 4:1 --style raw --v 6.1 --q 2
--no background text UI bright colors cartoon
```
