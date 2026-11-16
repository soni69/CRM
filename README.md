# TeamManager CRM

Веб-приложение для управления задачами команды: Kanban-доска, роли и права,
поиск/фильтры, подзадачи, чек-листы, комментарии, файлы, спринты, Гант,
учёт времени, отчёты, импорт/экспорт CSV.

## Стек

React 19 + TypeScript + Vite + Tailwind 4 · Express 5 + SQLite · сессии в
httpOnly-cookie · zod-контракты, общие для клиента и сервера (`shared/contracts`).

## Быстрый старт

```bash
npm install
cp .env.example .env        # опционально
npm run dev                 # клиент :5173, API :3001 (прокси настроен)
```

Открыть http://localhost:5173

### Демо-аккаунты (SEED_DEMO=true)

| Роль | Email | Пароль |
|---|---|---|
| Администратор | `admin@demo.ru` | `demo123` |
| Менеджер | `manager@demo.ru` | `demo123` |
| Участник | `member@demo.ru` | `demo123` |

## Продакшн

```bash
npm run build    # сборка клиента → client/dist
npm start        # сервер отдаёт и статику, и API на :3001
```

## Docker (публичная ссылка)

```bash
docker build -t teammanager .
docker run -p 3001:3001 -v tt_data:/app/data -v tt_uploads:/app/uploads teammanager
```

Деплой на Render/Railway: выбрать «Docker», указать репозиторий — сервис
сам соберёт образ и выдаст HTTPS-ссылку. Переменные: `SESSION_SECRET`
(обязательно в проде), `SEED_DEMO`, `PORT`.

## Структура (модульная)

```
shared/contracts/   типы + zod-схемы + пути API — контракт клиент↔сервер
server/src/
  core/             db, config, errors, uploads, scheduler, seed
  modules/<m>/      index.js / routes.js / service.js / repo.js
client/src/
  app/              роутер, layout, providers
  shared/           ui-kit (Linear-style токены), api-client, utils
  modules/<m>/      index.ts / api.ts / hooks.ts / components|pages
```

Модули: `auth`, `roles`, `tasks`, `search`, `users`, `checklists`,
`comments`, `files`, `history`, `tags`, `sprints`, `timetracking`,
`templates`, `reports`, `transfer`, `gantt`.

Правила: модуль отдаёт наружу только свой `index.*`; общее — через
`shared/` и `shared/contracts`. Починка поиска трогает только
`modules/search` на клиенте и сервере.

Подробный план — в `PLAN.md`.
