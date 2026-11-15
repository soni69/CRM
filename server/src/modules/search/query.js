import { z } from 'zod';
import { PRIORITIES } from '@crm/contracts/task';
import { visibleTasksWhere } from '../roles/index.js';
import { attachView } from '../tasks/index.js';
import { q } from '../../core/db.js';

export const searchParamsSchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: z.string().min(1).optional(),
  assignee_id: z.coerce.number().int().positive().optional(),
  priority: z.enum(PRIORITIES).optional(),
  tag_id: z.coerce.number().int().positive().optional(),
  sprint_id: z.coerce.number().int().positive().optional(),
  parent_id: z.coerce.number().int().positive().optional(),
  overdue: z.coerce.boolean().optional(),
  due_before: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  due_after: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sort: z.enum(['created', 'due_date', 'priority', 'title']).default('created'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

const SORT_COL = { created: 't.created_at', due_date: 't.due_date', priority: "CASE t.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END", title: 't.title' };

// Единственное место сборки WHERE для поиска
export function searchTasks(user, params) {
  const vis = visibleTasksWhere(user, 't');
  const conds = [vis.sql];
  const args = [...vis.params];

  if (params.q) {
    conds.push(`(t.title LIKE ? OR t.description LIKE ? OR EXISTS (
      SELECT 1 FROM task_comments c WHERE c.task_id = t.id AND c.body LIKE ?))`);
    const like = `%${params.q}%`;
    args.push(like, like, like);
  }
  if (params.status) { conds.push('t.status = ?'); args.push(params.status); }
  if (params.assignee_id) { conds.push('t.assignee_id = ?'); args.push(params.assignee_id); }
  if (params.priority) { conds.push('t.priority = ?'); args.push(params.priority); }
  if (params.sprint_id) { conds.push('t.sprint_id = ?'); args.push(params.sprint_id); }
  if (params.parent_id !== undefined) { conds.push('t.parent_id = ?'); args.push(params.parent_id); }
  if (params.tag_id) {
    conds.push('EXISTS (SELECT 1 FROM task_tags tt WHERE tt.task_id = t.id AND tt.tag_id = ?)');
    args.push(params.tag_id);
  }
  if (params.overdue) {
    conds.push("t.due_date IS NOT NULL AND t.due_date < date('now') AND t.status NOT IN (SELECT key FROM board_columns WHERE is_done = 1)");
  }
  if (params.due_before) { conds.push('t.due_date IS NOT NULL AND t.due_date <= ?'); args.push(params.due_before); }
  if (params.due_after) { conds.push('t.due_date IS NOT NULL AND t.due_date >= ?'); args.push(params.due_after); }

  const sort = SORT_COL[params.sort] ?? SORT_COL.created;
  const rows = q.all(
    `SELECT t.* FROM tasks t WHERE ${conds.join(' AND ')}
     ORDER BY ${sort} ${params.order === 'asc' ? 'ASC' : 'DESC'} NULLS LAST, t.id DESC`,
    ...args,
  );
  return attachView(rows);
}
