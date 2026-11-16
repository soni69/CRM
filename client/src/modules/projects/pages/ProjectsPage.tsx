import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../modules/auth';
import { useProjects, useProjectMutations } from '../hooks';
import { useUsers } from '../../../modules/users';
import type { ProjectView } from '@crm/contracts';
import { Avatar, Button, ConfirmDialog, PageSpinner, EmptyState } from '../../../shared/ui';
import { useCan } from '../../../modules/roles';
import { formatDate, isOverdue } from '../../../shared/utils/format';
import { cn } from '../../../shared/utils/cn';
import { ProjectModal } from '../components/ProjectModal';

export function ProjectsPage() {
  const { user: me } = useAuth();
  const nav = useNavigate();
  const { data: projects = [], isLoading } = useProjects();
  const { data: users = [] } = useUsers();
  const mut = useProjectMutations();
  const can = useCan();
  const [modal, setModal] = useState<null | { project?: ProjectView }>(null);
  const [delId, setDelId] = useState<number | null>(null);
  const userById = new Map(users.map((u) => [u.id, u]));

  if (isLoading) return <PageSpinner />;

  const canManage = (p: ProjectView) => me?.role === 'admin' || p.lead_id === me?.id;

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Проекты</h1>
        {can('project.manage') && (
          <Button size="sm" onClick={() => setModal({})}>+ Новый проект</Button>
        )}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title="Проектов пока нет"
          hint="Проекты группируют задачи и людей. Создайте первый."
          action={can('project.manage') ? <Button size="sm" onClick={() => setModal({})}>+ Создать</Button> : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {projects.map((p) => (
            <div
              key={p.id}
              onClick={() => nav(`/projects/${p.id}`)}
              className="flex cursor-pointer flex-col gap-3 rounded-xl border border-border border-l-4 bg-raised p-4 transition-colors hover:border-border-strong"
              style={{ borderLeftColor: p.color }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{p.name}</p>
                  {p.description && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{p.description}</p>}
                </div>
                {canManage(p) && (
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setModal({ project: p })} className="rounded p-1.5 text-faint hover:bg-hover hover:text-text" title="Редактировать">
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M11.5 1.5l3 3L5 14H2v-3l9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => setDelId(p.id)} className="rounded p-1.5 text-faint hover:bg-hover hover:text-danger" title="Удалить">
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 4h12M5.5 4V2.5h5V4M4 4l.7 9.5h6.6L12 4"/></svg>
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted">
                {p.lead && (
                  <span className="inline-flex items-center gap-1.5" title={`Тимлид: ${p.lead.name}`}>
                    <Avatar name={p.lead.name} id={p.lead.id} size={18} />
                    <span className="truncate">{p.lead.name}</span>
                    <span className="text-faint">· тимлид</span>
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-faint">
                <div className="flex -space-x-1.5">
                  {p.member_ids.slice(0, 6).map((id) => {
                    const u = userById.get(id);
                    return u ? <Avatar key={id} name={u.name} id={u.id} size={20} /> : null;
                  })}
                  {p.member_count > 6 && <span className="pl-2.5">+{p.member_count - 6}</span>}
                </div>
                <span className="inline-flex items-center gap-2">
                  {p.member_count} участ. · {p.task_count} задач
                  {p.due_date && (
                    <span className={cn('font-mono', isOverdue(p.due_date, false) ? 'text-danger' : 'text-faint')}>
                      до {formatDate(p.due_date)}
                    </span>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && <ProjectModal project={modal.project} onClose={() => setModal(null)} />}
      <ConfirmDialog
        open={delId !== null}
        onClose={() => setDelId(null)}
        onConfirm={() => { mut.remove.mutate(delId!); setDelId(null); }}
        title="Удалить проект?"
        body="Задачи проекта останутся, но потеряют привязку к нему."
      />
    </div>
  );
}
