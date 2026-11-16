import { useState, type FormEvent } from 'react';
import type { ProjectView, CreateProjectInput } from '@crm/contracts';
import { Avatar, Button, Field, Input, Modal, ModalHeader, Select } from '../../../shared/ui';
import { ApiError } from '../../../shared/api/client';
import { cn } from '../../../shared/utils/cn';
import { useUsers } from '../../users';
import { useProjectMutations } from '../hooks';

export const PALETTE = ['#5e6ad2', '#4cb782', '#f2994a', '#26b5ce', '#bb6bd9', '#e06b6b', '#f2c94c', '#8d94a8'];

export function ProjectModal({ project, onClose }: { project?: ProjectView; onClose: () => void }) {
  const mut = useProjectMutations();
  const { data: users = [] } = useUsers();
  const [form, setForm] = useState<CreateProjectInput>({
    name: project?.name ?? '',
    description: project?.description ?? '',
    goal: project?.goal ?? '',
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
        <Field label="Цель проекта">
          <textarea
            value={form.goal}
            onChange={(e) => setForm({ ...form, goal: e.target.value })}
            rows={2}
            placeholder="Чего хотим достичь этим проектом?"
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
