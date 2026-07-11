# Мобы: Мёртвые поля (Магия — Нежить)

**Генерация:** Nano Banana (Gemini image). Естественный язык, без флагов Midjourney. Прозрачность просим напрямую (PNG с альфой); если фон запечётся — убрать внешним инструментом / `tools/chroma_key.py`.

**Общие правила для всех мобов:**
- **Боковой вид, лицом ВЛЕВО** (мобы стоят справа от героя и смотрят на него), в полный рост, по центру кадра.
- Пиксель-арт, тёмное фэнтези, холодная десатурированная палитра. Для этой зоны — серо-фиолетовая, некротическое фиолетовое свечение (пепел `#6a6a7a`, магия `#6a3a8a`, кость `#c8c8d8`).
- Прозрачный фон, без земли/тени/текста.
- **Заглушка = одиночный idle-кадр.** Полные листы (`idle/attack/hit/death` по `docs/art-spec.md`) — позже тем же описанием.
- Путь спрайтов: `public/sprites/mobs/<id>/idle.png`. Размеры относительные (рядовой ≈ кадр героя, босс крупнее); точные px не важны — отмасштабируем.

---

## Поднятый пехотинец `raised_infantry` (common)

> Магия подняла тело, но не разум. Медленный, тупой.

```
Pixel-art dark fantasy enemy sprite for a side-scrolling battler. A reanimated foot
soldier of an undead magic army — a slow, mindless raised corpse. Rotting greyish skin,
sunken empty eye sockets with a faint cold purple glow, tattered dark robes and rusted
scraps of light infantry gear, shoulders slumped in a sluggish shambling stance, loosely
clutching a cracked wooden staff. Cold desaturated grey-purple palette, grim.

Side view, facing LEFT, full body head to toe, standing, centered. Hand-crafted pixel
art. Fully transparent background — output a PNG with an alpha channel. Roughly human
height.
```

## Скелет `skeleton` (uncommon)

> Без плоти — легче и чуть быстрее пехотинца.

```
Pixel-art dark fantasy enemy sprite for a side-scrolling battler. A fleshless human
skeleton held upright by fading necromantic magic — lighter and quicker than a fresh
corpse. Bare grey bones with a few clinging scraps of dark magic-faction robe, a faint
purple glow flickering in the eye sockets, jaw slightly agape, gaunt hunched stance.
Cold desaturated grey-purple palette.

Side view, facing LEFT, full body, standing, centered. Hand-crafted pixel art. Fully
transparent background — output a PNG with an alpha channel. Human height, thin.
```

## Восставший сержант — босс (2 фазы)

> Командный состав, поднятый намеренно. При «гибели» голова отлетает → фаза 2.

### Фаза 1 — Сержант `sergeant`

```
Pixel-art dark fantasy BOSS enemy sprite for a side-scrolling battler. An undead command
officer, raised on purpose and more intact than common troops — an imposing armored
sergeant. Tarnished dark plate armor over rotting flesh, a battered officer's helmet with
faded insignia, gripping a heavy sword, menacing upright stance, faint purple necrotic
glow at the joints. Cold desaturated grey-purple palette, grim and imposing.

Side view, facing LEFT, full body, standing, centered. Hand-crafted pixel art. Fully
transparent background — output a PNG with an alpha channel. Slightly larger and bulkier
than a common soldier.
```

### Фаза 2 — Рыцарь без головы `headless_knight`

```
Pixel-art dark fantasy BOSS enemy sprite for a side-scrolling battler. The same armored
undead knight AFTER losing its head — a HEADLESS knight, slower but stronger. Dark
tarnished plate armor, a ragged neck stump with thick purple necrotic energy seeping and
glowing upward where the head used to be, broad heavy braced stance, a large sword raised.
Absolutely NO head. Cold desaturated grey-purple palette, ominous.

Side view, facing LEFT, full body, standing, centered. Hand-crafted pixel art. Fully
transparent background — output a PNG with an alpha channel. Boss-sized, heavy.
```
