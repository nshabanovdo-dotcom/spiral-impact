# Лицензии и происхождение картинок

Каждый сторонний файл в игре и в `art/` записан здесь: источник, автор, лицензия.
Правило проекта: чужие водяные знаки и подписи авторов **никогда не удаляются**. Картинки с неясными правами помечены «временные» и должны быть заменены до публичного выпуска.

## Фоны арен
| Арена | Происхождение | Лицензия |
|---|---|---|
| Каменный зал | нарисован кодом в `index.html` (`bakeArena`) | свой, без ограничений |
| Закатные дюны | нарисован кодом в `index.html` (`genDunes`) | свой, без ограничений |
| Небесные острова | нарисован кодом в `index.html` (`genIslands`) | свой, без ограничений |

Ранее использовавшиеся фоны «Пустынная цитадель» (работа Artur Rosa) и «Парящие острова» (промо-арт игры The Source) удалены из игры и из `art/` в v1.2. Они остаются в истории git (коммиты v0.7–v1.1); если это важно, историю нужно переписать отдельно.

## Фото-текстуры
| Файлы | Источник | Автор | Лицензия |
|---|---|---|---|
| `textures/bricks2.webp`, `bricks4`, `stone2`, `stone3`, `stone4`, `metal3`, `rust1` (уменьшены и сжаты в WebP) | WRAD Textures, https://github.com/wwwriks/wrad-textures (папка `seamless/`) | wriks (https://www.wriks.motorcycles) | CC0 1.0 — без ограничений, указывать автора не обязательно |

Текстуры с Poly Haven / ambientCG напрямую не подключались: сеть этой среды разработки не пускает к этим сайтам.

## Головы (морды)
| Морды | Файлы | Источник | Лицензия / статус |
|---|---|---|---|
| Клыкач, Рогач, Бородач, Орчиха, Фиолетовый | `heads/klykach.webp`, `rogach`, `borodach`, `orchiha`, `fioletoviy`; исходники `source/orcs/orc-*.png` | набор «200 Free Realistic Orc Hero Fantasy Character Portraits», автор Corax Digital Art: https://coraxdigitalart.itch.io/200-free-realistic-orc-hero-fantasy-character-portrait | Распространяется бесплатно (pay-what-you-want). Отдельной лицензии на странице не найдено; автор в профиле просит указывать «Corax Digital Art» и ссылку — это сделано в меню игры. Права на коммерческое использование явно не указаны: **перед коммерческим выпуском уточнить у автора** (coraxdigitalart@gmail.com). Страница itch.io недоступна из среды разработки, условия собраны по поисковой выдаче. |
| Сапфир, Магма, Старейшина, Эльфийка, Кибер, Ящер, Череп | `heads/sapfir.webp`, `magma`, `magma_glow`, `stareishina`, `elfiyka`, `kiber`, `yashcher`, `cherep`, `cherep_glow`; исходники `source/references/` | прислал владелец проекта, источник неизвестен | **Временные, заменить до публичного выпуска.** |

## Графика из игры Flare (CC BY-SA 3.0)
Источник: https://github.com/flareteam/flare-game (папки `mods/fantasycore/images/icons/icons.png` и `mods/fantasycore/images/enemies/`). Авторы — команда Flare (Clint Bellanger и др., список в `CREDITS.txt` репозитория). Лицензия Creative Commons Attribution-ShareAlike 3.0: авторство указано в меню игры; изменённые нами версии этих картинок распространяются под той же лицензией CC BY-SA 3.0.

| Файлы | Что это | Изменения |
|---|---|---|
| `weapons/morningstar.webp`, `mace`, `maul`, `staff_red`, `staff_green`, `longsword`, `sword_red`, `axe2b` | иконки оружия 64×64 | вырезаны из общего листа иконок, убран чёрный фон |
| `monsters/wyvern_run.webp`, `wyvern_fire_run.webp`, `minotaur_run.webp` | анимация полёта/бега, 8 направлений × 8 кадров | кадры собраны в атлас и уменьшены |

## Оружие и логотип
| Что | Файлы | Источник | Лицензия / статус |
|---|---|---|---|
| Цепь-секира (картинка) | `source/weapons/cep-sekira.webp`, `logos/sekira-cutout.webp`, логотип в меню `logos/logo-main.webp`, страница `logos/logos.html` | прислал владелец проекта, источник неизвестен | **Временные, заменить до публичного выпуска** (логотип собран из этой картинки). |
| Всё оружие в игре, цепи, частицы, интерфейс | код в `index.html`, `armory.js` | свой | без ограничений |

## Шрифты
Cinzel, Cinzel Decorative, UnifrakturCook, Ruslan Display, Alegreya Sans — Google Fonts, SIL Open Font License 1.1.
