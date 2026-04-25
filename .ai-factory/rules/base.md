# Базовые правила проекта

> Конвенции, автоматически выявленные из кодовой базы (Next.js + Expo monorepo). Допускают ручную правку.

## Соглашения именования

- **Файлы компонентов:** `PascalCase.tsx` — например `AssetCard.tsx`, `Sidebar.tsx`, `MonthGrid.tsx`
- **UI-примитивы (web):** `lowercase.tsx` в `src/components/ui/` — `button.tsx`, `input.tsx` (стиль shadcn/ui)
- **Контексты:** `PascalCaseContext.tsx` — `AuthContext.tsx`, `SwipeContext.tsx`
- **Хуки:** `useCamelCase.ts` — `useColorScheme.ts`, `useClientOnlyValue.ts`; платформенные варианты через суффикс `.web.ts`
- **Утилиты:** `camelCase.ts` в `lib/` — `api.ts`, `utils.ts`
- **Файлы маршрутов Next.js:** `page.tsx`, `route.ts`, `layout.tsx` (lowercase, диктуется App Router)
- **Файлы маршрутов Expo Router:** `index.tsx`, `_layout.tsx`, `login.tsx` (lowercase, диктуется Expo Router)
- **Типы:** lowercase-файл, описывает один логический модуль — `types/immich.ts`, `src/types/immich.ts`
- **Переменные/функции:** `camelCase`
- **Компоненты React:** `PascalCase`
- **Константы окружения:** `UPPER_SNAKE_CASE`, web-публичные с префиксом `NEXT_PUBLIC_`

## Структура модулей

### Web (`client/`)
- `src/app/` — маршруты Next.js App Router (страницы, layouts, API-routes)
- `src/app/api/` — серверные API-routes (включая прокси к Immich `api/proxy/[...path]/route.ts`)
- `src/components/` — переиспользуемые React-компоненты
- `src/components/ui/` — низкоуровневые UI-примитивы (стиль shadcn)
- `src/context/` — React Context-провайдеры глобального состояния
- `src/lib/` — утилиты, HTTP-клиент, helper-функции
- `src/types/` — TypeScript-типы

### Mobile (`mobile/`)
- `app/` — экраны Expo Router (file-based routing)
- `components/` — переиспользуемые React Native компоненты
- `context/` — React Context-провайдеры
- `lib/` — утилиты, HTTP-клиент
- `types/` — TypeScript-типы
- `constants/` — константы (цвета и т.п.)
- `assets/` — статические ресурсы

### Корень репозитория
- `client/` и `mobile/` — два независимых package.json и lockfile, общий код **не разделяется** (типы и API-логика дублируются осознанно)
- `assets/` — общие скриншоты для README
- Корневого workspace/monorepo-менеджера (npm/yarn workspaces, pnpm, turborepo) нет

## Язык и типизация

- **TypeScript обязателен** для нового кода в `client/` и `mobile/`
- `tsconfig.json` своего на каждое приложение, `strict` режим включён через Next.js / Expo defaults
- Типы внешних API описывать в `types/immich.ts`, не выносить inline в компоненты

## Стили (web)

- **Tailwind CSS 4** — основной механизм стилизации
- Утилиты-комбинаторы: `clsx` для условных классов, `tailwind-merge` через `lib/utils.ts` (паттерн shadcn `cn()`)
- `class-variance-authority` для вариантов компонентов

## Стили (mobile)

- StyleSheet из React Native + темизация через `Themed.tsx` и `constants/Colors.ts`
- Анимация — **Reanimated 4** на UI-thread, жесты — `react-native-gesture-handler`

## Глобальное состояние

- **React Context** (без Redux/Zustand/MobX) — провайдеры в `context/`
- Каждый контекст пара `<XContext>` + `useX()` хук
- Персистентность:
  - web — `localStorage`
  - mobile — `AsyncStorage` (асинхронный API)

## Сетевой слой

- **Axios instance** — единственный для каждого приложения (`lib/api.ts`)
- Auth и base URL прокидываются через **request interceptor**
- Web проксирует все запросы через собственный route `/api/proxy/[...path]` (защита от CORS и скрытие server URL); mobile ходит к Immich API напрямую
- Token и server URL читаются из `localStorage` / `AsyncStorage` с фоллбеком на `NEXT_PUBLIC_*` env (только web)

## Обработка ошибок

- Axios `response.interceptors.use` возвращает `Promise.reject(error)` — централизованной обёртки нет
- На уровне UI — `try/catch` локально в компонентах/контекстах
- На mobile — `console.error('API Error:', ...)` в response interceptor

## Логирование

- **Не централизовано.** В коде используются `console.error` (mobile API) и `console.error` в catch-блоках
- Структурированных логгеров (`pino`, `winston`, `expo-dev-client logs`) **нет**

## Тестирование

- **Тестов нет.** Нет конфигураций jest/vitest/playwright/detox
- При добавлении тестов: для web — Playwright (рекомендуется в connector-список MCP), для mobile — `react-test-renderer` (уже в `devDependencies` mobile)

## Линтинг и форматирование

- **Web:** ESLint 9 + `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`
- **Mobile:** ESLint **не сконфигурирован** (отсутствует `eslint.config.*` в `mobile/`)
- Prettier явно не сконфигурирован — стиль кода поддерживается ESLint и редактором

## Безопасность и токены

- **Никогда не коммитить** реальные значения `NEXT_PUBLIC_IMMICH_*` — только `.env.example` шаблон
- Помнить: `NEXT_PUBLIC_*` попадают в клиентский bundle — там нет места для серверных секретов
- Токены в `localStorage`/`AsyncStorage` хранятся открытым текстом — это известный trade-off, не вводить новые secrets без обсуждения

## Соглашения по комментариям

- В коде комментарии — **на английском**
- Комментировать нужно **«почему»**, а не «что». Хорошо именованный код «что» рассказывает сам

## Git

- `master` — основная ветка (см. `.ai-factory/config.yaml: git.base_branch`)
- Префикс feature-веток: `feature/`
- ВСЕГДА создавать backup-ветку перед `git rebase` (см. `~/.claude/CLAUDE.md`)
- Коммиты — без `Generated with Claude Code` и `Co-Authored-By: Claude` строк
- Перед каждым коммитом — подтверждение пользователя
