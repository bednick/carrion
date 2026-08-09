# Промпт: Тренировочный лагерь (Training Camp) — обучающая зона, без фракции

**Генерация:** Nano Banana — естественный язык, без флагов Midjourney; «негатив» прозой. Общие правила и 4-слойная
модель — [`_style-guide.md`](../_style-guide.md). Для этой зоны генерируем в первом заходе только `far`/`near`
(по 1 варианту) — `mid`/`fore` (пулы объектов) можно добавить позже, зона это допускает (движок без них рисует
только far/near, `ExpeditionScene.buildScatterLayer` пропускает пустые слои).

## Атмосфера (лор)

Двор у самого костра лагеря, огороженный сколоченным частоколом — здесь новичков учат держать оружие прежде, чем
отпустить за край поля. Не поле битвы: земля утоптанная, не выжженная, воткнуты учебные столбы с чучелами и
клетка с пленником у забора. Сумерки, тусклый костровой свет и пара факелов на кольях — не лунный магический
свет, как на настоящих зонах. Палитра та же холодная десатурированная база проекта, но тон приземлённый, бытовой,
без некротического свечения/тумана.

---

## FAR — `far.png` (небо/дальний план, непрозрачный, медленный)

**Вариант 1 (`far.1.png`):**
```
Generate a pixel-art far background layer for a dark-fantasy side-scrolling battler — the "Training Camp" zone, a
mundane fenced practice yard just outside the player's own camp (not a battlefield). Hand-crafted dark fantasy
pixel art, cold desaturated palette, grim but calm dusk mood.
A low wooden palisade fence stretching along the horizon, a few dim torches on posts glowing warm-orange against
the cold dusk sky, faint smoke haze drifting up from a campfire just out of frame, overcast grey-blue sky with no
moon emphasis. Keep every distinct distant shape different — no repeated silhouettes. Sky and distant fence line
ONLY — no foreground, no large objects, no people, no text. Opaque image.
Very wide horizontal strip, about 8:1 (much wider than one screen), not a square; tiles seamlessly left to right.
Limited cold palette with warm torch accents, approximately: #1a1a2e, #3a3a4a, #c88a44.
```

---

## NEAR — `near.png` (земля, непрозрачный, скорость героя)

**Вариант 1 (`near.1.png`):**
```
Generate a pixel-art GROUND/floor layer for a dark-fantasy battle game — the packed dirt yard of the "Training
Camp" zone the character walks on. Hand-crafted dark fantasy pixel art, cold desaturated palette.
Hard-packed trodden earth seen from a high oblique angle — a steep near-top-down view (camera tilted down, NOT
straight overhead and NOT a side view); the surface fills the whole band and recedes gently toward the top, fading
darker there. Evenly, uniformly detailed: scuffed dirt, faint boot-worn ruts, a few scattered wood chips and straw
wisps from practice dummies — distributed evenly, no large unique landmark objects, no sky, no horizon. Opaque
image.
A very wide, short horizontal band (~8:1), seamlessly tileable left to right with no visible seam (this layer
scrolls fastest). Cold earthy palette: #3a2e22, #5a4a38, faint straw #8a7a4a.
```

---

## Палитра

| Элемент          | Hex       |
|-------------------|-----------|
| Сумеречное небо    | `#1a1a2e` |
| Холодный серо-синий| `#3a3a4a` |
| Свет факела        | `#c88a44` |
| Утоптанная земля    | `#3a2e22` |
| Земля светлее       | `#5a4a38` |
| Солома/щепа         | `#8a7a4a` |
