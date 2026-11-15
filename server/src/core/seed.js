import bcrypt from 'bcryptjs';
import { q, tx } from './db.js';

// Демо-данные при первом запуске (SEED_DEMO=true)
export function seedDemo() {
  if (q.get('SELECT 1 FROM users LIMIT 1')) return;
  const hash = bcrypt.hashSync('demo123', 10);
  tx(() => {
    const ins = (name, email, role) =>
      Number(q.run('INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)', name, email, hash, role).lastInsertRowid);
    const admin = ins('Анна Админова', 'admin@demo.ru', 'admin');
    const manager = ins('Максим Менеджеров', 'manager@demo.ru', 'manager');
    const member = ins('Мария Участникова', 'member@demo.ru', 'member');

    const tag = (name, color) => Number(q.run('INSERT INTO tags (name, color) VALUES (?,?)', name, color).lastInsertRowid);
    const tBug = tag('Баг', '#e06b6b');
    const tFeat = tag('Фича', '#5e6ad2');
    const tUrgent = tag('Срочно', '#f2994a');

    const today = new Date().toISOString().slice(0, 10);
    const plus = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

    const task = (title, status, priority, assignee, creator, due, desc = '') =>
      Number(q.run(
        `INSERT INTO tasks (title, description, status, priority, due_date, assignee_id, creator_id)
         VALUES (?,?,?,?,?,?,?)`, title, desc, status, priority, due, assignee, creator).lastInsertRowid);

    const t1 = task('Сверстать страницу входа', 'done', 'medium', member, manager, plus(-2), 'Форма логина + регистрации');
    const t2 = task('Настроить CI для деплоя', 'in_progress', 'high', manager, admin, plus(3));
    const t3 = task('Починить фильтр по датам', 'in_progress', 'high', member, manager, today, 'Фильтр due_before не учитывает часовой пояс');
    const t4 = task('Написать README проекта', 'new', 'low', admin, admin, plus(7));
    const t5 = task('Спроектировать схему отчётов', 'new', 'medium', member, manager, plus(5));
    task('Обновить зависимости', 'new', 'low', null, manager, null);

    for (const [tid, uid, kind] of [[t2, member, 'observer'], [t3, admin, 'participant']]) {
      q.run('INSERT INTO task_members (task_id, user_id, kind) VALUES (?,?,?)', tid, uid, kind);
    }
    for (const [tid, tagId] of [[t3, tBug], [t3, tUrgent], [t1, tFeat], [t5, tFeat]]) {
      q.run('INSERT INTO task_tags (task_id, tag_id) VALUES (?,?)', tid, tagId);
    }
    q.run('INSERT INTO checklist_items (task_id, text, done, position) VALUES (?,?,?,?)', t3, 'Воспроизвести баг', 1, 0);
    q.run('INSERT INTO checklist_items (task_id, text, done, position) VALUES (?,?,?,?)', t3, 'Поправить SQL', 0, 1);
    q.run('INSERT INTO checklist_items (task_id, text, done, position) VALUES (?,?,?,?)', t3, 'Проверить на границе месяца', 0, 2);
    q.run('INSERT INTO task_comments (task_id, author_id, body) VALUES (?,?,?)', t3, manager, 'Баг подтверждён, возьми в работу');
    q.run('INSERT INTO sprints (name, goal, start_date, end_date, status) VALUES (?,?,?,?,?)',
      'Спринт 1', 'Стабилизировать базовый функционал', today, plus(13), 'active');
    q.run('UPDATE tasks SET sprint_id = 1 WHERE id IN (?,?)', t2, t3);
  })();
  console.log('[seed] Демо-данные созданы: admin@demo.ru / manager@demo.ru / member@demo.ru, пароль demo123');
}
