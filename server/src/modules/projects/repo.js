import { q, tx } from '../../core/db.js';
import { httpError } from '../../core/errors.js';
import { can } from '../roles/index.js';

const attach = (p) => {
  if (!p) return p;
  const members = q.all(
    `SELECT u.id, u.name, u.email, u.role, u.created_at FROM project_members pm JOIN users u ON u.id = pm.user_id WHERE pm.project_id = ?`,
    p.id,
  );
  const stages = q.all(
    `SELECT ps.*, u.id AS uid, u.name AS uname, u.email AS uemail, u.role AS urole, u.created_at AS ucreated
     FROM project_stages ps LEFT JOIN users u ON u.id = ps.owner_id
     WHERE ps.project_id = ? ORDER BY ps.position, ps.id`,
    p.id,
  ).map((st) => ({
    id: st.id, project_id: st.project_id, title: st.title,
    owner_id: st.owner_id,
    owner: st.uid ? { id: st.uid, name: st.uname, email: st.uemail, role: st.urole, created_at: st.ucreated } : null,
    due_date: st.due_date, done: st.done, position: st.position,
  }));
  return {
    ...p,
    lead: p.lead_id ? q.get('SELECT id, name, email, role, created_at FROM users WHERE id = ?', p.lead_id) : null,
    member_ids: members.map((m) => m.id),
    member_count: members.length,
    task_count: q.get('SELECT COUNT(*) c FROM tasks WHERE project_id = ?', p.id).c,
    stages,
  };
};

export const getProject = (id) => q.get('SELECT * FROM projects WHERE id = ?', id);

// admin видит все, остальные — где участник или тимлид
export function listProjects(user) {
  const rows = can(user, 'task.view.all')
    ? q.all('SELECT * FROM projects ORDER BY name')
    : q.all(
      `SELECT DISTINCT p.* FROM projects p
       LEFT JOIN project_members pm ON pm.project_id = p.id
       WHERE p.lead_id = ? OR pm.user_id = ? ORDER BY p.name`,
      user.id, user.id,
    );
  return rows.map(attach);
}

export const projectExists = (id) => !!q.get('SELECT 1 FROM projects WHERE id = ?', id);

export function createProject({ name, description, goal, due_date, color, lead_id, member_ids }) {
  const id = tx(() => {
    const { lastInsertRowid } = q.run(
      'INSERT INTO projects (name, description, goal, due_date, color, lead_id) VALUES (?,?,?,?,?,?)',
      name, description ?? '', goal ?? '', due_date ?? null, color, lead_id ?? null,
    );
    const pid = Number(lastInsertRowid);
    const memberSet = new Set(member_ids ?? []);
    if (lead_id) memberSet.add(lead_id); // тимлид всегда участник
    for (const uid of memberSet) {
      q.run('INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?,?)', pid, uid);
    }
    return pid;
  })();
  return attach(getProject(id));
}

export function updateProject(id, { name, description, goal, due_date, color, lead_id, member_ids }) {
  const p = getProject(id);
  if (!p) throw httpError(404, 'Проект не найден');
  tx(() => {
    q.run(
      'UPDATE projects SET name = ?, description = ?, goal = ?, due_date = ?, color = ?, lead_id = ? WHERE id = ?',
      name ?? p.name, description ?? p.description, goal ?? p.goal ?? '',
      due_date === undefined ? p.due_date : due_date, color ?? p.color,
      lead_id === undefined ? p.lead_id : lead_id, id,
    );
    if (member_ids !== undefined) setProjectMembers(id, member_ids);
    // тимлид всегда участник
    const lid = lead_id === undefined ? p.lead_id : lead_id;
    if (lid) q.run('INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?,?)', id, lid);
  })();
  return attach(getProject(id));
}

export function setProjectMembers(projectId, userIds) {
  q.run('DELETE FROM project_members WHERE project_id = ?', projectId);
  for (const uid of userIds) {
    q.run('INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?,?)', projectId, uid);
  }
}

export function deleteProject(id) {
  // задачи проекта отвязываем (ON DELETE SET NULL), сам проект удаляем
  q.run('DELETE FROM projects WHERE id = ?', id);
}

// ---- Этапы проекта ----
export const getStage = (projectId, stageId) =>
  q.get('SELECT * FROM project_stages WHERE id = ? AND project_id = ?', stageId, projectId);

export function createStage(projectId, { title, owner_id, due_date }) {
  const pos = q.get('SELECT COALESCE(MAX(position), 0) + 1 p FROM project_stages WHERE project_id = ?', projectId).p;
  q.run(
    'INSERT INTO project_stages (project_id, title, owner_id, due_date, position) VALUES (?,?,?,?,?)',
    projectId, title, owner_id ?? null, due_date ?? null, pos,
  );
  return attach(getProject(projectId));
}

export function updateStage(projectId, stageId, { title, owner_id, due_date, done }) {
  const st = getStage(projectId, stageId);
  if (!st) throw httpError(404, 'Этап не найден');
  q.run(
    'UPDATE project_stages SET title = ?, owner_id = ?, due_date = ?, done = ? WHERE id = ?',
    title ?? st.title,
    owner_id === undefined ? st.owner_id : owner_id,
    due_date === undefined ? st.due_date : due_date,
    done === undefined ? st.done : done,
    stageId,
  );
  return attach(getProject(projectId));
}

export function deleteStage(projectId, stageId) {
  const st = getStage(projectId, stageId);
  if (!st) throw httpError(404, 'Этап не найден');
  q.run('DELETE FROM project_stages WHERE id = ?', stageId);
  return attach(getProject(projectId));
}
