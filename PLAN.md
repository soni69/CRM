# План проекта: CRM — управление задачами команды

Веб-приложение для управления задачами команды: авторизация, роли и права,
Kanban-доска со статусами, поиск и фильтрация. Данные сохраняются на сервере,
приложение доступно по публичной ссылке, интерфейс адаптирован под
десктоп и телефон.

Ключевой принцип архитектуры — **изолированные модули**. Каждый модуль живёт
в своей папке и общается с остальными только через публичный контракт
(`index.ts` / `index.js`). Чиним поиск — не трогаем вход, чиним права — не
трогаем задачи.

---

## 1. Функционал (полный список)

### Из ТЗ
- Создание, редактирование, удаление задач
- Назначение ответственного за задачу
- Статусы = настраиваемые колонки доски (по умолчанию «Новая», «В работе», «Завершена») + смена статуса;
  создание/переименование/перестановка/цвет/скрытие колонок, флаг «финальный» статус
- Поиск и фильтрация задач
- Данные сохраняются после перезагрузки страницы
- Авторизация пользователя (только вход; учётки создаёт админ)

### Дополнительно (роли — по вашему уточнению)
- Три роли: **admin**, **manager**, **member**
- Матрица прав на стороне сервера и на клиенте
- Страница управления пользователями (только admin)

### Расширенные задачи 
- Подзадачи — дерево задач через `parent_id`
- Чек-листы внутри задачи с прогрессом выполнения
- Соисполнители и наблюдатели — несколько участников у одной задачи
- Шаблоны задач и повторяющиеся задачи (каждый день/неделю/месяц)
- Диаграмма Ганта (по `start_date` + `due_date`)
- Учёт времени: плановая оценка + фактические списания
- Отчёты: просроченные задачи, выполнено по людям, затраченное время
- Комментарии и файлы-вложения в задаче
- История изменений задачи (кто, что, когда поменял)
- Теги с цветами + фильтр по тегам
- Scrum: спринты, привязка задач к спринту, доска спринта
- Массовые действия: смена статуса/исполнителя/удаление выделенных
- Импорт/экспорт задач в CSV

### Поля задачи
`title`, `description`, `status`, `priority` (low/medium/high),
`start_date`, `due_date`, `assignee` (ответственный), `creator`,
`parent_id` (подзадачи), `sprint_id`, `time_estimate` (мин),
`created_at`, `updated_at`

---

## 2. Стек

| Слой | Технология | Почему |
|---|---|---|
| Клиент | React 18 + TypeScript + Vite | быстрая сборка, строгая типизация |
| Стили | Tailwind CSS | адаптив под мобильные из коробки |
| Роутинг | React Router | стандарт |
| Данные на клиенте | TanStack Query | кэш, инвалидация после CRUD |
| Сервер | Node.js + Express | простой, предсказуемый |
| БД | SQLite (better-sqlite3) | один файл, ноль внешних зависимостей, данные переживают перезапуск |
| Авторизация | httpOnly cookie-сессия + bcryptjs | не светим токен в JS/localStorage |
| Валидация | zod, общие схемы клиент↔сервер | один источник правды для контрактов |
| Загрузка файлов | multer → `uploads/` | вложения задач |
| Гант | свой SVG-компонент | без тяжёлой зависимости, даты уже есть |
| CSV | papaparse | импорт/экспорт задач |
| Деплой | Dockerfile → Render / Railway / Fly.io | публичная HTTPS-ссылка бесплатно |

*Альтернатива полегче:* только фронтенд + localStorage, деплой на Vercel —
проще, но авторизация будет «игрушечной» и данные живут в одном браузере.
Рекомендую полный вариант с сервером — роли и права в нём настоящие.

---

## 3. Структура проекта

```
CRM/
├── PLAN.md
├── package.json                  # npm workspaces: client + server
├── Dockerfile                    # единый образ: собирает клиент, отдаёт его сервером
├── .env.example
├── README.md                     # запуск, деплой, тестовые аккаунты
│
├── shared/                       # КОНТРАКТЫ — единственное, что импортируют все
│   └── contracts/
│       ├── auth.ts               # схемы login + createUser (админ), тип Session
│       ├── task.ts               # тип Task, статусы, приоритеты, zod-схемы
│       ├── user.ts               # тип User, роли
│       └── api.ts                # имена эндпоинтов
│
├── server/
│   └── src/
│       ├── index.js              # только запуск: app.listen
│       ├── app.js                # express() + подключение модулей (5 строк на модуль)
│       ├── core/                 # инфраструктура — не знает про бизнес-логику
│       │   ├── db.js             # SQLite, схема таблиц, миграции
│       │   ├── config.js         # env-переменные
│       │   ├── errors.js         # ApiError + обработчик ошибок
│       │   ├── uploads.js        # multer: диск `uploads/`, лимиты, MIME-фильтр
│       │   ├── scheduler.js      # таймер: создаёт задачи по расписанию (recurring)
│       │   └── seed.js           # демо-пользователи и задачи при первом старте
│       └── modules/              # ← КАЖДЫЙ МОДУЛЬ В СВОЕЙ ПАПКЕ
│           ├── auth/             # ВХОД: login, logout, GET /me (регистрации нет)
│           │   ├── index.js      # публичный экспорт: router + requireAuth
│           │   ├── routes.js
│           │   ├── service.js    # хэширование, сессии
│           │   └── repo.js       # SQL к таблице users
│           ├── roles/            # ПРАВА: единственное место, где живёт матрица прав
│           │   ├── index.js      # экспорт: can(), requirePermission()
│           │   ├── permissions.js# матрица роль → список прав
│           │   └── guard.js      # middleware проверки права
│           ├── tasks/            # ЗАДАЧИ: CRUD + статусы + подзадачи + участники
│           │   ├── index.js      # экспорт: router
│           │   ├── routes.js     # в т.ч. PATCH /bulk — массовые действия
│           │   ├── service.js    # бизнес-правила (кто что может — спрашивает roles)
│           │   └── repo.js       # SQL: tasks, task_members, видимость
│           ├── checklists/       # ЧЕК-ЛИСТЫ: пункты задачи + прогресс
│           ├── comments/         # КОММЕНТАРИИ к задаче
│           ├── files/            # ВЛОЖЕНИЯ: upload/download/delete
│           ├── history/          # ИСТОРИЯ: recordEvent() вызывают другие модули
│           ├── tags/             # ТЕГИ: CRUD + привязка к задачам
│           ├── sprints/          # СПРИНТЫ (Scrum)
│           ├── timetracking/     # УЧЁТ ВРЕМЕНИ: оценки и списания
│           ├── templates/        # ШАБЛОНЫ + повторяющиеся задачи
│           ├── reports/          # ОТЧЁТЫ: просрочка, по людям, по времени
│           ├── transfer/         # ИМПОРТ/ЭКСПОРТ CSV
│           ├── search/           # ПОИСК: фильтрация и полнотекстовый поиск
│           │   ├── index.js      # экспорт: router (GET /api/search/tasks?...)
│           │   ├── routes.js
│           │   └── query.js      # сборка WHERE: q/status/assignee/tag/sprint/...
│           └── users/            # ПОЛЬЗОВАТЕЛИ: список для «ответственного», управление
│               ├── index.js
│               ├── routes.js
│               └── repo.js
# Каждый новый модуль — та же раскладка файлов: index.js / routes.js /
# service.js / repo.js. Файлы в дереве показаны на примере auth и tasks.
│
└── client/
    ├── index.html
    ├── vite.config.ts
    └── src/
        ├── main.tsx
        ├── app/                  # каркас — не содержит бизнес-логики
        │   ├── router.tsx        # маршруты + защита приватных страниц
        │   ├── layout.tsx        # шапка, навигация, контейнер
        │   └── providers.tsx     # QueryClient, сессия
        ├── shared/               # то, что разрешено импортировать всем
        │   ├── api/client.ts     # fetch-обёртка: cookies, ошибки, типизация
        │   ├── ui/               # Button, Input, Modal, Select, Badge, Avatar,
        │   │                     # ConfirmDialog, Toast, Spinner, EmptyState
        │   ├── hooks/            # useDebounce, useMediaQuery
        │   └── utils/            # formatDate, cn()
        └── modules/              # ← КАЖДЫЙ МОДУЛЬ В СВОЕЙ ПАПКЕ
            ├── auth/             # ВХОД (третья папка)
            │   ├── index.ts      # публично: useAuth(), LoginPage
            │   ├── api.ts        # login/logout/me запросы
            │   ├── hooks.ts      # useAuth — сессия, useLogin
            │   └── pages/        # LoginPage.tsx, AuthLayout.tsx
            ├── roles/            # ПРАВА НА КЛИЕНТЕ
            │   ├── index.ts      # публично: useCan(), RoleGuard
            │   ├── permissions.ts# зеркало матрицы прав для UI (скрыть кнопки)
            │   └── RoleGuard.tsx # <RoleGuard need="task.delete">…
            ├── tasks/            # ЗАДАЧИ: доска, карточка, подзадачи, выделение
            │   ├── index.ts      # публично: BoardPage, ListPage, TaskModal
            │   ├── api.ts        # CRUD + bulk-запросы
            │   ├── hooks.ts      # useTasks, useCreateTask, useUpdateStatus,
            │   │                 # useSelection (массовые действия)
            │   └── components/   # BoardColumn, TaskCard, TaskModal, StatusMenu,
            │                     # SubtaskList, BulkBar
            ├── gantt/            # ГАНТ: SVG-таймлайн задач
            ├── checklists/       # ЧЕК-ЛИСТ: пункты + прогресс внутри TaskModal
            ├── comments/         # КОММЕНТАРИИ: лента + форма в TaskModal
            ├── files/            # ВЛОЖЕНИЯ: upload, список, скачивание
            ├── history/          # ИСТОРИЯ: лента изменений в TaskModal
            ├── tags/             # ТЕГИ: TagPicker, TagBadge, управление
            ├── sprints/          # СПРИНТЫ: страница спринтов, доска спринта
            ├── timetracking/     # ВРЕМЯ: списание, прогресс к оценке
            ├── templates/        # ШАБЛОНЫ: выбор при создании, расписание
            ├── reports/          # ОТЧЁТЫ: страница с таблицами
            ├── transfer/         # ИМПОРТ/ЭКСПОРТ: кнопки, диалог маппинга CSV
            ├── search/           # ПОИСК (одна папка)
            │   ├── index.ts      # публично: SearchBar, FilterChips, useTaskQuery
            │   ├── api.ts        # запросы к /api/search/tasks
            │   ├── hooks.ts      # useTaskFilters — состояние фильтров (URL-параметры)
            │   └── components/   # SearchBar.tsx, FilterChips.tsx
            └── users/            # ПОЛЬЗОВАТЕЛИ
                ├── index.ts      # публично: UsersPage, AssigneeSelect, MemberPicker
                ├── api.ts
                ├── hooks.ts      # useUsers
                └── pages/        # UsersPage.tsx (admin)
# Раскладка у всех модулей одинаковая: index.ts / api.ts / hooks.ts /
# components|pages. Файлы в дереве показаны на примере auth, tasks, search.
```

### Правила изоляции (как не «ложится весь сайт»)
1. Модуль наружу отдаёт **только** то, что экспортировано из его `index.ts`.
   Импорт «вглубь» чужого модуля запрещён.
2. Общее — только через `shared/` и `shared/contracts/`. Если куском кода
   пользуются два модуля — он переезжает в `shared`.
3. На сервере `tasks` не знает про `roles` внутренности — только вызывает
   `requirePermission('task.update.any')`. Правила поменялись → правим один
   файл `permissions.js`, модули не трогаем.
4. Поиск — отдельный эндпоинт и отдельный UI-модуль. Сломался поиск —
   доска с задачами продолжает работать.
5. Эндпоинты описаны в `shared/contracts/api.ts` — клиент и сервер
   согласованы без импорта чужого кода.

---

## 4. Модель данных (SQLite)

```sql
users(
  id            INTEGER PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'member'
                CHECK (role IN ('admin','manager','member')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

sessions(
  token      TEXT PRIMARY KEY,        -- случайный токен в httpOnly cookie
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);

tasks(
  id               INTEGER PRIMARY KEY,
  title            TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  status           TEXT NOT NULL DEFAULT 'new'
                   CHECK (status IN ('new','in_progress','done')),
  priority         TEXT NOT NULL DEFAULT 'medium'
                   CHECK (priority IN ('low','medium','high')),
  start_date       TEXT,                       -- для Ганта
  due_date         TEXT,
  assignee_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  creator_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id        INTEGER REFERENCES tasks(id) ON DELETE CASCADE,  -- подзадача
  sprint_id        INTEGER REFERENCES sprints(id) ON DELETE SET NULL,
  time_estimate    INTEGER NOT NULL DEFAULT 0, -- план, минуты
  recurrence       TEXT,                       -- JSON: {freq:'day|week|month', next_run}
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

task_members(                                  -- соисполнители и наблюдатели
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind    TEXT NOT NULL CHECK (kind IN ('participant','observer')),
  PRIMARY KEY (task_id, user_id, kind)
);

checklist_items(
  id       INTEGER PRIMARY KEY,
  task_id  INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  text     TEXT NOT NULL,
  done     INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0
);

task_comments(
  id         INTEGER PRIMARY KEY,
  task_id    INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

task_attachments(
  id          INTEGER PRIMARY KEY,
  task_id     INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  uploader_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename    TEXT NOT NULL,       -- имя на диске (uuid)
  orig_name   TEXT NOT NULL,       -- исходное имя файла
  size        INTEGER NOT NULL,
  mime        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

task_events(                                   -- история изменений
  id         INTEGER PRIMARY KEY,
  task_id    INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  actor_id   INTEGER NOT NULL REFERENCES users(id),
  type       TEXT NOT NULL,        -- 'status','field','comment','file','member',…
  payload    TEXT NOT NULL,        -- JSON: {field, from, to}
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

tags(
  id    INTEGER PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#888888'
);
task_tags(
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id  INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

sprints(
  id         INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  goal       TEXT NOT NULL DEFAULT '',
  start_date TEXT NOT NULL,
  end_date   TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'planned'
             CHECK (status IN ('planned','active','closed'))
);

time_entries(                                  -- учёт времени
  id         INTEGER PRIMARY KEY,
  task_id    INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  minutes    INTEGER NOT NULL CHECK (minutes > 0),
  work_date  TEXT NOT NULL,
  comment    TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

task_templates(
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  priority    TEXT NOT NULL DEFAULT 'medium',
  checklist   TEXT NOT NULL DEFAULT '[]',      -- JSON-массив пунктов
  creator_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
);
-- индексы: tasks(status), tasks(assignee_id), tasks(parent_id),
--          tasks(sprint_id), tasks(due_date), task_events(task_id)
```

---

## 5. Матрица прав (модуль roles)

| Действие | member | manager | admin |
|---|:---:|:---:|:---:|
| Вход / выход | ✓ | ✓ | ✓ |
| Просмотр доски и списка задач | только свои¹ | все | все |
| Поиск и фильтрация | внутри своих¹ | по всем | по всем |
| Создать задачу | ✓ | ✓ | ✓ |
| Назначить ответственного | только себя | любого | любого |
| Менять статус | своих задач¹ (не наблюдатель²) | любых | любых |
| Редактировать задачу | свои созданные | любые | любые |
| Удалить задачу | — | любые | любые |
| Комментарии / чек-лист / списание времени | в своих задачах¹ | в любых | в любых |
| Файлы: загрузка | в своих задачах¹ | в любых | в любых |
| Теги, спринты, шаблоны | создавать | создавать | создавать + удалять чужие |
| Импорт/экспорт | только свои¹ | ✓ | ✓ |
| Отчёты по команде | только по себе | ✓ | ✓ |
| Управление пользователями и ролями | — | — | ✓ |

¹ «Свои задачи» = задачи, где пользователь исполнитель, автор, соисполнитель
или наблюдатель (`assignee_id`, `creator_id` или запись в `task_members`).
Видимость фильтруется одним предикатом `visibleTasksWhere(user)` в
`tasks/repo.js` и `search/query.js` — правило меняется в одном месте.

² Наблюдатель только смотрит задачу и комментарии — редактировать,
менять статус и списывать время не может.

Проверка — всегда на сервере (`requirePermission`); на клиенте `useCan()`
только прячет недоступные кнопки.

---

## 6. API (префикс /api)

```
# auth
POST   /api/users                 { name, email, password, role } — только админ
POST   /api/auth/login           { email, password }
POST   /api/auth/logout
GET    /api/auth/me              → текущий пользователь + роль

# tasks (требует входа; member видит только «свои»)
GET    /api/tasks                → задачи (с creator/assignee/tags/счётчиками)
POST   /api/tasks                { title, description?, priority?, start_date?,
                                   due_date?, assignee_id?, parent_id?, sprint_id?,
                                   time_estimate?, participant_ids?, observer_ids? }
GET    /api/tasks/:id            → задача + подзадачи + участники + прогресс чек-листа
PATCH  /api/tasks/:id            редактирование (права по матрице)
PATCH  /api/tasks/:id/status     { status }   — смена статуса
PATCH  /api/tasks/bulk           { ids, action: 'status'|'assign'|'delete', value }
DELETE /api/tasks/:id

# checklists / comments / files / history (вложены в задачу)
POST   /api/tasks/:id/checklist  { text }
PATCH  /api/checklist/:id        { text? | done? }
DELETE /api/checklist/:id
GET    /api/tasks/:id/comments
POST   /api/tasks/:id/comments   { body }
DELETE /api/comments/:id
GET    /api/tasks/:id/files
POST   /api/tasks/:id/files      multipart/form-data
GET    /api/files/:id/download
DELETE /api/files/:id
GET    /api/tasks/:id/history    → лента task_events

# tags
GET    /api/tags                 POST /api/tags   { name, color }
PATCH  /api/tags/:id             DELETE /api/tags/:id
PUT    /api/tasks/:id/tags       { tag_ids }

# sprints
GET    /api/sprints              POST /api/sprints { name, goal, start_date, end_date }
PATCH  /api/sprints/:id          { … | status }   — start/close спринта
DELETE /api/sprints/:id

# timetracking
POST   /api/tasks/:id/time       { minutes, work_date, comment? }
GET    /api/tasks/:id/time       → списания по задаче

# templates + recurring
GET    /api/templates            POST /api/templates  { name, title, …, checklist }
DELETE /api/templates/:id
POST   /api/tasks/from-template/:id                → создать задачу по шаблону
PATCH  /api/tasks/:id/recurrence { freq: 'day'|'week'|'month' | null }

# reports
GET    /api/reports/overview?from=&to=
       → просроченные, выполнено по людям, списанное время
       (member получает срез только по себе)

# transfer
GET    /api/tasks/export.csv     → все видимые задачи
POST   /api/tasks/import         multipart csv → { created, errors }

# search (требует входа)
GET    /api/search/tasks?q=&status=&assignee_id=&priority=&tag_id=
       &sprint_id=&overdue=&due_before=&due_after=
       → тот же формат, что /api/tasks, но с фильтрами
       (q ищет по title + description + комментариям)

# users
GET    /api/users                → список (для выбора ответственного)
PATCH  /api/users/:id/role       { role }     — только admin
DELETE /api/users/:id                         — только admin
```

Каждый блок `# …` = один серверный модуль из п. 3. `history` — единственный
модуль без собственных POST: в него пишут другие модули через `recordEvent()`.

Ответы/запросы валидируются zod-схемами из `shared/contracts/`.

---

## 7. Страницы и UI

| Маршрут | Модуль | Что на странице |
|---|---|---|
| `/login` | auth | форма входа, валидация |
| `/` | tasks + search | Kanban-доска (3 колонки), поиск и фильтры сверху, переключатель вида: Доска / Список / Гант |
| `/` (мобильный) | tasks | колонки превращаются в табы «Новые / В работе / Готово» |
| `/gantt` | gantt | таймлайн задач по датам (SVG), drag для сдвига — v2, сначала read-only |
| `/sprints`, `/sprints/:id` | sprints | список спринтов; доска спринта с его задачами |
| `/reports` | reports | просроченные, выполнено по людям, списанное время (таблицы) |
| `/users` | users | список пользователей, смена роли, удаление (admin) |
| модалка задачи | tasks + секции | вкладки: Поля / Чек-лист / Подзадачи / Комментарии / Файлы / Время / История |

Доска: чекбокс-выделение карточек → панель массовых действий (BulkBar);
в шапке — кнопки импорта/экспорта CSV (модуль transfer). В карточке:
теги, аватар ответственного, счётчики (подзадачи, комментарии, файлы,
чек-лист x/y), маркер просрочки.

Общее: шапка с логотипом, именем пользователя и кнопкой выхода;
тосты об успехе/ошибке; ConfirmDialog на удаление; empty-state,
когда задач нет; скелетоны при загрузке.

### Дизайн: Linear-style

- **Направление:** минимализм как у Linear — приглушённая палитра,
  тонкие границы вместо теней, аккуратные бейджи, плотная доска.
- **Токены:** `shared/ui/tokens.ts` + CSS-переменные — палитра, шрифт
  (Inter, mono для чисел/дат), радиусы, отступы. Вся палитра меняется
  правкой одного файла — как и весь ui-kit в `shared/ui`.
- **Темы:** светлая + тёмная с первого дня (класс `dark` на `<html>`,
  переключатель в шапке, выбор в localStorage).
- **Слои работы:** токены и каркас — на этапе 1; раскладка каждого
  модуля — вместе с модулем; полировка (анимации, переходы,
  empty-иллюстрации, мобильный проход) — этап 11 перед деплоем.

---

## 8. Деплой и публичная ссылка

1. `Dockerfile` (multi-stage): собирает клиент → копирует статику →
   Express отдаёт и статику, и `/api`.
2. SQLite-файл и папка `uploads/` на volume — данные и вложения живут
   между деплоями.
3. Деплой на Render или Railway (бесплатный тариф) → публичный HTTPS-URL.
4. `.env.example`: `SESSION_SECRET`, `SEED_DEMO`, `PORT`, `UPLOADS_DIR`,
   `MAX_UPLOAD_MB`.
5. `SEED_DEMO=true` создаёт демо-аккаунты (admin/manager/member) и
   несколько задач — ревьюеру есть чем войти.
6. `core/scheduler.js` каждую минуту проверяет `tasks.recurrence` и
   создаёт следующие экземпляры повторяющихся задач.
7. README: локальный запуск (`npm run dev`), деплой, тестовые логины.

---

## 9. Этапы разработки (порядок работ)

1. Скелет: workspaces, Vite, Tailwind, `shared/contracts`,
   дизайн-токены + ui-kit в `shared/ui` (Linear-style, светлая+тёмная темы)
2. Server core: db.js (схема + миграции), config, errors, seed
3. Модуль auth (сервер + клиент: login/me, защита роутов)
4. Модуль roles (матрица + requirePermission + useCan/RoleGuard)
5. Модуль tasks — база: CRUD + доска + модалка + смена статуса
6. Модуль search (эндпоинт + SearchBar + фильтры через URL-параметры)
7. Модуль users (список, AssigneeSelect, страница admin)
8. Расширения задач — каждое своим модулем, можно сдавать по одному:
   checklists → comments → files (+uploads) → history → tags →
   подзадачи + соисполнители/наблюдатели → bulk-действия
9. sprints, timetracking, templates (+scheduler, recurring), reports
10. gantt (SVG-таймлайн), transfer (CSV импорт/экспорт)
11. Полировка: адаптив под телефон, анимации, пустые состояния, тосты
12. Dockerfile → деплой → публичная ссылка
13. README + финальная проверка по ТЗ

Этапы 8–10 — независимые модули: каждый доводится до рабочего состояния
отдельно, порядок внутри можно менять. Если после релиза попросят
«починить поиск» — открываем только `modules/search` на клиенте и сервере.

---

## 10. Соответствие ТЗ

| Требование | Где закрыто |
|---|---|
| CRUD задач | `modules/tasks` (клиент + сервер) |
| Ответственный | поле `assignee_id`, `AssigneeSelect` из `modules/users` |
| Статусы + смена | `modules/tasks`, колонки доски + StatusMenu |
| Поиск и фильтрация | `modules/search` (клиент + сервер) |
| Данные после перезагрузки | SQLite на сервере |
| Авторизация | `modules/auth`, cookie-сессии |
| Адаптив десктоп/телефон | Tailwind, доска → табы на мобильных |
| Публичная ссылка | Docker-деплой (п. 8) |
| Исходный код | этот репозиторий |

---

## 11. Вне объёма (сравнение с Bitrix24)

Bitrix24 — комбайн из десятков модулей; наш проект — таск-трекер по ТЗ.
Осознанно НЕ делаем:

Блок «расширенные задачи» из Bitrix24 — в объёме (см. п. 1 и п. 3).
Осознанно НЕ делаем:

- **Ядро CRM продаж:** лиды, сделки, контакты, компании, воронки,
  счета/КП, каталог товаров, CRM-формы, аналитика продаж
- **Коммуникации:** чат, видеозвонки, телефония, открытые линии
  (WhatsApp/TG/IG), почта, календарь, лента, email/push-уведомления
- **Файлы:** диск, онлайн-документы, версии, генератор документов, e-sign
- **HR:** оргструктура, учёт рабочего времени, отпуска, отчёты
- **Автоматизация:** бизнес-процессы, роботы/триггеры, смарт-процессы,
  согласования
- **Маркетинг:** рассылки, сегменты, рекламные интеграции
- **Сайты/магазины:** конструктор сайтов, интернет-магазин, платежи
- **Аналитика:** BI-конструктор, дашборды
- **Платформа:** REST API/вебхуки, маркетплейс, 1С, LDAP, нативное
  мобильное приложение, коробочная версия, экстранет, 2FA,
  мультидепартаменты, AI

*Кандидаты на v2 (легко добавить, не ломая модули):* email/push-уведомления,
экспорт в Excel (xlsx вместо CSV), drag в Ганте, календарь задач.

---

## 12. Бэклог идей (после базового объёма — каждая обсуждается отдельно)

Порядок работ: сначала весь базовый объём (п. 1–10), затем эти фичи
прикручиваем по одной — перед каждой спрашиваем. Каждая ложится
либо в существующий модуль, либо в новую папку.

**Почти бесплатно:**
- Drag & drop карточек по доске (`tasks`, dnd-kit)
- Быстрое создание задачи — инпут внизу колонки (`tasks`)
- Архив задач + фильтр «показать архив» (`tasks`, флаг `archived`)
- Undo после удаления — мягкое удаление `deleted_at` (`tasks`)
- Дублировать задачу (`tasks`)
- Сортировка/группировка списка (`search`)
- Счётчики над доской: всего/в работе/просрочено/неделя (`tasks`)
- Глубокие ссылки `/tasks/:id` + «копировать ссылку» (`tasks`+`app`)
- Горячие клавиши: `/`, `N`, `?` (`app`)
- Число открытых задач у исполнителя в AssigneeSelect (`users`)
- Авто-завершение по чек-листу (`checklists`)
- Вставка скриншота из буфера во вложения (`files`)
- PWA-манифест — «установить на телефон» (`app`)
- Избранные задачи — звёздочка + фильтр (`tasks`)
- Недавно просмотренные (`app`, localStorage)

**Средняя сложность (новые модули):**
- `notifications` — колокольчик: назначили, упомянули, дедлайн завтра
- `mentions` — `@имя` в комментариях → уведомление
- `timer` — start/stop списания времени (`timetracking`)
- `markdown` — разметка в описании и комментариях (`shared`)
- Command palette Ctrl+K (`search`)
- `projects` — группировка задач по проектам (новая сущность)

*Тёмная тема — уже в базовом объёме (раздел Дизайн, п. 7).*
