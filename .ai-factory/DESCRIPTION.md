# Immich Swipe — описание проекта

## Обзор

**Immich Swipe** — кросс-платформенное приложение для быстрого ревью фотографий в self-hosted фотохостинге [Immich](https://immich.app/). Tinder-подобный UX: свайп вправо — оставить, свайп влево — удалить (soft delete в корзину Immich на 30 дней). Проект реализован как монорепо с двумя независимыми приложениями: **Next.js web-клиент** и **Expo React Native мобильное приложение** для iOS/Android.

## Основные функции

- **Tinder-style свайпы** — жесты для быстрого решения по каждой фотографии
- **Undo** — мгновенный откат последнего действия
- **Альбомы и люди** — выбор альбома или сортировка по людям (face recognition Immich)
- **Полноразмерный просмотр** — фото в высоком разрешении перед решением
- **Клавиатурные шорткаты** (web) — стрелки для управления
- **Гибкая аутентификация** — email/пароль или access token
- **Review Bin** — финальная проверка перед удалением
- **Storage Dashboard** — счётчик освобождённого места
- **Тёмная тема**, мобильный sidebar
- **HEIC/HEIF** — автоконвертация в JPEG-превью

## Tech Stack

### Web-клиент (`client/`)

- **Язык:** TypeScript 5
- **Framework:** Next.js 16 (App Router)
- **UI runtime:** React 19, React DOM 19
- **Styling:** Tailwind CSS 4, `class-variance-authority`, `tailwind-merge`, `clsx`
- **UI-компоненты:** Radix UI (`@radix-ui/react-slot`), `lucide-react` (иконки)
- **Анимация:** Framer Motion 12
- **HTTP-клиент:** Axios 1.13
- **Линтер:** ESLint 9 + `eslint-config-next`
- **Контейнеризация:** Docker (Node.js 20-alpine, multi-stage build, Next.js standalone output)

### Mobile-приложение (`mobile/`)

- **Язык:** TypeScript 5.9
- **Framework:** Expo 54 (managed workflow)
- **UI runtime:** React Native 0.81, React 19, Expo Router 6
- **Жесты и анимация:** `react-native-gesture-handler` 2.28, `react-native-reanimated` 4.1, `react-native-worklets`
- **Изображения:** `expo-image`, `expo-blur`, `expo-linear-gradient`
- **Навигация:** Expo Router (file-based)
- **Хранилище:** `@react-native-async-storage/async-storage`
- **HTTP-клиент:** Axios 1.13
- **Иконки:** `@expo/vector-icons`

### Внешние зависимости

- **Immich Server** v1.91+ — обязательная backend-зависимость, REST API
- **Аутентификация:** Bearer token (Authorization header) или email/password сессия Immich

## Архитектура

См. [`.ai-factory/ARCHITECTURE.md`](./ARCHITECTURE.md) — подробные гайдлайны архитектуры, правила зависимостей и примеры кода.

**Pattern:** Layered Architecture (`app` → `components` → `context` → `lib` → `types`).

### Web (`client/`)

- **Next.js App Router** — `src/app/` (страницы), `src/app/api/` (API-роуты, в т.ч. `/api/proxy/[...path]` для проксирования запросов к Immich-серверу с обходом CORS и сокрытия URL от клиента)
- **Глобальное состояние:** React Context — `AuthContext` (auth-сессия), `SwipeContext` (текущая стопка фото, история undo, корзина)
- **Персистентность клиента:** `localStorage` (token, server URL, review bin)
- **Компоненты:** `src/components/` (компонентные файлы в PascalCase, UI-примитивы в `src/components/ui/`)
- **Типы:** `src/types/immich.ts` — TypeScript-типы для Immich API
- **Утилиты:** `src/lib/api.ts` (Axios instance с interceptors), `src/lib/utils.ts`

### Mobile (`mobile/`)

- **Expo Router** — `app/` (file-based routing): `_layout.tsx`, `index.tsx`, `login.tsx`
- **Глобальное состояние:** React Context — `AuthContext`, `SwipeContext` (зеркалит web)
- **Персистентность:** `AsyncStorage`
- **Компоненты:** `components/` (PascalCase для компонентов, camelCase для хуков типа `useColorScheme.ts`)
- **Типы:** `types/immich.ts`
- **Утилиты:** `lib/api.ts` (прямой Axios без proxy), `lib/utils.ts`
- **Темизация:** `Themed.tsx`, `constants/Colors.ts`

### Общие принципы

- **Соглашения именования:** PascalCase для компонентов и контекстов, camelCase для функций/переменных, lowercase для роутов Next.js (`page.tsx`, `route.ts`) и файловых маршрутов Expo Router
- **Сетевой слой:** Axios + request/response interceptors для авторизации и обработки ошибок
- **Web-специфика:** проксирование через `/api/proxy` (Next.js route handler) — bypass CORS, скрытие реального URL Immich
- **Mobile-специфика:** прямой запрос к Immich API из устройства

## Нефункциональные требования

- **Логирование:** `console.error` для критических ошибок API; на web — логирование пока не централизовано
- **Обработка ошибок:** Axios interceptors отбрасывают `Promise.reject(error)`; UI-обработка локально в компонентах
- **Безопасность:**
  - токены хранятся в `localStorage` / `AsyncStorage` (открытым текстом — риск XSS на web)
  - публичные `NEXT_PUBLIC_*` переменные попадают в bundle — credentials в них использовать только в локальной dev-среде
  - проксирование запросов на web сокращает поверхность утечки серверного URL
- **Производительность:**
  - изображения через `expo-image` (caching) и Next.js встроенную оптимизацию
  - анимации на UI-thread через Reanimated 4 / Framer Motion
- **Доступность:** клавиатурные шорткаты (web), кнопки-альтернативы свайпам (mobile)
- **Soft delete:** удалённые фото попадают в корзину Immich на 30 дней — действие реверсивно

## Точки входа

- Web: `client/src/app/page.tsx` (главная), `client/src/app/login/page.tsx`
- Mobile: `mobile/app/_layout.tsx` (root layout), `mobile/app/index.tsx` (главный экран)
- Backend proxy: `client/src/app/api/proxy/[...path]/route.ts`
- Docker: `client/Dockerfile`, `client/docker-compose.yml`

## Деплой

- **Web:** Docker-образ (multi-stage build, Next.js standalone). Опубликован как `blackdevil0070/swipeit:latest`. Порт 3000.
- **Mobile:** Expo Go (dev), `npx expo run:android|ios` (локальный build), EAS Build (cloud build)
