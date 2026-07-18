# Промпт: Мёртвые поля (Dead Fields) ★☆☆

**Фракция:** Магия — Нежить | **Тип:** стартовая
**Генерация:** Nano Banana — естественный язык, без флагов Midjourney; «негатив» прозой; для `mid`/`fore` прозрачность
просим явно («output a PNG with an alpha channel»). Общие правила, 4-слойная модель и конвенция вариантов (по 2 промта
на слой → `<layer>.1.png` / `<layer>.2.png`) — [`_style-guide.md`](../_style-guide.md).

## Атмосфера (лор)

Равнина, где стояли войска магической фракции. Земля выжжена, трава поседела. Остатки ритуалов удержали мёртвых на
ногах, над землёй клубится лёгкий фиолетовый туман. Бледная мёртвая луна за фиолетовыми тучами — единственный источник
холодного света. Палитра холодная, десатурированная, мрачная.

---

## FAR — `far.png` (небо, непрозрачный, медленный)

**Вариант 1 (`far.1.png`):**
```
Generate a pixel-art far SKY background layer for a dark-fantasy side-scrolling battle game — the "Dead Fields" zone.
Hand-crafted dark fantasy pixel art, cold desaturated palette, grim post-battle mood.
A wide panoramic night sky: heavy overcast, a single pale dying crescent moon breaking through purple-grey storm clouds (exactly ONE moon, drawn a single
time across the whole strip and kept away from the left and right edges), a very
low flat distant scorched horizon along the bottom with faint purple magical fog and a few tiny far-away glows.
Keep every distinct distant shape different — no repeated or duplicated silhouettes. Sky and distant horizon ONLY — no foreground, no large objects, no people, no text. Opaque image.
Very wide horizontal strip, about 8:1 (much wider than one screen — about twice as wide as the other layers, a long thin
band) — not a square; tiles seamlessly left to right, wide enough that only ONE copy of the moon is ever on screen at
once. Limited cold palette, approximately: #1a0a2e, #2a2a3e, #c8c8d8.
```

**Вариант 2 (`far.2.png`):**
```
Generate a pixel-art far SKY background layer for a dark-fantasy side-scrolling battle game — the "Dead Fields" zone.
Hand-crafted dark fantasy pixel art, cold desaturated palette, grim mood.
A wide panoramic night sky with the moon HIDDEN behind thick clouds — only a single diffuse pale moon-glow through the overcast (one glow only, drawn once across the whole strip),
layered purple-grey cloud bands, distant lightning-free haze, and a slightly higher rolling scorched horizon with denser
purple fog and two or three faint glows. Keep every distinct distant shape different — no repeated or duplicated silhouettes. Sky and distant horizon ONLY, no foreground, no people, no text. Opaque.
Very wide horizontal strip, about 8:1 (much wider than one screen — about twice as wide as the other layers), not a
square; tiles seamlessly left to right, wide enough that the single moon-glow is never seen twice at once.
Limited cold palette, approximately: #1a0a2e, #2a2a3e, #c8c8d8.
```

---

## MID — пул объектов (`public/backgrounds/objects/mid/<slug>.png`, альфа, средняя скорость)

> Мелкие далёкие объекты на линии горизонта, за спиной героя. Каждый объект — отдельный файл; движок сам тасует пул
> и раскладывает объекты со случайным размером/промежутком на старте экспедиции
> (`ZONE_BG_OBJECTS['dead-fields'].mid` в `src/zones/registry.ts`).

**Источник:** объекты нарезаны из старых composite-картинок `mid.1.png` (оставлена в `public/`, но больше не
используется кодом; `mid.2.png` имела нестандартное разрешение и не резалась чисто — не использована) инструментом
`tools/slice_objects.py`. Итоговый пул (10 файлов, часть — повтор похожего объекта под суффиксом `-2`):

| Файл                          | Объект                                    |
|--------------------------------|-----------------------------------------------|
| `mid/dead-tree.png`            | голое засохшее дерево                         |
| `mid/siege-frame.png`          | сломанная рама осадного орудия (катапульта)   |
| `mid/siege-frame-2.png`        | ещё одна катапульта                           |
| `mid/tattered-banner.png`      | накренившийся истрёпанный флаг на древке      |
| `mid/tattered-banner-2.png`    | ещё один флаг на древке                       |
| `mid/thin-sapling.png`         | тонкий засохший росток                        |
| `mid/fallen-pillar.png`        | упавшая/накренившаяся колонна                 |
| `mid/fallen-pillar-2.png`      | ещё одна упавшая колонна                      |
| `mid/ruined-gallows.png`       | голое ветвистое дерево (виселица издали)      |
| `mid/collapsed-wagon.png`      | обломки повозки                               |

---

## NEAR — `near.png` (земля, непрозрачный, скорость героя)

> Поверхность под ногами. Вид сверху под крутым углом — камера наклонена вниз, но НЕ строго отвесно и НЕ сбоку (поверхность уходит вглубь к верхней кромке и темнеет там). Равномерная фактура без уникальных
> «лендмарков». Бесшовный тайл — критично (едет быстрее всех).

**Вариант 1 (`near.1.png`):**
```
Generate a pixel-art GROUND/floor layer for a dark-fantasy battle game — the ground of the "Dead Fields" zone the
character walks on. Hand-crafted dark fantasy pixel art, cold desaturated palette.
Ashen cracked scorched earth stretching horizontally, seen from a high oblique angle — a steep near-top-down view (camera tilted down, NOT straight overhead and NOT a side or elevation view); the surface fills the whole band and recedes gently into the distance toward the top, fading darker at the top edge. Evenly, uniformly detailed: fine cracks, patches of grey ash, scattered SMALL bone shards, tufts of grey
dead grass, faint burn marks, subtle purple magical residue — distributed evenly across the whole strip.
No large unique landmark objects, no sky, no horizon. Opaque image.
A very wide, short horizontal band (~8:1), seamlessly tileable left to right
with no visible seam or obvious repeating motif (this layer scrolls fastest). Cold grey ash palette: #2a2a2a, #4a4a4a,
faint purple residue #6a3a8a.
```

**Вариант 2 (`near.2.png`):**
```
Generate a pixel-art GROUND/floor layer for a dark-fantasy battle game — the ground of the "Dead Fields" zone.
Hand-crafted dark fantasy pixel art, cold desaturated palette.
Scorched earth from a high oblique angle — a steep near-top-down view (camera tilted down, NOT straight overhead and NOT a side or elevation view); the surface fills the whole band and recedes gently into the distance toward the top, fading darker at the top edge, but DRIER and dustier than usual:
cracked grey-brown soil with wider cracks, drifts of pale ash, sparse withered grass clumps, a few small scattered bone
fragments, and faint purple residue pooling in the cracks — all evenly distributed, no large landmark objects.
No sky, no horizon. Opaque image.
Very wide short horizontal band (8:1), seamlessly tileable left to right with no visible seam
(scrolls fastest). Cold grey-ash palette: #2a2a2a, #4a4a4a, faint purple #6a3a8a.
```

---

## FORE — пул объектов (`public/backgrounds/objects/fore/<slug>.png`, альфа, очень быстрый)

> Близко перед камерой, проносится быстрее всех; прячется в бою. Рендерится только в нижней ~½ экрана: объекты
> стоят на нижней кромке и растут вверх, ничего не свисает сверху. Каждый объект — отдельный файл; движок сам тасует
> пул (повторы в одной раскладке допустимы) и раскладывает со случайным размером/промежутком
> (`ZONE_BG_OBJECTS['dead-fields'].fore` в `src/zones/registry.ts`).

**Источник:** объекты нарезаны из старых composite-картинок `fore.1.png`/`fore.2.png` (оставлены в `public/`, но
больше не используются кодом) инструментом `tools/slice_objects.py` (с `--trim-bottom`). Часть силуэтов в этих
картинках физически перекрывалась (не только через общую полосу-подложку) — такие куски приняты как один составной
объект пула, а не разрезаны вручную. Итоговый пул меньше, чем у beast-lair (6 файлов вместо ~8–9 из промптов ниже —
объекты вроде obelisk/cart-wheel/reeds/banner-pole из исходных промптов либо не отделились чисто, либо не были
нарисованы отдельно от других силуэтов):

| Файл                            | Объект                                       |
|-----------------------------------|--------------------------------------------------|
| `fore/bare-dead-trunk.png`        | голый мёртвый ствол дерева                       |
| `fore/bare-dead-trunk-2.png`      | ещё один ствол (со сломанным столбом рядом)      |
| `fore/bare-dead-trunk-3.png`      | ещё один ствол                                   |
| `fore/dead-grass-clump.png`       | высокий пучок сухой травы/рогоза                 |
| `fore/dead-grass-clump-2.png`     | ещё один пучок травы                             |
| `fore/siege-wreckage.png`         | обломки осадного орудия                          |

---

## Палитра

| Элемент             | Hex       |
|---------------------|-----------|
| Небо тёмно-фиолет.  | `#1a0a2e` |
| Холодный серо-синий | `#2a2a3e` |
| Бледная луна        | `#c8c8d8` |
| Пепельно-серый      | `#6a6a7a` |
| Мёртвая трава       | `#4a4a3a` |
| Магический туман    | `#6a3a8a` |
| Тёмная земля        | `#2a2a2a` |
| Зола                | `#4a4a4a` |
