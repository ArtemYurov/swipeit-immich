# Архитектура: Layered Architecture (Next.js + Expo monorepo)

## Обзор

Проект Immich Swipe построен по принципу **слоистой архитектуры** (Layered Architecture). В рамках одного приложения (web или mobile) код организован по горизонтальным слоям — от UI/маршрутов сверху до сетевого/HTTP-слоя снизу. Каждый слой зависит только от слоя ниже; зависимости вверх запрещены.

Бизнес-логика как таковая (управление фотобиблиотекой, удаление, ML-распознавание лиц) полностью делегирована backend'у Immich. Локальная логика клиента сводится к:
- управлению auth-сессией
- стопкой свайпов и историей undo
- review bin (отложенное удаление)
- отображению UI

Поэтому Clean Architecture / DDD были бы избыточными — нет нетривиальной доменной модели, требующей dependency inversion. Layered даёт минимальный ceremony при ясных правилах.

## Обоснование решения

- **Тип проекта:** UI-клиент для внешнего REST API (Immich Server)
- **Tech stack:** TypeScript + Next.js (App Router) для web, TypeScript + Expo Router для mobile
- **Размер команды:** небольшой (1-3 разработчика)
- **Доменная сложность:** низкая (бизнес-правила на стороне Immich)
- **Ключевой фактор:** существующая структура `app/components/context/lib/types/` уже фактически layered — формализуем то, что есть, без рефакторинга
- **Монорепо:** два независимых layered-приложения (`client/`, `mobile/`) с зеркальной структурой; общий код **не разделяется** (сознательное дублирование типов и API-логики)

## Структура папок

### Web (`client/src/`)

```
src/
├── app/                          # Слой маршрутов (Next.js App Router)
│   ├── api/                      #   Серверные route handlers
│   │   ├── auth/check-env/       #     Проверка env для auto-login
│   │   └── proxy/[...path]/      #     Прокси к Immich API (CORS bypass, скрытие server URL)
│   ├── login/page.tsx            #   Страница логина
│   ├── layout.tsx                #   Root layout
│   └── page.tsx                  #   Главная (выбор альбома + swipe-режим)
│
├── components/                   # Слой UI-компонентов
│   ├── ui/                       #   Низкоуровневые UI-примитивы (button, input — shadcn-style)
│   ├── AssetCard.tsx             #   Карточка фотографии в swipe-стопке
│   ├── AlbumGrid.tsx             #   Сетка альбомов
│   ├── PeopleGrid.tsx            #   Сетка лиц
│   ├── MonthGrid.tsx             #   Группировка по месяцам
│   ├── ReviewBinModal.tsx        #   Финальный просмотр перед удалением
│   ├── Sidebar.tsx               #   Навигация
│   ├── StorageStats.tsx          #   Дашборд освобождённого места
│   └── Timeline.tsx              #   Временная шкала
│
├── context/                      # Слой состояния (React Context)
│   ├── AuthContext.tsx           #   Auth-сессия (token, server URL, login/logout)
│   └── SwipeContext.tsx          #   Стопка фото, undo-история, review bin
│
├── lib/                          # Сетевой/инфраструктурный слой
│   ├── api.ts                    #   Axios instance + interceptors (web использует /api/proxy)
│   └── utils.ts                  #   cn() (clsx + tailwind-merge), helpers
│
└── types/                        # Слой типов
    └── immich.ts                 #   TypeScript-типы Immich API
```

### Mobile (`mobile/`)

```
mobile/
├── app/                          # Слой маршрутов (Expo Router)
│   ├── _layout.tsx               #   Root layout
│   ├── index.tsx                 #   Главная
│   └── login.tsx                 #   Логин
│
├── components/                   # Слой UI-компонентов
│   ├── SwipeCard.tsx             #   Карточка свайпа (Reanimated + GestureHandler)
│   ├── SwipeButtons.tsx
│   ├── AlbumGrid.tsx
│   ├── PeopleGrid.tsx
│   ├── MonthGrid.tsx
│   ├── ReviewBinModal.tsx
│   ├── Sidebar.tsx
│   ├── StorageStats.tsx
│   ├── Themed.tsx                #   Темизация
│   ├── ExternalLink.tsx
│   ├── EditScreenInfo.tsx
│   ├── StyledText.tsx
│   ├── useColorScheme.ts         #   Хук (camelCase)
│   ├── useColorScheme.web.ts     #   Платформенный вариант
│   ├── useClientOnlyValue.ts
│   └── useClientOnlyValue.web.ts
│
├── context/                      # Слой состояния
│   ├── AuthContext.tsx
│   └── SwipeContext.tsx
│
├── lib/                          # Сетевой/инфраструктурный слой
│   ├── api.ts                    #   Axios instance (прямой доступ к Immich, без proxy)
│   └── utils.ts
│
├── constants/                    # Константы
│   └── Colors.ts                 #   Темы (light/dark)
│
└── types/                        # Слой типов
    └── immich.ts                 #   Зеркало client/src/types/immich.ts
```

## Правила зависимостей

```
       app/ (routes)
          ↓
     components/
          ↓
       context/
          ↓
         lib/
          ↓
        types/
```

- ✅ **Маршруты (`app/`)** могут импортировать `components/`, `context/`, `lib/`, `types/`
- ✅ **Компоненты (`components/`)** могут импортировать другие `components/`, `context/`, `lib/`, `types/`
- ✅ **Контексты (`context/`)** могут импортировать `lib/`, `types/`
- ✅ **`lib/`** может импортировать `types/`
- ✅ **`types/`** не импортирует ничего из проекта (только TypeScript built-ins или `axios`-типы)
- ❌ `lib/` **НЕ** импортирует `components/` или `context/`
- ❌ `components/` **НЕ** импортирует из `app/`
- ❌ `types/` **НЕ** импортирует из `lib/`, `components/`, `context/`, `app/`
- ❌ `client/` и `mobile/` **НЕ** импортируют друг из друга — это два независимых приложения

## Коммуникация между слоями

### Поток данных
1. **Маршрут** (`app/page.tsx`) рендерит компоненты, обёрнутые в провайдеры из `context/`
2. **Компоненты** через `useAuth()` / `useSwipe()` хуки получают доступ к глобальному состоянию
3. **Контексты** инкапсулируют side-effects: вызовы `lib/api.ts`, чтение/запись `localStorage`/`AsyncStorage`
4. **`lib/api.ts`** — единственный канал во внешний мир (Immich API)
5. **Типы из `types/immich.ts`** используются на всех слоях для контракта

### Web-специфика: серверный прокси
- Браузер → Next.js route `/api/proxy/[...path]` → Immich API
- Прокси читает заголовок `x-immich-url` из axios-instance (web) и форвардит запрос
- Цели: bypass CORS, скрытие реального server URL от клиентского bundle, логирование на серверной стороне (если потребуется)

### Mobile-специфика: прямой доступ
- Приложение → Immich API напрямую через axios
- `baseURL` устанавливается из `AsyncStorage` в request interceptor
- Нет промежуточного прокси (mobile живёт в trusted-окружении устройства)

## Ключевые принципы

1. **Слой зависит только от нижнего слоя.** Если компоненту нужны данные — он берёт их из контекста, не из `lib/api.ts` напрямую (исключение: чисто отображение данных без побочек).
2. **Один источник network-вызовов.** Все запросы к Immich — через `lib/api.ts` (axios instance). Никаких `fetch()` в компонентах.
3. **Контексты — единственное хранилище глобального состояния.** Никаких глобальных переменных, никаких внешних state-менеджеров (Redux/Zustand/MobX).
4. **Типы переиспользуются между слоями.** Контракт API живёт в `types/immich.ts` — компоненты типизируются им же.
5. **Web ↔ mobile — параллельные структуры.** Изменения в одном требуют осознанного решения по второму. Нет «общего» пакета — типы и API-логика дублируются вручную.
6. **Серверный прокси — часть security-модели.** На web НЕ убирать `/api/proxy` без обсуждения.

## Примеры кода

### Пример 1: компонент использует контекст, не api напрямую

```tsx
// ❌ ПЛОХО: компонент вызывает api напрямую — нарушает слой
import api from '@/lib/api';

export function AssetCard({ id }: { id: string }) {
  const handleDelete = async () => {
    await api.delete(`/assets/${id}`);    // ← обход контекста
  };
  // ...
}

// ✅ ХОРОШО: компонент использует hook из context-слоя
import { useSwipe } from '@/context/SwipeContext';

export function AssetCard({ id }: { id: string }) {
  const { markForDeletion } = useSwipe();
  const handleDelete = () => markForDeletion(id);
  // SwipeContext сам решает, когда фактически вызвать api
}
```

### Пример 2: контекст инкапсулирует side-effects

```tsx
// context/SwipeContext.tsx
import { createContext, useContext, useState } from 'react';
import api from '@/lib/api';
import type { Asset } from '@/types/immich';

type SwipeContextValue = {
  current: Asset | null;
  reviewBin: Asset[];
  markForDeletion: (id: string) => void;
  commitDeletions: () => Promise<void>;
};

const SwipeContext = createContext<SwipeContextValue | null>(null);

export function SwipeProvider({ children }: { children: React.ReactNode }) {
  const [reviewBin, setReviewBin] = useState<Asset[]>([]);
  const [current, setCurrent] = useState<Asset | null>(null);

  const markForDeletion = (id: string) => {
    // обновление локального state и review bin
  };

  const commitDeletions = async () => {
    // здесь — единственное место, где компоненты косвенно достигают api
    await api.delete('/assets', { data: { ids: reviewBin.map(a => a.id) } });
    setReviewBin([]);
  };

  return (
    <SwipeContext.Provider value={{ current, reviewBin, markForDeletion, commitDeletions }}>
      {children}
    </SwipeContext.Provider>
  );
}

export const useSwipe = () => {
  const ctx = useContext(SwipeContext);
  if (!ctx) throw new Error('useSwipe must be used inside SwipeProvider');
  return ctx;
};
```

### Пример 3: layered API-клиент с request interceptor

```ts
// client/src/lib/api.ts (web)
import axios from 'axios';

const api = axios.create({
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('immich_access_token');
    const serverUrl = localStorage.getItem('immich_server_url');

    if (serverUrl) {
      let baseUrl = serverUrl.replace(/\/$/, '');
      if (baseUrl.endsWith('/api')) baseUrl = baseUrl.slice(0, -4);
      // web ВСЕГДА идёт через серверный прокси
      config.baseURL = `/api/proxy`;
      config.headers['x-immich-url'] = `${baseUrl}/api`;
    }
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Пример 4: серверный прокси (Next.js route handler)

```ts
// client/src/app/api/proxy/[...path]/route.ts (схема)
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const target = req.headers.get('x-immich-url');
  if (!target) return NextResponse.json({ error: 'missing target' }, { status: 400 });

  const url = `${target}/${params.path.join('/')}${req.nextUrl.search}`;
  const auth = req.headers.get('authorization');

  const upstream = await fetch(url, { headers: auth ? { authorization: auth } : {} });
  // потоково отдаём ответ обратно
  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: upstream.headers,
  });
}
```

## Анти-паттерны

- ❌ **Импорт `lib/api.ts` напрямую из компонента.** Все запросы должны проходить через контекст или специализированный хук — иначе теряется централизованное управление auth/error/loading-состояниями.
- ❌ **`fetch()` или собственный axios-instance в компоненте.** Дублирование auth-логики и interceptors — баги расходятся.
- ❌ **Бизнес-логика в `app/page.tsx` или layout.** Маршрут должен только композировать компоненты и провайдеры.
- ❌ **Шеринг кода между `client/` и `mobile/` через симлинк / относительный импорт `../../mobile/...`.** Это сознательно запрещено — разные платформенные ограничения. Дублирование легче, чем настройка workspace + bundler-issues.
- ❌ **Глобальные мутируемые синглтоны (вне React-дерева).** Только React Context для разделяемого state.
- ❌ **Server-side секреты в `NEXT_PUBLIC_*` env.** Эти переменные попадают в клиентский bundle.
- ❌ **Прямые запросы к Immich из браузера в обход `/api/proxy`.** Сломает CORS-модель и засветит server URL.
- ❌ **Манипуляции DOM (web) или `findNodeHandle` (mobile) когда задача решается через state.** Reanimated и Framer Motion дают декларативный API — пользоваться им.
