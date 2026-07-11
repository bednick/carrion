# Промпт: Сундук и Стойка для брони

## Технические параметры

Сундук и стойка — два отдельных объекта, которые открывают одну панель.
Расположены рядом в центре-верху лагеря (y=200).

| Объект               | Позиция      | Текущий размер        | Рекомендуемый размер спрайта |
|----------------------|--------------|-----------------------|------------------------------|
| Сундук (chest)       | x=600, y=200 | 80×56                 | **80×72 px**                 |
| Стойка (armor stand) | x=680, y=200 | часть того же объекта | **48×80 px**                 |

Можно генерировать как **один широкий спрайт** (сундук + стойка рядом): **128×80 px**.
Или как два отдельных спрайта.

Midjourney (один спрайт): `--ar 8:5`
Midjourney (сундук отдельно): `--ar 1:1`
Midjourney (стойка отдельно): `--ar 2:3`

## Описание объектов

**Сундук:** деревянный окованный железом ящик. Крышка закрыта.
Металлические петли, замок или засов. Потёртый, видавший виды.
Стоит на земле, слегка приоткрытая крышка — намёк что внутри что-то есть.

**Стойка для брони:** деревянный крест или Т-образный манекен для доспехов.
На нём висит базовое снаряжение — шлем сверху, нагрудник, наплечники.
Выглядит как боевая подготовка, не как витрина магазина.

## Промпт — один широкий спрайт (сундук + стойка вместе)

```
pixel art dark fantasy treasure chest and armor stand combined prop sprite,
left side: old iron-banded wooden chest with lid slightly ajar, iron lock and hinges,
right side: wooden T-shaped armor dummy stand with battered iron helmet on top,
chainmail draped over the arms of the stand, leather straps hanging,
both objects at the same ground level, consistent pixel art style,
transparent background, dark RPG camp prop, grim atmosphere,
no characters no people, isolated prop sprite
--ar 8:5 --style raw --v 6.1 --q 2
--no people characters background scenery text UI bright colors cartoon
```

## Промпт — сундук отдельно

```
pixel art dark fantasy wooden treasure chest sprite, closed with lid slightly open,
iron bands and corner brackets reinforcing old wood, heavy iron padlock hasp,
worn scratched surface showing age and use, slight glow from interior hint,
transparent background, dark RPG prop, isolated object sprite,
top-down slightly angled view to show lid
--ar 1:1 --style raw --v 6.1 --q 2
--no people characters background text UI bright colors cartoon
```

## Промпт — стойка для брони отдельно

```
pixel art dark fantasy wooden armor stand mannequin prop sprite,
T-shaped wooden frame, dented iron helmet resting on top knob,
tattered chainmail draped over horizontal crossbar,
cracked leather chest strap hanging loose, wooden base on the ground,
transparent background, dark RPG camp prop, isolated object
--ar 2:3 --style raw --v 6.1 --q 2
--no people characters background text UI bright colors cartoon
```

## Цветовые ориентиры

**Сундук:**

- Дерево: тёмно-коричневый (#3a2010)
- Металл: тёмно-серый с ржавчиной (#4a3a2a)
- Намёк на содержимое: слабый золотистый блик из щели (#8a6a20)

**Стойка:**

- Дерево: серо-коричневый (#4a3a28)
- Шлем: тёмное железо (#3a3a3a)
- Кольчуга: холодный серый (#5a5a5a)

## Анимация hover (опционально)

Сундук: крышка чуть сильнее открывается, золотистое свечение усиливается.
Стойка: лёгкое покачивание доспехов (2–3 кадра).
