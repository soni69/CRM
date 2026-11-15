import { Select, Button } from '../../../shared/ui';
import { STATUSES, STATUS_LABELS, PRIORITIES, PRIORITY_LABELS } from '@crm/contracts';
import type { TaskFilters } from '../hooks';
import type { User, Tag } from '@crm/contracts';

export function FilterChips({ filters, setFilter, reset, active, users, tags }: {
  filters: TaskFilters;
  setFilter: (k: keyof TaskFilters, v?: string) => void;
  reset: () => void;
  active: number;
  users: User[];
  tags: Tag[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={filters.status ?? ''} onChange={(e) => setFilter('status', e.target.value || undefined)} className="h-8 w-auto text-xs">
        <option value="">Все статусы</option>
        {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
      </Select>
      <Select value={filters.assignee_id ?? ''} onChange={(e) => setFilter('assignee_id', e.target.value || undefined)} className="h-8 w-auto max-w-40 text-xs">
        <option value="">Любой исполнитель</option>
        {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
      </Select>
      <Select value={filters.priority ?? ''} onChange={(e) => setFilter('priority', e.target.value || undefined)} className="h-8 w-auto text-xs">
        <option value="">Любой приоритет</option>
        {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
      </Select>
      {tags.length > 0 && (
        <Select value={filters.tag_id ?? ''} onChange={(e) => setFilter('tag_id', e.target.value || undefined)} className="h-8 w-auto text-xs">
          <option value="">Все теги</option>
          {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
      )}
      <button
        onClick={() => setFilter('overdue', filters.overdue ? undefined : 'true')}
        className={`h-8 rounded-lg border px-2.5 text-xs font-medium transition-colors ${filters.overdue ? 'border-danger bg-danger-soft text-danger' : 'border-border text-muted hover:bg-hover'}`}
      >
        Просроченные
      </button>
      {active > 0 && <Button variant="ghost" size="sm" onClick={reset}>Сбросить ({active})</Button>}
    </div>
  );
}
