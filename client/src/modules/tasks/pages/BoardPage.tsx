import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { STATUSES, STATUS_LABELS } from '@crm/contracts';
import { useTasks, useSelection } from '../hooks';
import { BoardColumn } from '../components/BoardColumn';
import { TaskCard } from '../components/TaskCard';
import type { TaskView } from '@crm/contracts';
import { TaskRow } from '../components/TaskRow';
import { BulkBar } from '../components/BulkBar';
import { SearchBar, FilterChips, useTaskFilters, useSearchTasks } from '../../../modules/search';
import { useUsers } from '../../../modules/users';
import { useTags } from '../../../modules/tags';
import { TransferButtons } from '../../../modules/transfer';
import { PageSpinner, EmptyState, Button, Tabs } from '../../../shared/ui';
import { cn } from '../../../shared/utils/cn';

type View = 'board' | 'list';

export function BoardPage() {
  const nav = useNavigate();
  const [view, setView] = useState<View>('board');
  const [colTab, setColTab] = useState<(typeof STATUSES)[number]>('new'); // мобильные табы
  const openTask = (id: number) => nav(`/tasks/${id}`);
  const { filters, setFilter, reset, active } = useTaskFilters();
  const { data: all = [], isLoading } = useTasks();
  const filtered = useSearchTasks(filters, active > 0);
  const { data: users = [] } = useUsers();
  const { data: tags = [] } = useTags();
  const sel = useSelection();

  const tasks = active > 0 ? (filtered.data ?? []) : all;
  const byStatus = useMemo(() => {
    const m = new Map(STATUSES.map((s) => [s, [] as typeof tasks]));
    for (const t of tasks) m.get(t.status)?.push(t);
    return m;
  }, [tasks]);

  if (isLoading) return <PageSpinner />;

  return (
    <div className="flex h-full flex-col">
      {/* Панель: поиск + фильтры + вид + действия */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-raised px-4 py-2.5">
        <SearchBar value={filters.q ?? ''} onChange={(v) => setFilter('q', v || undefined)} />
        <FilterChips filters={filters} setFilter={setFilter} reset={reset} active={active} users={users} tags={tags} />
        <div className="ml-auto flex items-center gap-1.5">
          <div className="flex rounded-lg border border-border p-0.5">
            {([['board', 'Доска'], ['list', 'Список']] as const).map(([v, l]) => (
              <button key={v} onClick={() => setView(v)} className={cn('rounded-md px-2.5 py-1 text-xs font-medium', view === v ? 'bg-hover text-text' : 'text-muted')}>{l}</button>
            ))}
          </div>
          <TransferButtons />
          <Button size="sm" onClick={() => nav('/tasks/new')}>+ Задача</Button>
        </div>
      </div>

      {/* Мобильные табы колонок */}
      {view === 'board' && (
        <div className="border-b border-border px-2 sm:hidden">
          <Tabs tabs={STATUSES.map((s) => ({ id: s, label: STATUS_LABELS[s], count: byStatus.get(s)?.length }))} value={colTab} onChange={setColTab} />
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto">
        {tasks.length === 0 ? (
          <EmptyState title={active ? 'Ничего не найдено' : 'Задач пока нет'} hint={active ? 'Попробуйте изменить фильтры' : 'Создайте первую задачу'} action={!active && <Button size="sm" onClick={() => nav('/tasks/new')}>+ Создать</Button>} />
        ) : view === 'board' ? (
          <>
            {/* Десктоп: 3 колонки */}
            <div className="hidden h-full gap-3 overflow-x-auto p-4 sm:flex">
              {STATUSES.map((s) => (
                <BoardColumn key={s} status={s} title={STATUS_LABELS[s]} tasks={byStatus.get(s) ?? []} onOpen={openTask} selected={sel.selected} onSelect={sel.toggle} />
              ))}
            </div>
            {/* Мобильный: одна колонка-таб */}
            <div className="flex flex-col gap-2 p-3 sm:hidden">
              {(byStatus.get(colTab) ?? []).map((t) => (
                <div key={t.id} className="rounded-lg border border-border bg-raised">
                  <CardMobile task={t} onOpen={openTask} />
                </div>
              ))}
              {!(byStatus.get(colTab) ?? []).length && <p className="py-8 text-center text-xs text-faint">Пусто</p>}
            </div>
          </>
        ) : (
          <div className="mx-auto max-w-4xl">
            {STATUSES.map((s) => (byStatus.get(s)?.length ?? 0) > 0 && (
              <div key={s}>
                <h3 className="bg-surface px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted">{STATUS_LABELS[s]} · {byStatus.get(s)!.length}</h3>
                {byStatus.get(s)!.map((t) => <TaskRow key={t.id} task={t} onOpen={openTask} selected={sel.selected.has(t.id)} onSelect={sel.toggle} />)}
              </div>
            ))}
          </div>
        )}
      </div>

      <BulkBar selected={sel.selected} onDone={sel.clear} />
    </div>
  );
}

// Компактная карточка для мобильной доски
function CardMobile({ task, onOpen }: { task: TaskView; onOpen: (id: number) => void }) {
  return <TaskCard task={task} onOpen={onOpen} selected={false} onSelect={() => {}} />;
}
