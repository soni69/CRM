import { q, tx, now } from './db.js';

// Повторяющиеся задачи: когда next_run <= сегодня — создаём копию и сдвигаем дату.
const addFreq = (dateStr, freq) => {
  const d = new Date(dateStr + 'T00:00:00Z');
  if (freq === 'day') d.setUTCDate(d.getUTCDate() + 1);
  else if (freq === 'week') d.setUTCDate(d.getUTCDate() + 7);
  else d.setUTCMonth(d.getUTCMonth() + 1);
  return d.toISOString().slice(0, 10);
};

function spawnRecurring() {
  const today = new Date().toISOString().slice(0, 10);
  const due = q.all(
    "SELECT * FROM tasks WHERE recurrence IS NOT NULL AND json_extract(recurrence,'$.next_run') <= ?",
    today,
  );
  for (const t of due) {
    const rec = JSON.parse(t.recurrence);
    tx(() => {
      const { lastInsertRowid } = q.run(
        `INSERT INTO tasks (title, description, status, priority, start_date, due_date,
           assignee_id, creator_id, sprint_id, time_estimate)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        t.title, t.description, 'new', t.priority, null, rec.next_run,
        t.assignee_id, t.creator_id, t.sprint_id, t.time_estimate,
      );
      const newId = Number(lastInsertRowid);
      q.run('INSERT INTO task_members (task_id, user_id, kind) SELECT ?, user_id, kind FROM task_members WHERE task_id = ?', newId, t.id);
      q.run('INSERT INTO task_tags (task_id, tag_id) SELECT ?, tag_id FROM task_tags WHERE task_id = ?', newId, t.id);
      for (const item of q.all('SELECT text, position FROM checklist_items WHERE task_id = ? ORDER BY position', t.id)) {
        q.run('INSERT INTO checklist_items (task_id, text, position) VALUES (?,?,?)', newId, item.text, item.position);
      }
      q.run(
        "INSERT INTO task_events (task_id, actor_id, type, payload) VALUES (?,?,?,?)",
        newId, t.creator_id, 'created', JSON.stringify({ via: 'recurrence', from_task: t.id }),
      );
      rec.next_run = addFreq(rec.next_run, rec.freq);
      q.run('UPDATE tasks SET recurrence = ?, updated_at = ? WHERE id = ?', JSON.stringify(rec), now(), t.id);
    })();
  }
  if (due.length) console.log(`[scheduler] создано повторяющихся задач: ${due.length}`);
}

export function startScheduler() {
  spawnRecurring();
  setInterval(spawnRecurring, 60_000).unref();
}
