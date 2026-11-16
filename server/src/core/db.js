import Database from 'better-sqlite3';
import path from 'node:path';
import { config } from './config.js';

export const db = new Database(path.join(config.dataDir, 'crm.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Короткие хелперы
export const q = {
  all: (sql, ...params) => db.prepare(sql).all(...params),
  get: (sql, ...params) => db.prepare(sql).get(...params),
  run: (sql, ...params) => db.prepare(sql).run(...params),
};
export const tx = (fn) => db.transaction(fn);
export const now = () => new Date().toISOString();

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'manager' CHECK (role IN ('admin','lead','manager')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sprints (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  goal       TEXT NOT NULL DEFAULT '',
  start_date TEXT NOT NULL,
  end_date   TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','active','closed'))
);
CREATE TABLE IF NOT EXISTS tasks (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'new',
  priority      TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  start_date    TEXT,
  due_date      TEXT,
  assignee_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  creator_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id     INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  sprint_id     INTEGER REFERENCES sprints(id) ON DELETE SET NULL,
  project_id    INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  time_estimate INTEGER NOT NULL DEFAULT 0,
  recurrence    TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS task_members (
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind    TEXT NOT NULL CHECK (kind IN ('participant','observer')),
  PRIMARY KEY (task_id, user_id, kind)
);
CREATE TABLE IF NOT EXISTS checklist_items (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id  INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  text     TEXT NOT NULL,
  done     INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS task_comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id    INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS task_attachments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id     INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  uploader_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename    TEXT NOT NULL,
  orig_name   TEXT NOT NULL,
  size        INTEGER NOT NULL,
  mime        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS task_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id    INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  actor_id   INTEGER NOT NULL REFERENCES users(id),
  type       TEXT NOT NULL,
  payload    TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS tags (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#888888'
);
CREATE TABLE IF NOT EXISTS task_tags (
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id  INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);
CREATE TABLE IF NOT EXISTS time_entries (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id    INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  minutes    INTEGER NOT NULL CHECK (minutes > 0),
  work_date  TEXT NOT NULL,
  comment    TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS projects (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  color       TEXT NOT NULL DEFAULT '#5e6ad2',
  lead_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS project_members (
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, user_id)
);
CREATE TABLE IF NOT EXISTS board_columns (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  key      TEXT NOT NULL UNIQUE,
  name     TEXT NOT NULL,
  color    TEXT NOT NULL DEFAULT '#5e6ad2',
  position INTEGER NOT NULL DEFAULT 0,
  is_done       INTEGER NOT NULL DEFAULT 0,
  hidden        INTEGER NOT NULL DEFAULT 0,
  allowed_to    TEXT,
  auto_subtasks TEXT NOT NULL DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS task_templates (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  priority    TEXT NOT NULL DEFAULT 'medium',
  checklist   TEXT NOT NULL DEFAULT '[]',
  creator_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_tasks_status    ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee  ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent    ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_sprint    ON tasks(sprint_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due       ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_events_task     ON task_events(task_id);
CREATE INDEX IF NOT EXISTS idx_members_user    ON task_members(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user   ON sessions(user_id);
`;

export function migrate() {
  db.exec(SCHEMA);
  let taskCols = db.prepare('PRAGMA table_info(tasks)').all().map((c) => c.name);
  if (!taskCols.includes('due_time')) db.exec('ALTER TABLE tasks ADD COLUMN due_time TEXT');
  if (!taskCols.includes('project_id')) db.exec('ALTER TABLE tasks ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL');

  // Новые роли: member→manager, manager→lead (через временную метку)
  const usersSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get()?.sql ?? '';
  if (usersSql.includes("'member'")) {
    db.exec('DROP TABLE IF EXISTS users_new');
    db.exec(`CREATE TABLE users_new (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'manager' CHECK (role IN ('admin','lead','manager')),
      phone         TEXT,
      telegram      TEXT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    )`);
    const ucols = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
    const keep = ['id','name','email','password_hash','role','phone','telegram','created_at'].filter((c) => ucols.includes(c));
    // ремап ролей прямо в SELECT (member→manager, manager→lead)
    const sel = keep.map((c) => c === 'role'
      ? `CASE role WHEN 'manager' THEN 'lead' WHEN 'member' THEN 'manager' ELSE role END`
      : c).join(',');
    db.exec(`INSERT INTO users_new (${keep.join(',')}) SELECT ${sel} FROM users`);
    db.exec('DROP TABLE users');
    db.exec('ALTER TABLE users_new RENAME TO users');
  }

  // Колонки доски по умолчанию
  if (!db.prepare('SELECT COUNT(*) c FROM board_columns').get().c) {
    const ins = db.prepare('INSERT INTO board_columns (key, name, color, position, is_done) VALUES (?,?,?,?,?)');
    ins.run('new', 'Новая', '#26b5ce', 0, 0);
    ins.run('in_progress', 'В работе', '#f2c94c', 1, 0);
    ins.run('done', 'Завершена', '#4cb782', 2, 1);
  }

  const userCols = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
  if (!userCols.includes('phone')) db.exec('ALTER TABLE users ADD COLUMN phone TEXT');
  if (!userCols.includes('telegram')) db.exec('ALTER TABLE users ADD COLUMN telegram TEXT');

  const colCols = db.prepare('PRAGMA table_info(board_columns)').all().map((c) => c.name);
  if (!colCols.includes('allowed_to')) db.exec('ALTER TABLE board_columns ADD COLUMN allowed_to TEXT');
  if (!colCols.includes('auto_subtasks')) db.exec("ALTER TABLE board_columns ADD COLUMN auto_subtasks TEXT NOT NULL DEFAULT '[]'");

  // Статусы стали динамическими — убираем CHECK со tasks.status ребилдом
  const tableSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='tasks'").get()?.sql ?? '';
  if (/CHECK\s*\(\s*status\s+IN/i.test(tableSql)) {
    db.pragma('foreign_keys = OFF');
    db.transaction(() => {
      const cols = db.prepare('PRAGMA table_info(tasks)').all().map((c) => c.name);
      db.exec(`CREATE TABLE tasks_new (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        title         TEXT NOT NULL,
        description   TEXT NOT NULL DEFAULT '',
        status        TEXT NOT NULL DEFAULT 'new',
        priority      TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
        start_date    TEXT,
        due_date      TEXT,
        due_time      TEXT,
        assignee_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
        creator_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        parent_id     INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        sprint_id     INTEGER REFERENCES sprints(id) ON DELETE SET NULL,
        project_id    INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  project_id    INTEGER REFERENCES projects(id) ON DELETE SET NULL,
        time_estimate INTEGER NOT NULL DEFAULT 0,
        recurrence    TEXT,
        created_at    TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
      const keep = ['id','title','description','status','priority','start_date','due_date','due_time','assignee_id','creator_id','parent_id','sprint_id','project_id','time_estimate','recurrence','created_at','updated_at']
        .filter((c) => cols.includes(c));
      db.exec(`INSERT INTO tasks_new (${keep.join(',')}) SELECT ${keep.join(',')} FROM tasks`);
      db.exec('DROP TABLE tasks');
      db.exec('ALTER TABLE tasks_new RENAME TO tasks');
      db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_status   ON tasks(status);
               CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
               CREATE INDEX IF NOT EXISTS idx_tasks_parent   ON tasks(parent_id);
               CREATE INDEX IF NOT EXISTS idx_tasks_sprint   ON tasks(sprint_id);
               CREATE INDEX IF NOT EXISTS idx_tasks_due      ON tasks(due_date)`);
    })();
    db.pragma('foreign_keys = ON');
  }
}
