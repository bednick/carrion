# Промпт: Логово зверей ★★☆

**Фракция:** Конница — Дикие звери | **Тип:** средняя
**Генерация:** Nano Banana — естественный язык, без флагов Midjourney; «негатив» прозой; для `mid`/`fore` прозрачность
просим явно («output a PNG with an alpha channel»). Общие правила, 4-слойная модель и конвенция вариантов (по 2 промта
на слой → `<layer>.1.png` / `<layer>.2.png`) — [`_style-guide.md`](../_style-guide.md).

## Атмосфера (лор)

Хищники обосновались среди костей лошадей и людей. Появились звериные норы и логова. Тёмная чаща у леса. Запах
территории, не еды. Опаснее лугов — здесь зверь чувствует себя хозяином.

---

## FAR — `far.png` (лес + небо, непрозрачный, медленный)

**Вариант 1 (`far.1.png`):**

```
Generate a pixel-art far SKY background layer for a dark-fantasy side-scrolling battle game — the "Beast Lair" zone.
Hand-crafted dark fantasy pixel art, cold desaturated palette, threatening wilderness mood.
A dark overcast dusk sky above a dense dark-forest treeline: silhouettes of massive gnarled old trees on the horizon (no
individual leaves), a few faint dim-yellow eye glints hinted between distant trunks, cold dark green-black atmosphere.
Keep every distinct distant shape different — no repeated or duplicated silhouettes. Sky and distant treeline ONLY — no foreground, no people, no text. Opaque image.
Very wide horizontal strip, 8:1 (much wider than one screen — about twice as wide as the other layers, a long thin
band), a long thin band — not a square; tiles seamlessly left to right.
Limited cold palette, approximately: #0a1a0a, #1a1a2a, #2a2a1a.
```

**Вариант 2 (`far.2.png`):**

```
Generate a pixel-art far SKY background layer for a dark-fantasy battle game — the "Beast Lair" zone.
Hand-crafted dark fantasy pixel art, cold desaturated palette, threatening wilderness mood.
A deeper-night sky with a faint sickly moon glow behind the canopy, a taller jagged treeline of dead gnarled trees on
the horizon, thin cold mist drifting low between the distant trunks, more eye glints scattered in the dark. Keep every distinct distant shape different — no repeated or duplicated silhouettes. Sky and
distant treeline ONLY, no foreground, no people, no text. Opaque image.
Very wide horizontal strip, 8:1 (much wider than one screen — about twice as wide as the other layers, a long thin
band), not a square; tiles seamlessly left to right.
Limited cold palette, approximately: #0a1a0a, #1a1a2a, #2a2a1a.
```

---

## MID — пул объектов (`public/backgrounds/objects/mid/<slug>.png`, альфа, средняя скорость)

> Дальние силуэты нор, костяных куч и стволов на горизонте, за героем. Каждый объект — отдельный файл; движок сам
> тасует пул и раскладывает объекты со случайным размером/промежутком на старте экспедиции
> (`ZONE_BG_OBJECTS['beast-lair'].mid` в `src/zones/registry.ts`).

**Источник:** объекты нарезаны из старых composite-картинок `mid.1.png`/`mid.2.png` (оставлены в `public/`, но больше
не используются кодом) инструментом `tools/slice_objects.py` — новый арт не генерировался (см. `_style-guide.md` →
«Источник объектов: нарезка старых composite-картинок»). Итоговый пул (13 файлов, часть — повтор похожего объекта
под суффиксом `-2` для разнообразия):

| Файл                       | Объект                                          |
|----------------------------|--------------------------------------------------|
| `mid/den-mound.png`        | земляной курган-нора с тёмным входом             |
| `mid/den-mound-2.png`      | земляной курган-нора (второй, меньше)            |
| `mid/skull-pile.png`       | куча выбеленных черепов и рёбер                  |
| `mid/skull-pile-2.png`     | куча черепов и костей (второй вариант)           |
| `mid/clawed-trunk.png`     | голый скрюченный ствол дерева                    |
| `mid/gnawed-lance.png`     | обгрызенные копья, воткнутые в землю             |
| `mid/hollow-log-den.png`   | поваленное дуплистое бревно-нора                 |
| `mid/bone-rack.png`        | стойка с подвешенными костями                    |
| `mid/cavalry-wreck.png`    | опрокинутая повозка/телега                       |
| `mid/dead-sapling.png`     | сухой молодой ствол без листвы                   |
| `mid/dead-sapling-2.png`   | сухой молодой ствол (второй)                     |
| `mid/antler-mound.png`     | череп с рогами на груде костей                   |
| `mid/bone-pile-2.png`      | ещё одна груда костей                            |

---

## NEAR — `near.png` (земля, непрозрачный, скорость героя)

> Тёмная лесная подстилка под ногами. Вид сверху под крутым углом — камера наклонена вниз, но НЕ строго отвесно и НЕ
> сбоку (поверхность уходит вглубь к верхней кромке и темнеет там), равномерно, бесшовный тайл — критично.

**Вариант 1 (`near.1.png`):**

```
Generate a pixel-art GROUND/floor layer for a dark-fantasy battle game — the ground of the "Beast Lair" zone the
character walks on. Hand-crafted dark fantasy pixel art, cold desaturated palette.
Dark forest floor seen from a high oblique angle — a steep near-top-down view (camera tilted down, NOT straight overhead and NOT a side or elevation view); the surface fills the whole band and recedes gently into the distance toward the top, fading darker at the top edge. Evenly, uniformly
detailed: dead leaves and dark soil, large claw marks raked into earth, scattered small animal bones, shed fur tufts,
big paw prints in damp soil, dark roots breaking the surface, patches of dried dark blood — distributed evenly.
No large unique landmark objects, no sky, no horizon. Opaque image.
A very wide, short horizontal band (8:1), seamlessly tileable left to right with no visible seam
(scrolls fastest). Extremely dark palette: #1a1a0a, roots #2a1a0a, tracks #0a0f0a.
```

**Вариант 2 (`near.2.png`):**

```
Generate a pixel-art GROUND/floor layer for a dark-fantasy battle game — the ground of the "Beast Lair" zone.
Hand-crafted dark fantasy pixel art, cold desaturated palette.
Dark forest floor from a high oblique angle — a steep near-top-down view (camera tilted down, NOT straight overhead and NOT a side or elevation view; the surface recedes into the distance toward the top and fades darker at the top edge), but more BARE and trodden: packed dark earth worn smooth around a den
with scattered gnawed bone fragments, sparse dead leaves, deep paw prints, exposed twisted roots and a few feathers —
evenly distributed, no large landmark objects. No sky, no horizon. Opaque image.
Very wide short horizontal band (8:1), seamlessly tileable left to right with no visible seam
(scrolls fastest). Extremely dark palette: #1a1a0a, roots #2a1a0a, tracks #0a0f0a.
```

---

## FORE — пул объектов (`public/backgrounds/objects/fore/<slug>.png`, альфа, очень быстрый)

> Рендерится только в нижней ~½ экрана: объекты стоят на нижней кромке и растут вверх, ничего не свисает сверху.
> Прячется в бою. Каждый объект — отдельный файл; движок сам тасует пул (повторы в одной раскладке допустимы) и
> раскладывает со случайным размером/промежутком (`ZONE_BG_OBJECTS['beast-lair'].fore` в `src/zones/registry.ts`).

**Источник:** объекты нарезаны из старых composite-картинок `fore.1.png`/`fore.2.png` (оставлены в `public/`, но
больше не используются кодом) инструментом `tools/slice_objects.py` (с `--trim-bottom` — по низу картинок шла
сплошная полоса-подложка, склеивающая силуэты). Итоговый пул (15 файлов, часть — повтор похожего объекта под
суффиксом `-2` для разнообразия):

| Файл                            | Объект                                        |
|----------------------------------|--------------------------------------------------|
| `fore/clawed-bark-trunk.png`     | толстый скрюченный ствол с содранной корой       |
| `fore/clawed-bark-trunk-2.png`   | ещё один скрюченный ствол                        |
| `fore/root-tangle.png`           | клубок торчащих из земли корней                  |
| `fore/root-tangle-2.png`         | клубок корней (второй, меньше)                   |
| `fore/ribcage-propped.png`       | большая рёберная клетка, поставленная стоймя     |
| `fore/ribcage-propped-2.png`     | рёберная клетка (второй вариант)                 |
| `fore/dark-brush.png`            | тёмный густой куст                               |
| `fore/dark-brush-2.png`          | ещё один куст                                    |
| `fore/stump-den.png`             | пень с дуплом-норой                              |
| `fore/stump-den-2.png`           | пень с дуплом (второй, меньше)                   |
| `fore/mossy-log.png`             | поваленное замшелое бревно                       |
| `fore/drooping-bush.png`         | куст с поникшими сухими ветвями                  |
| `fore/drooping-bush-2.png`       | ещё один поникший куст                           |
| `fore/skull-stake.png`           | рогатый череп на колу                            |
| `fore/bone-pile.png`             | груда костей                                     |

---

## Палитра

| Элемент          | Hex       |
|------------------|-----------|
| Тёмный лес       | `#0a1a0a` |
| Ночное небо      | `#1a1a2a` |
| Лес вдали        | `#2a2a1a` |
| Тёмная земля     | `#1a2a1a` |
| Кости            | `#7a7a6a` |
| Кора / корни     | `#2a1a0a` |
| Лесная подстилка | `#1a1a0a` |
| Следы            | `#0a0f0a` |
