# Промпт: Флейтист (Flutist NPC)

Управляет громкостью слоя флейты в лагере (по клику — всплывающий ползунок).

## Инструмент

Весь арт проекта **всегда** генерируется через **Nano Banana** (Gemini image) — естественным
языком, без флагов Midjourney (`--ar`, `--style`, `--v`, `--q`, `--no`). «Негатив» пишем прозой.

## Технические параметры

| Параметр          | Значение                                                      |
|-------------------|--------------------------------------------------------------|
| Позиция в лагере  | x≈955, y≈648 (правее сундука, левее скупщика)                |
| Размер файла      | одиночный кадр ~300×600 px, как `smith.png` / `dealer.png`   |
| Отрисовка в коде  | 80×120 (как остальные НПС)                                   |
| Путь              | `public/sprites/npc/flutist.png`                            |
| Ключ текстуры     | `npc-flutist`                                               |
| Фон               | прозрачный (PNG с альфой), без сцены                         |

## Описание персонажа

Странствующий флейтист/менестрель — усталый выживший после большой войны, не герой.
Сидит **на земле** (скрестив / поджав ноги) и играет грустную мелодию на простой
деревянной флейте (свирели).
Обе руки держат флейту у губ, локти чуть приподняты, голова наклонена к инструменту,
глаза полуприкрыты — погружён в мотив. Потрёпанный плащ с капюшоном, многослойная
дорожная одежда, сумка на бедре, тканевые обмотки на предплечьях.

**Ракурс:** вид сзади-сбоку — спина повёрнута к зрителю, корпус развёрнут влево
(к центру лагеря / костру), так что виден профиль и флейта. Промежуточное положение
между «спиной к нам» и «смотрит влево». Тон мрачный, приглушённый — в духе сеттинга.

**Свет:** тёплый ключевой свет от костра идёт **слева, со стороны лица** — освещает
лицо, флейту и переднюю часть; спина (обращённая к зрителю) уходит в тень. Лёгкий
тёплый rim-light по левому контуру, остальное приглушённое.

## Консистентность

Генерировать в **режиме редактирования**: приложить `public/sprites/npc/smith.png` и
`public/sprites/npc/dealer.png` как эталон стиля (тот же пиксель-стиль, пропорции,
толщина обводки, палитра, освещение).

## Промпт — один кадр (Nano Banana)

```
Using the two attached sprites (a gruff blacksmith and a shady merchant) as the
EXACT reference for art style, color palette, value range, outline treatment and
rendering, generate a single matching pixel-art character sprite for the same
dark fantasy RPG camp: a lean wandering flute player / minstrel, a weary post-war
survivor, not a hero. He is sitting on the ground by the campfire (cross-legged,
with his legs folded on the floor — NOT crouching or squatting on his haunches),
playing a simple wooden flute held to his lips with both hands, elbows slightly
raised, head tilted down toward the instrument, eyes half-closed as if lost in a
melancholic tune. He wears a worn hooded cloak and layered ragged traveling
clothes, a satchel on his hip, cloth wraps on his forearms. Three-quarter rear
view: his back is mostly turned toward the viewer and his body is rotated to the
left so we see his profile and the flute — an intermediate angle between a full
back view and a left side view. Full body visible, calm seated pose.

Lighting: a warm campfire key light comes from the LEFT (the face side), softly
lighting his face, the flute and his front, while his back — the side turned toward
the viewer — falls into shadow. Subtle warm rim light along the left contour, the
rest dim. Keep it low-key and grim, consistent with the references.

IMPORTANT — match the references' palette precisely: warm desaturated EARTH tones —
dark muted browns, soot-stained charcoal grey, faded olive, weathered leather, dull
rust accents. Keep the SAME low overall brightness and dark grimy mood as the
references. Do NOT use cool teal/sage green, blue or purple tints, and do NOT make
him brighter, cleaner or more colorful than the attached sprites — he must look
like he belongs in the exact same set. Same painterly hand-crafted pixel-art
rendering and dark outline as the references.

Not cartoon, not anime, not 3D render. Fully transparent background, output PNG with
alpha channel. No scenery, no ground, no sky, no UI, no text, no frames, no logos.
Single frame.
```

## Цветовые ориентиры

Тёплая землистая палитра как у smith/dealer — **без** холодного зелёного/синего, тёмная и грязная:

- Плащ/капюшон: тёмно-коричнево-серый, выцветшая олива (#3a322a / #3a3a2e)
- Одежда: угольно-коричневый, сажа (#2a2418)
- Флейта/кожа сумки: тёмное дерево, потёртая кожа (#4a3a22)
- Кожа лица/рук: тёплый тёмно-бежевый (#6a5444)
- Акценты: тусклая ржавчина, потёртые пряжки, слабый тёплый отблеск костра

## Запасной путь по альфе

Если прозрачный фон выйдет грязным — просить сплошную магенту `#FF00FF` фоном и
резать: `python tools/chroma_key.py in.png out.png --height 600`.
