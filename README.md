# KYN — сайт-каталог керамики для подарков и бизнеса

Статический сайт без сборки: `site/index.html`.

## Запуск локально

```bash
cd site && python3 -m http.server 8000
# открыть http://localhost:8000
```

Для публикации достаточно залить папку `site/` на любой хостинг (GitHub Pages, Netlify, Tilda-хостинг статики и т. п.).

## Что где менять

| Что | Где |
|---|---|
| Позиции каталога, размеры, цены (розница / от 20 / от 50 шт) | `site/data/products.js` → `rows` |
| Подарочные наборы | `site/data/products.js` → `KYN.SETS` (состав — номера позиций) |
| Глазури и глина | `site/data/products.js` → `KYN.GLAZES`, `KYN.CLAYS` |
| **Контакты (сейчас заглушки!)** | `site/data/products.js` → `KYN.CONTACTS` |
| Фото изделий | файлы в `site/assets/img/`, затем `KYN.PHOTOS = { 7: 'файл.jpg' }` |
| Цвета | `site/css/styles.css` → `:root` |
| Тексты разделов | `site/index.html` |

## Бренд

- Логотип извлечён из брендбука KYN в вектор: `site/assets/logo-kyn-dark.svg` (тёмно-синий #002B54), `logo-kyn-white.svg`, `logo-kyn-mark.svg`, `favicon.svg`.
- Шрифты брендбука: **Days One** (заголовки), **Nunito Sans** (текст) — подключены с Google Fonts.
- Палитра — тёплые керамические тона (вдохновение Matiz Ceramic Studio) + фирменные акценты KYN: sun #F9E547, dark #002B54.

Пока нет фотографий, изделия показываются цветными плитками с силуэтами (как в палитре глазурей).
