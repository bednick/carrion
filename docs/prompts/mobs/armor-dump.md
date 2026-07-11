# Мобы: Свалка доспехов (Мародёры — Броня)

**Генерация:** Nano Banana (Gemini image). Естественный язык, без флагов Midjourney. Прозрачность просим напрямую (PNG с альфой); если фон запечётся — убрать внешним инструментом / `tools/chroma_key.py`.

**Общие правила для всех мобов:**
- **Боковой вид, лицом ВЛЕВО** (мобы стоят справа от героя), в полный рост, по центру кадра.
- Пиксель-арт, тёмное фэнтези, холодная десатурированная палитра. Для этой зоны — ржавое железо, тёмная кожа, грязь (металл `#3a3a40`, ржавчина `#6a4030`, кожа `#5a4a3a`).
- Прозрачный фон, без земли/тени/текста.
- **Заглушка = одиночный idle-кадр.** Полные листы (`idle/attack/hit/death`) — позже.
- Путь спрайтов: `public/sprites/mobs/<id>/idle.png`. Размеры относительные; точные px не важны.

---

## Мусорщик `scavenger` (common)

> Самый мелкий из мародёров. Копается в куче, не особо умелый боец.

```
Pixel-art dark fantasy enemy sprite for a side-scrolling battler. The lowliest marauder —
a scrawny scavenger who digs through a scrapyard of discarded armor. A lean ragged human in
filthy mismatched rags and a few scavenged rusty armor scraps, hunched and twitchy, loosely
clutching a crude rusty knife, nervous untrained stance. Rusty iron and grimy desaturated
palette, grim.

Side view, facing LEFT, full body head to toe, standing, centered. Hand-crafted pixel art.
Fully transparent background — output a PNG with an alpha channel. Human, lean.
```

## Подручный `henchman` (uncommon)

> Чуть лучше вооружён и агрессивнее. (Он же — призываемый «ослабленный подручный» у босса.)

```
Pixel-art dark fantasy enemy sprite for a side-scrolling battler. A marauder henchman —
better armed and more aggressive than a scavenger. A rough human bandit in mismatched
scavenged armor pieces (a dented breastplate, leather bracers), gripping a rusty blade or a
crude plank shield, broad confident threatening stance. Rusty iron, dark leather and grimy
desaturated palette.

Side view, facing LEFT, full body, standing, centered. Hand-crafted pixel art. Fully
transparent background — output a PNG with an alpha channel. Human, sturdy.
```

## Главарь свалки `dump_boss` — босс

> Матёрый мародёр, держит свалку под контролем. В начале боя призывает ослабленного подручного.

```
Pixel-art dark fantasy BOSS enemy sprite for a side-scrolling battler. The boss of the
scrapyard — a hulking, seasoned marauder who rules the dump. A big intimidating human brute
clad in heavy mismatched salvaged plate and spiked scrap armor, wielding a massive crude
weapon (an oversized cleaver or scrap-iron club), dominant menacing stance, scarred grim
face. Rusty iron, dark leather and grimy desaturated palette, imposing.

Side view, facing LEFT, full body, standing, centered. Hand-crafted pixel art. Fully
transparent background — output a PNG with an alpha channel. Boss-sized — larger and
bulkier than common marauders.
```
