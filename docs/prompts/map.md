# Промпт: Карта (Map panel)

## Технические параметры

| Параметр      | Значение                           |
|---------------|------------------------------------|
| Сцена         | CampScene → панель карты (оверлей) |
| Размер панели | 600×620                            |
| Соотношение   | ~1:1                               |
| Слоёв         | 1 (текстура под UI)                |
| Midjourney    | `--ar 1:1`                         |

## Описание сцены

Фоновая текстура под интерактивной картой зон. Поверх неё движок рисует
прямоугольники зон с названиями и статусами. Сам фон — это пергамент или
состаренная бумага в стиле средневековой картографии.

Конкретных зон, символов зон или путей **не рисовать** — только текстуру.
Должна выглядеть как обратная сторона карты или старый картографический лист.

## Промпт (английский)

```
pixel art aged parchment texture, old medieval cartography paper background,
yellowed worn manuscript surface, ink stains and water damage marks,
faint quill pen cross-hatching at edges, torn and burned corners,
subtle faded brown ink map border ornament, dark fantasy aesthetic,
no geographic features, no labels, no symbols, pure texture only,
muted brown amber sepia palette, dark edges vignette,
hand-drawn medieval document feel, grim fantasy world map paper,
pixel art RPG map panel background texture
--ar 1:1 --style raw --v 6.1 --q 2
--no characters people text numbers symbols roads landmarks geography
```

## Цветовые ориентиры

- Основной: потёртый пергаментный бежевый (#c8a86b)
- Тёмные края: тёмно-коричневый (#4a3020)
- Пятна чернил: тёмный коричневый/тёмно-серый
- Общий тон: состаренный, тёплый, без кричащих цветов
