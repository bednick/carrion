# Мобы: Растоптанные луга (Конница — Дикие звери)

**Генерация:** Nano Banana (Gemini image). Естественный язык, без флагов Midjourney. Прозрачность просим напрямую (PNG с альфой); если фон запечётся — убрать внешним инструментом / `tools/chroma_key.py`.

**Общие правила для всех мобов:**
- **Боковой вид, лицом ВЛЕВО** (мобы стоят справа от героя), в полный рост, по центру кадра.
- Пиксель-арт, тёмное фэнтези, холодная десатурированная палитра. Для этой зоны — грязно-бурая, взрытое поле с пятнами засохшей крови (земля `#4a3a2a`, мех `#6a5a4a`, кровь `#5a2a2a`).
- Прозрачный фон, без земли/тени/текста.
- **Заглушка = одиночный idle-кадр.** Полные листы (`idle/attack/hit/death`) — позже.
- Путь спрайтов: `public/sprites/mobs/<id>/idle.png`. Размеры относительные; точные px не важны.

---

## Крыса `rat` (common)

> Быстрая, мелкая, почти не опасна поодиночке.

```
Pixel-art dark fantasy enemy sprite for a side-scrolling battler. A small, quick, mangy
rat scurrying across a trampled cavalry battlefield. Scrawny body, dirty matted brown-grey
fur, long thin tail, beady eyes, bared yellow teeth, low scampering pose. Muddy desaturated
brown-grey palette, grim.

Side view, facing LEFT, full body, centered. Hand-crafted pixel art. Fully transparent
background — output a PNG with an alpha channel. Small — about knee height to a human.
```

## Огромная крыса `giant_rat` (uncommon)

> Разожравшаяся на трупах. Медленнее, но живучее.

```
Pixel-art dark fantasy enemy sprite for a side-scrolling battler. A huge bloated rat grown
fat on battlefield corpses — slow but tough. Massively swollen body, matted greasy fur with
bald scarred patches, oversized chipped teeth, thick scaly tail, heavy hunched stance.
Muddy brown-grey palette with faint blood tint, grim.

Side view, facing LEFT, full body, centered. Hand-crafted pixel art. Fully transparent
background — output a PNG with an alpha channel. Large and hulking for a rat.
```

## Крысиный король `rat_king` — босс

> Несколько крыс, сросшихся хвостами. Каждая голова атакует сама по себе (мультиатака).

```
Pixel-art dark fantasy BOSS enemy sprite for a side-scrolling battler. A monstrous Rat
King — several large rats fused together at the tails into one writhing mass, multiple
snarling rat heads on long necks pointing in different directions, a tangled knot of tails
binding them at the center, diseased matted fur, many small beady glowing eyes. Grotesque
and chaotic. Muddy brown-grey palette with a sickly blood tint.

Side view, facing LEFT, full body, centered. Hand-crafted pixel art. Fully transparent
background — output a PNG with an alpha channel. Large boss creature, wider than a single rat.
```
