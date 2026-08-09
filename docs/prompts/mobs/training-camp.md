# Мобы: Тренировочный лагерь (обучающая зона, без фракции)

**Генерация:** Nano Banana (Gemini image). Естественный язык, без флагов Midjourney. Прозрачность просим напрямую (PNG с альфой); если фон запечётся — убрать внешним инструментом / `tools/chroma_key.py`.

**Общие правила для всех мобов:**
- **Боковой вид, лицом ВЛЕВО** (мобы стоят справа от героя и смотрят на него), в полный рост, по центру кадра.
- Пиксель-арт, тёмное фэнтези, холодная десатурированная палитра — как и весь остальной арт проекта
  (`docs/prompts/_style-guide.md`), но зона мирная и приземлённая (двор лагеря, не поле боя) — без магического
  свечения/некротического фиолетового, только приглушённые деревянные/земляные тона.
- Прозрачный фон, без земли/тени/текста.
- **Заглушка = одиночный idle-кадр.** Полные листы (`idle/attack/hit/death` по `docs/art-spec.md`) — позже тем же
  описанием.
- Путь спрайтов: `public/sprites/mobs/<id>/idle.png`. Размеры относительные (рядовой ≈ кадр героя, босс/пленник
  крупнее); точные px не важны — отмасштабируем.

---

## Соломенное чучело `straw_dummy` (common)

> Учебная мишень на деревянной палке — не бьёт, стоит смирно, пока по нему упражняются новички.

```
Pixel-art dark fantasy training-dummy sprite for a side-scrolling battler. A crude
practice target: a stuffed straw effigy with a lumpy sackcloth "head" and torso, bound
with frayed rope, mounted on a single weathered wooden post driven into the ground.
Patched burlap, loose straw poking through torn seams, a few old scuff marks and cut
gouges from practice weapons. No face, no weapon, no limbs reaching out — just a still
practice post. Muted earthy palette (worn brown wood, dull straw-yellow, dusty grey
burlap), cold desaturated dark-fantasy tone overall, but no magical glow.

Side view, facing LEFT, full "body" (post included) from base to top, standing, centered.
Hand-crafted pixel art. Fully transparent background — output a PNG with an alpha
channel. Roughly human height, slightly squat.
```

## Скованный мертвец `bound_corpse` (common, «босс» — финальный бой зоны)

> Пленная нежить, которую камп держит на цепи как живую учебную цель — уже слабо огрызается.

```
Pixel-art dark fantasy enemy sprite for a side-scrolling battler. A shackled undead
captive kept as a live training target in a mercenary camp yard — a gaunt raised corpse
in ragged clothes, wrists and ankles bound in heavy rusted chains anchored to a stout
wooden cage post behind it, hunched low, one chained arm weakly raised as if to claw.
Sunken grey skin, faint dim purple glow in the eye sockets (much fainter than a proper
undead warrior — this one is starved and weak), no armor, no weapon. Cold desaturated
grey-purple palette, muted, slightly pathetic rather than menacing.

Side view, facing LEFT, full body, standing, centered. Hand-crafted pixel art. Fully
transparent background — output a PNG with an alpha channel. Human height, gaunt and
slightly stooped.
```
