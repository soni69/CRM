import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth';
import { useProjects, useProjectMutations } from '../hooks';
import { useUsers } from '../../users';
import { useTasks } from '../../tasks';
import { useColumns } from '../../columns';
import { TaskRow } from '../../tasks/components/TaskRow';
import { Avatar, Button, ConfirmDialog, PageSpinner, EmptyState } from '../../../shared/ui';
import { formatDate, isOverdue } from '../../../shared/utils/format';
import { cn } from '../../../shared/utils/cn';
import { ProjectModal } from '../components/ProjectModal';
import { ProjectStages } from '../components/ProjectStages';
import type { TaskView } from '@crm/contracts';

export function ProjectPage() {
  const { id } = useParams();
  const pid = Number(id);
  const nav = useNavigate();
  const { user: me } = useAuth();
  const { data: projects = [], isLoading } = useProjects();
  const { data: users = [] } = useUsers();
  const { data: tasks = [] } = useTasks();
  const { data: columns = [] } = useColumns();
  const mut = useProjectMutations();
  const [editOpen, setEditOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);

  const project = projects.find((p) => p.id === pid);
  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const projectTasks = useMemo(() => tasks.filter((t) => t.project_id === pid), [tasks, pid]);
  const grouped = useMemo(() => {
    const byKey = new Map<string, TaskView[]>();
    for (const t of projectTasks) {
      const arr = byKey.get(t.status) ?? [];
      arr.push(t);
      byKey.set(t.status, arr);
    }
    const seen = new Set<string>();
    const groups = columns
      .filter((c) => byKey.has(c.key))
      .map((c) => { seen.add(c.key); return { key: c.key, name: c.name, color: c.color, tasks: byKey.get(c.key)! }; });
    for (const [key, arr] of byKey) {
      if (!seen.has(key)) groups.push({ key, name: key, color: '#8d94a8', tasks: arr });
    }
    return groups;
  }, [projectTasks, columns]);

  if (isLoading) return <PageSpinner />;
  if (!project) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <EmptyState title="Проект не найден" hint="Возможно, он был удалён или у вас нет к нему доступа." />
      </div>
    );
  }

  const canManage = me?.role === 'admin' || project.lead_id === me?.id;

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <Link to="/projects" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-text">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Проекты
      </Link>

      <div className="mb-5 rounded-xl border border-border bg-raised p-5 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2.5 text-xl font-semibold">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
              {project.name}
            </h1>
            {project.description && <p className="mt-1 text-sm text-muted">{project.description}</p>}
            {project.goal && (
              <p className="mt-3 rounded-lg border border-border/70 bg-surface px-3 py-2 text-sm">
                <span className="mr-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: project.color }}>Цель</span>
                {project.goal}
              </p>
            )}
          </div>
          {canManage && (
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditOpen(true)}>Редактировать</Button>
              <Button size="sm" variant="ghost" onClick={() => setDelOpen(true)}>Удалить</Button>
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          {project.lead && (
            <span className="inline-flex items-center gap-1.5">
              <Avatar name={project.lead.name} id={project.lead.id} size={20} />
              <span>{project.lead.name}</span>
              <span className="text-faint">· тимлид</span>
            </span>
          )}
          <span className="inline-flex items-center gap-2 text-muted">
            <span className="flex -space-x-1.5">
              {project.member_ids.slice(0, 8).map((uid) => {
                const u = userById.get(uid);
                return u ? <Avatar key={uid} name={u.name} id={u.id} size={20} /> : null;
              })}
            </span>
            {project.member_count} участ.
          </span>
          <span className="text-faint">{project.task_count} задач</span>
          {project.due_date && (
            <span className={cn('font-mono text-xs', isOverdue(project.due_date, false) ? 'text-danger' : 'text-muted')}>
              до {formatDate(project.due_date)}
            </span>
          )}
        </div>
        <div className="mt-4">
          <Button size="sm" onClick={() => nav(`/tasks/new?project=${project.id}`)}>+ Задача в проект</Button>
        </div>
      </div>

      <ProjectStages project={project} canManage={canManage} />

      {projectTasks.length === 0 ? (
        <EmptyState title="В проекте пока нет задач" hint="Создайте первую — она будет видна только участникам проекта." />
      ) : (
        <div className="flex flex-col gap-4">
          {grouped.map((g) => (
            <section key={g.key}>
              <h2 className="mb-1 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: g.color }} />
                {g.name}
                <span className="text-faint">{g.tasks.length}</span>
              </h2>
              <div className="rounded-xl border border-border bg-raised">
                {g.tasks.map((t) => (
                  <TaskRow key={t.id} task={t} onOpen={(tid) => nav(`/tasks/${tid}`)} selected={false} onSelect={() => {}} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {editOpen && <ProjectModal project={project} onClose={() => setEditOpen(false)} />}
      <ConfirmDialog
        open={delOpen}
        onClose={() => setDelOpen(false)}
        onConfirm={() => { mut.remove.mutate(project.id, { onSuccess: () => nav('/projects') }); }}
        title="Удалить проект?"
        body="Задачи проекта останутся, но потеряют привязку к нему."
      />
    </div>
  );
}
