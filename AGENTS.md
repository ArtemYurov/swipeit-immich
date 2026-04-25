# AGENTS.md

> Карта проекта для AI-агентов. Поддерживается актуальной при существенных структурных изменениях. Для деталей стека и архитектуры обращайтесь к файлам, перечисленным в разделе «AI Context Files».

## Обзор проекта

Кросс-платформенное приложение для быстрого ревью фотографий в self-hosted фотохостинге Immich. Tinder-подобный свайп-UX в виде Next.js web-клиента и Expo React Native мобильного приложения, работающих как монорепо с двумя независимыми package.json.

## Tech Stack

- **Язык:** TypeScript 5
- **Web framework:** Next.js 16 (App Router) + React 19 + Tailwind CSS 4
- **Mobile framework:** Expo 54 + React Native 0.81 + Expo Router 6 + Reanimated 4
- **HTTP-клиент:** Axios 1.13 (interceptors для auth и base URL)
- **Состояние:** React Context (`AuthContext`, `SwipeContext`)
- **Persistence:** `localStorage` (web), `AsyncStorage` (mobile)
- **Backend:** внешний — Immich Server v1.91+ (REST API)
- **Контейнеризация:** Docker (только web)

## Структура проекта

```
swipeit-immich/
├── client/                       # Next.js web-клиент
│   ├── src/
│   │   ├── app/                  # App Router: страницы, layouts, API-routes
│   │   │   ├── api/              # Серверные route handlers (включая прокси)
│   │   │   │   ├── auth/check-env/route.ts
│   │   │   │   └── proxy/[...path]/route.ts   # Прокси к Immich (CORS bypass)
│   │   │   ├── login/page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx          # Главная страница
│   │   ├── components/           # React-компоненты (PascalCase)
│   │   │   └── ui/               # UI-примитивы (lowercase, shadcn-style)
│   │   ├── context/              # AuthContext, SwipeContext
│   │   ├── lib/                  # Axios instance, утилиты
│   │   └── types/                # TypeScript-типы (immich.ts)
│   ├── public/                   # Статические ассеты
│   ├── Dockerfile                # Multi-stage build (Node 20-alpine)
│   ├── docker-compose.yml
│   ├── eslint.config.mjs
│   ├── next.config.ts
│   ├── postcss.config.mjs
│   ├── tsconfig.json
│   └── package.json
│
├── mobile/                       # Expo React Native приложение
│   ├── app/                      # Expo Router: экраны (file-based)
│   │   ├── _layout.tsx           # Root layout
│   │   ├── index.tsx             # Главный экран
│   │   └── login.tsx
│   ├── components/               # React Native компоненты
│   ├── constants/                # Colors, прочие константы
│   ├── context/                  # AuthContext, SwipeContext
│   ├── lib/                      # Axios instance, утилиты
│   ├── types/                    # TypeScript-типы (immich.ts)
│   ├── assets/                   # Иконки, шрифты, изображения
│   ├── app.json                  # Expo-конфигурация
│   ├── tsconfig.json
│   └── package.json
│
├── assets/                       # Общие скриншоты для README
├── .ai-factory/                  # AI Factory: конфиг и артефакты
├── .claude/                      # Claude Code: установленные skills и agents
├── README.md
├── PUBLISHING.md                 # Заметки по публикации
├── LICENSE                       # MIT
└── AGENTS.md                     # Этот файл
```

> Корневого workspace-менеджера нет: `client/` и `mobile/` — независимые npm-проекты с собственными `package.json` и `package-lock.json`. Общий код **не шарится**: типы Immich и логика API сознательно дублируются.

## Ключевые точки входа

| Файл | Назначение |
|------|------------|
| `client/src/app/page.tsx` | Главная страница web-клиента (выбор альбома, swipe-режим) |
| `client/src/app/login/page.tsx` | Логин web (email/password или access token) |
| `client/src/app/api/proxy/[...path]/route.ts` | Серверный прокси к Immich API (bypass CORS, скрытие server URL) |
| `client/src/lib/api.ts` | Axios instance + interceptors (web) |
| `client/src/context/SwipeContext.tsx` | Стопка фото, история undo, корзина review bin |
| `mobile/app/_layout.tsx` | Root layout Expo Router |
| `mobile/app/index.tsx` | Главный экран mobile |
| `mobile/app/login.tsx` | Логин mobile |
| `mobile/lib/api.ts` | Axios instance + interceptors (mobile) |
| `mobile/context/SwipeContext.tsx` | Стопка фото, история undo, корзина review bin |
| `client/Dockerfile` | Production-сборка web (Next.js standalone) |
| `client/.env.example` | Шаблон env для web-клиента |

## Документация

| Документ | Путь | Описание |
|----------|------|----------|
| README | `README.md` | Описание проекта, Quick Start, установка, конфигурация, troubleshooting |
| Publishing | `PUBLISHING.md` | Заметки по публикации (Docker Hub) |
| License | `LICENSE` | MIT |

## AI Context Files

| Файл | Назначение |
|------|------------|
| `AGENTS.md` | Структурная карта проекта (этот файл) |
| `.ai-factory/DESCRIPTION.md` | Подробное описание стека, архитектуры и НФТ |
| `.ai-factory/ARCHITECTURE.md` | Гайдлайны архитектуры (создаётся через `/aif-architecture`) |
| `.ai-factory/config.yaml` | Конфигурация AI Factory (язык, пути, git-настройки) |
| `.ai-factory/rules/base.md` | Базовые конвенции проекта (именование, структура, стили) |
| `.claude/skills/` | Установленные skills AI Factory |

## Правила для AI-агентов

- **Декомпозиция shell-команд:** не объединять команды через `&&`, если каждая шагов проверяема отдельно
  - Неправильно: `git checkout master && git pull`
  - Правильно: сначала `git checkout master`, затем `git pull origin master`
- **Язык общения:** русский (см. `~/.claude/CLAUDE.md`); технические термины (Next.js, Expo, API) оставлять на английском
- **Комментарии в коде:** на русском, если автор PR не попросит иначе
- **Перед `git rebase`:** обязательно создавать backup-ветку: `git branch backup/<branch-name>-YYYY-MM-DD`
- **Коммиты:** ВСЕГДА запрашивать подтверждение пользователя перед `git commit`; не добавлять `Generated with Claude Code` и `Co-Authored-By: Claude` в описание
- **`git mv`** — для перемещения уже отслеживаемых файлов
- **Монорепо:** не пытаться вынести общий код между `client/` и `mobile/` без отдельной задачи — дублирование сейчас сознательное
- **Типы Immich API:** изменения в `client/src/types/immich.ts` обычно требуют синхронных изменений в `mobile/types/immich.ts`
- **Web-прокси:** все клиентские запросы к Immich на web идут через `/api/proxy/[...path]` — не убирать без обсуждения, это часть security-модели
