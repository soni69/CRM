import { useState, type FormEvent } from 'react';
import { useAuth } from '../../../modules/auth';
import { useProjects, useProjectMutations } from '../hooks';
import { useUsers } from '../../../modules/users';
import type { ProjectView, CreateProjectInput } from '@crm/contracts';
import { Avatar, Button, ConfirmDialog, Field, Input, Modal, ModalHeader, PageSpinner, EmptyState, Select, useToast } from '../../../shared/ui';
import { ApiError } from '../../../shared/api/client';
import { cn } from '../../../shared/utils/cn';
import { useCan } from '../../../modules/roles';

const PALETTE = ['#5e6ad2', '#4cb782', '#f2994a', '#26b5ce', '#bb6bd9', '#e06b6b', '#f2c94c', '#8d94a8'];

function ProjectModal({ project, onClose }: { project?: ProjectView; onClose: () => void }) {
  const mut = useProjectMutations();
  const { data: users = [] } = useUsers();
  const toast = useToast();
  const [form, setForm] = useState<CreateProjectInput>({
    name: project?.name ?? '',
    description: project?.description ?? '',
    color: project?.color ?? PALETTE[0],
    lead_id: project?.lead_id ?? null,
    member_ids: project?.member_ids ?? [],
  });
  const [error, setError] = useState('');

  const toggleMember = (id: number) =>
    setForm((f) => ({
      ...f,
      member_ids: f.member_ids.includes(id) ? f.member_ids.filter((x) => x !== id) : [...f.member_ids, id],
    }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const payload = { ...form, lead_id: form.lead_id || null };
    const opts = {
      onSuccess: () => onClose(),
      onError: (err: unknown) => setError(err instanceof ApiError ? err.message : 'Ошибка'),
    };
    if (project) mut.update.mutate({ id: project.id, ...payload }, opts);
    else mut.create.mutate(payload, opts);
  };
  void toast;

  return (
    <Modal open onClose={onClose} className="max-w-lg">
      <ModalHeader title={project ? `Проект: ${project.name}` : 'Новый проект'} onClose={onClose} />
      <form onSubmit={submit} className="flex flex-col gap-3 p-4">
        <Field label="Название">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={120} />
        </Field>
        <Field label="Описание">
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="w-full rounded-md border border-border bg-raised px-2.5 py-1.5 text-sm outline-none focus:border-accent"
          />
        </Field>
        <Field label="Цвет">
          <div className="flex gap-1.5">
            {PALETTE.map((c) => (
              <button
                type="button" key={c}
                onClick={() => setForm({ ...form, color: c })}
                className={cn('h-6 w-6 rounded-full transition-transform hover:scale-110', form.color === c && 'ring-2 ring-accent ring-offset-2 ring-offset-raised')}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </Field>
        <Field label="Тимлид проекта">
          <Select value={form.lead_id ?? ''} onChange={(e) => setForm({ ...form, lead_id: e.target.value ? Number(e.target.value) : null })}>
            <option value="">Не назначен</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
        </Field>
        <Field label="Участники проекта">
          <div className="flex max-h-44 flex-col gap-1 overflow-y-auto rounded-lg border border-border p-2">
            {users.map((u) => (
              <label key={u.id} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-hover">
                <input type="checkbox" checked={form.member_ids.includes(u.id)} onChange={() => toggleMember(u.id)} className="accent-accent" />
                <Avatar name={u.name} id={u.id} size={18} />
                {u.name}
              </label>
            ))}
          </div>
        </Field>
        {error && <p className="text-xs text-danger">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Отмена</Button>
          <Button type="submit" disabled={!form.name.trim() || mut.create.isPending || mut.update.isPending}>
            {project ? 'Сохранить' : 'Создать'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function ProjectsPage() {
  const { user: me } = useAuth();
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
            <div key={p.id} className="flex flex-col gap-3 rounded-xl border border-border border-l-4 bg-raised p-4" style={{ borderLeftColor: p.color }}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{p.name}</p>
                  {p.description && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{p.description}</p>}
                </div>
                {canManage(p) && (
                  <div className="flex gap-1">
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
                <span>{p.member_count} участ. · {p.task_count} задач</span>
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
