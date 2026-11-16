import { useState } from 'react';
import type { ProjectView } from '@crm/contracts';
import { Avatar, Button, DatePicker, Input, Select } from '../../../shared/ui';
import { useUsers } from '../../users';
import { useProjectMutations } from '../hooks';
import { formatDate, isOverdue } from '../../../shared/utils/format';
import { cn } from '../../../shared/utils/cn';

// Этапы проекта: подцели со своими ответственными и сроками
export function ProjectStages({ project, canManage }: { project: ProjectView; canManage: boolean }) {
  const mut = useProjectMutations();
  const { data: users = [] } = useUsers();
  const [title, setTitle] = useState('');
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [due, setDue] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const members = users.filter((u) => project.member_ids.includes(u.id));
  const stages = project.stages;
  const doneCount = stages.filter((s) => s.done).length;

  const add = () => {
    if (!title.trim()) return;
    mut.addStage.mutate(
      { id: project.id, title: title.trim(), owner_id: ownerId, due_date: due || null },
      { onSuccess: () => { setTitle(''); setOwnerId(null); setDue(''); setFormOpen(false); } },
    );
  };

  return (
    <section className="mb-5 rounded-xl border border-border bg-raised p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          Этапы
          {stages.length > 0 && <span className="text-xs font-normal text-faint">{doneCount} из {stages.length}</span>}
        </h2>
        {canManage && !formOpen && (
          <Button size="sm" variant="ghost" onClick={() => setFormOpen(true)}>+ Этап</Button>
        )}
      </div>

      {stages.length > 0 && (
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-hover">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.round((doneCount / stages.length) * 100)}%`, background: project.color }}
          />
        </div>
      )}

      <div className="flex flex-col">
        {stages.map((s) => (
          <div key={s.id} className="group flex items-center gap-3 border-b border-border/60 py-2.5 last:border-0">
            <input
              type="checkbox"
              checked={!!s.done}
              onChange={(e) => mut.updateStage.mutate({ id: project.id, sid: s.id, done: e.target.checked ? 1 : 0 })}
              className="h-4 w-4 shrink-0 accent-accent"
              title={s.done ? 'Снять отметку' : 'Отметить выполненным'}
            />
            <span className={cn('min-w-0 flex-1 truncate text-sm', s.done && 'text-faint line-through')}>{s.title}</span>
            {s.due_date && (
              <span className={cn('w-24 shrink-0 font-mono text-[11px]', isOverdue(s.due_date, !!s.done) ? 'text-danger' : 'text-faint')}>
                {formatDate(s.due_date)}
              </span>
            )}
            {s.owner ? (
              <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted" title={`Ответственный: ${s.owner.name}`}>
                <Avatar name={s.owner.name} id={s.owner.id} size={20} />
                <span className="hidden sm:inline">{s.owner.name}</span>
              </span>
            ) : (
              <span className="w-20 shrink-0 text-right text-[11px] text-faint">без ответств.</span>
            )}
            {canManage && (
              <button
                onClick={() => mut.removeStage.mutate({ id: project.id, sid: s.id })}
                className="rounded p-1 text-faint opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                title="Удалить этап"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3 3l10 10M13 3L3 13"/></svg>
              </button>
            )}
          </div>
        ))}
        {stages.length === 0 && !formOpen && (
          <p className="py-2 text-xs text-faint">Этапов пока нет — разбейте проект на подцели.</p>
        )}
      </div>

      {formOpen && canManage && (
        <div className="mt-3 flex flex-col gap-2 rounded-lg border border-border bg-surface p-3">
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="Название этапа…"
            className="h-8 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <Select value={ownerId ?? ''} onChange={(e) => setOwnerId(e.target.value ? Number(e.target.value) : null)} className="h-8 text-xs">
              <option value="">Без ответственного</option>
              {members.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
            <DatePicker value={due} onChange={(v) => setDue(v ?? '')} placeholder="Срок этапа" />
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setFormOpen(false)}>Отмена</Button>
            <Button size="sm" onClick={add} disabled={!title.trim() || mut.addStage.isPending}>Добавить</Button>
          </div>
        </div>
      )}
    </section>
  );
}
