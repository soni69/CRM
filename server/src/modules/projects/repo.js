import { q, tx } from '../../core/db.js';
import { httpError } from '../../core/errors.js';
import { can } from '../roles/index.js';

const attach = (p) => {
  if (!p) return p;
  const members = q.all(
    `SELECT u.id, u.name, u.email, u.role, u.created_at FROM project_members pm JOIN users u ON u.id = pm.user_id WHERE pm.project_id = ?`,
    p.id,
  );
  return {
    ...p,
    lead: p.lead_id ? q.get('SELECT id, name, email, role, created_at FROM users WHERE id = ?', p.lead_id) : null,
    member_ids: members.map((m) => m.id),
    member_count: members.length,
    task_count: q.get('SELECT COUNT(*) c FROM tasks WHERE project_id = ?', p.id).c,
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

export function createProject({ name, description, color, lead_id, member_ids }) {
  const id = tx(() => {
    const { lastInsertRowid } = q.run(
      'INSERT INTO projects (name, description, color, lead_id) VALUES (?,?,?,?)',
      name, description ?? '', color, lead_id ?? null,
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

export function updateProject(id, { name, description, color, lead_id, member_ids }) {
  const p = getProject(id);
  if (!p) throw httpError(404, 'Проект не найден');
  tx(() => {
    q.run(
      'UPDATE projects SET name = ?, description = ?, color = ?, lead_id = ? WHERE id = ?',
      name ?? p.name, description ?? p.description, color ?? p.color,
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
