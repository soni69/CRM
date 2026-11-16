import { Router } from 'express';
import { z } from 'zod';
import { createProjectSchema, updateProjectSchema, createStageSchema, updateStageSchema } from '@crm/contracts/project';
import { asyncH, parseBody, httpError } from '../../core/errors.js';
import { requirePermission, isProjectLead, isProjectMember } from '../roles/index.js';
import { listProjects, getProject, createProject, updateProject, deleteProject, setProjectMembers, createStage, updateStage, deleteStage, getStage } from './repo.js';

export const projectsRouter = Router();

// Управление проектом: админ или его тимлид
const canManageProject = (req, projectId) => req.user.role === 'admin' || isProjectLead(req.user, projectId);
const mustManage = (req, projectId) => {
  if (!getProject(projectId)) throw httpError(404, 'Проект не найден');
  if (!canManageProject(req, projectId)) throw httpError(403, 'Нет прав управлять этим проектом');
};

projectsRouter.get('/api/projects', asyncH(async (req, res) => {
  res.json({ projects: listProjects(req.user) });
}));

projectsRouter.post('/api/projects', requirePermission('project.manage'), asyncH(async (req, res) => {
  const data = parseBody(createProjectSchema, req.body);
  res.status(201).json({ project: createProject(data) });
}));

projectsRouter.get('/api/projects/:id', asyncH(async (req, res) => {
  const p = listProjects(req.user).find((x) => x.id === Number(req.params.id));
  if (!p) throw httpError(404, 'Проект не найден');
  res.json({ project: p });
}));

projectsRouter.patch('/api/projects/:id', asyncH(async (req, res) => {
  mustManage(req, Number(req.params.id));
  const data = parseBody(updateProjectSchema, req.body);
  res.json({ project: updateProject(Number(req.params.id), data) });
}));

// Назначить участников проекта
projectsRouter.put('/api/projects/:id/members', asyncH(async (req, res) => {
  const id = Number(req.params.id);
  mustManage(req, id);
  const { user_ids } = parseBody(z.object({ user_ids: z.array(z.number().int().positive()) }), req.body);
  const p = getProject(id);
  // тимлид всегда остаётся участником
  setProjectMembers(id, p.lead_id ? [...new Set([...user_ids, p.lead_id])] : user_ids);
  res.json({ ok: true });
}));

projectsRouter.delete('/api/projects/:id', asyncH(async (req, res) => {
  mustManage(req, Number(req.params.id));
  deleteProject(Number(req.params.id));
  res.status(204).end();
}));

// ---- Этапы: создавать/править/удалять — админ и тимлид; ----
// отмечать выполненными могут и участники проекта
projectsRouter.post('/api/projects/:id/stages', asyncH(async (req, res) => {
  mustManage(req, Number(req.params.id));
  const data = parseBody(createStageSchema, req.body);
  res.status(201).json({ project: createStage(Number(req.params.id), data) });
}));

projectsRouter.patch('/api/projects/:id/stages/:sid', asyncH(async (req, res) => {
  const id = Number(req.params.id);
  if (!getProject(id)) throw httpError(404, 'Проект не найден');
  const data = parseBody(updateStageSchema, req.body);
  const onlyDone = Object.keys(data).every((k) => k === 'done');
  // участник может только ставить/снимать галочку; остальное — админ и тимлид
  if (onlyDone) {
    if (!isProjectMember(req.user, id) && req.user.role !== 'admin') throw httpError(403, 'Нет прав');
  } else {
    mustManage(req, id);
  }
  res.json({ project: updateStage(id, Number(req.params.sid), data) });
}));

projectsRouter.delete('/api/projects/:id/stages/:sid', asyncH(async (req, res) => {
  const id = Number(req.params.id);
  mustManage(req, id);
  res.json({ project: deleteStage(id, Number(req.params.sid)) });
}));
