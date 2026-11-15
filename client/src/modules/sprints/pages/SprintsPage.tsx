import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useSprints, useSprintMutations } from '../hooks';
import { Button, Field, Input, Modal, ModalHeader, PageSpinner, EmptyState, Badge, ConfirmDialog } from '../../../shared/ui';
import type { ListedSprint } from '../api';
import { SPRINT_STATUS_LABELS, type CreateSprintInput } from '@crm/contracts';
import { formatDate } from '../../../shared/utils/format';
import { useCan } from '../../roles';

const TONE = { planned: 'gray', active: 'accent', closed: 'green' } as const;

export function SprintsPage() {
  const can = useCan();
  const { data: sprints = [], isLoading } = useSprints();
  const mut = useSprintMutations();
  const [creating, setCreating] = useState(false);
  const [delId, setDelId] = useState<number | null>(null);

  if (isLoading) return <PageSpinner />;

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Спринты</h1>
        <Button size="sm" onClick={() => setCreating(true)}>+ Спринт</Button>
      </div>
      <div className="flex flex-col gap-2">
        {sprints.map((s) => (
          <SprintRow key={s.id} s={s} canEdit={can('task.update.any')} onDelete={() => setDelId(s.id)} onStatus={(st) => mut.update.mutate({ id: s.id, d: { status: st } })} />
        ))}
        {!sprints.length && <EmptyState title="Спринтов нет" hint="Создайте первый спринт" action={<Button size="sm" onClick={() => setCreating(true)}>+ Создать</Button>} />}
      </div>
      <CreateSprintModal open={creating} onClose={() => setCreating(false)} />
      <ConfirmDialog open={delId !== null} onClose={() => setDelId(null)} onConfirm={() => delId && mut.remove.mutate(delId)} title="Удалить спринт?" body="Задачи останутся, но потеряют привязку к спринту." />
    </div>
  );
}

function SprintRow({ s, canEdit, onDelete, onStatus }: { s: ListedSprint; canEdit: boolean; onDelete: () => void; onStatus: (st: 'active' | 'closed') => void }) {
  const pct = s.task_count ? Math.round((s.done_count / s.task_count) * 100) : 0;
  return (
    <div className="rounded-xl border border-border bg-raised p-4">
      <div className="flex items-center gap-3">
        <Link to={`/sprints/${s.id}`} className="font-medium text-accent hover:underline">{s.name}</Link>
        <Badge tone={TONE[s.status]}>{SPRINT_STATUS_LABELS[s.status]}</Badge>
        <span className="ml-auto font-mono text-xs text-muted">{formatDate(s.start_date)} — {formatDate(s.end_date)}</span>
        {canEdit && (
          <div className="flex gap-1">
            {s.status === 'planned' && <Button size="sm" variant="outline" onClick={() => onStatus('active')}>Старт</Button>}
            {s.status === 'active' && <Button size="sm" variant="outline" onClick={() => onStatus('closed')}>Закрыть</Button>}
            <Button size="sm" variant="ghost" onClick={onDelete} className="text-danger">×</Button>
          </div>
        )}
      </div>
      {s.goal && <p className="mt-1 text-sm text-muted">{s.goal}</p>}
      <div className="mt-2.5 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-hover">
          <div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-faint">{s.done_count}/{s.task_count}</span>
      </div>
    </div>
  );
}

function CreateSprintModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const mut = useSprintMutations();
  const [f, setF] = useState<CreateSprintInput>({ name: '', goal: '', start_date: new Date().toISOString().slice(0, 10), end_date: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10) });
  const submit = (e: FormEvent) => { e.preventDefault(); mut.create.mutate(f, { onSuccess: onClose }); };
  return (
    <Modal open={open} onClose={onClose} className="max-w-sm">
      <ModalHeader title="Новый спринт" onClose={onClose} />
      <form onSubmit={submit} className="flex flex-col gap-3 p-5">
        <Field label="Название"><Input required autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Спринт 2" /></Field>
        <Field label="Цель"><Input value={f.goal} onChange={(e) => setF({ ...f, goal: e.target.value })} placeholder="Что должны успеть…" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Начало"><Input type="date" required value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value })} /></Field>
          <Field label="Конец"><Input type="date" required value={f.end_date} onChange={(e) => setF({ ...f, end_date: e.target.value })} /></Field>
        </div>
        <Button type="submit" disabled={mut.create.isPending}>Создать</Button>
      </form>
    </Modal>
  );
}
