import { Button, Select } from '../../../shared/ui';
import { STATUSES, STATUS_LABELS } from '@crm/contracts';
import { AssigneeSelect } from '../../../modules/users';
import { useBulk } from '../hooks';
import { useState } from 'react';
import { useToast } from '../../../shared/ui';
import { ApiError } from '../../../shared/api/client';

export function BulkBar({ selected, onDone }: { selected: Set<number>; onDone: () => void }) {
  const bulk = useBulk();
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [assignee, setAssignee] = useState<number | null>(null);
  if (!selected.size) return null;

  const run = (action: 'status' | 'assign' | 'delete', value?: unknown) =>
    bulk.mutate({ ids: [...selected], action, value: value as never }, {
      onSuccess: (r) => {
        if (r.failed.length) toast(`Готово: ${r.done.length}, ошибок: ${r.failed.length}`, 'err');
        else toast(`Обновлено задач: ${r.done.length}`);
        onDone();
      },
      onError: (e) => toast(e instanceof ApiError ? e.message : 'Ошибка', 'err'),
    });

  return (
    <div className="anim-pop fixed bottom-16 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-border bg-raised px-4 py-2.5 shadow-2xl sm:bottom-6">
      <span className="text-sm font-medium">Выбрано: {selected.size}</span>
      <Select value={status} onChange={(e) => { if (e.target.value) run('status', e.target.value); setStatus(''); }} className="h-8 w-auto text-xs">
        <option value="">Статус…</option>
        {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
      </Select>
      <div className="w-36">
        <AssigneeSelect value={assignee} onChange={(v) => { if (v) run('assign', v); setAssignee(null); }} />
      </div>
      <Button variant="danger" size="sm" onClick={() => run('delete')}>Удалить</Button>
      <Button variant="ghost" size="sm" onClick={onDone}>Снять</Button>
    </div>
  );
}
