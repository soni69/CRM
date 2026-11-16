import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useColumns, ColumnsModal } from '../../../modules/columns';
import { PageSpinner, EmptyState, Button, Tabs } from '../../../shared/ui';
import { cn } from '../../../shared/utils/cn';

type View = 'board' | 'list';

export function BoardPage() {
  const nav = useNavigate();
  const [view, setView] = useState<View>('board');
  const [colTab, setColTab] = useState<string>(''); // мобильные табы
  const [colsOpen, setColsOpen] = useState(false);
  const openTask = (id: number) => nav(`/tasks/${id}`);
  const { filters, setFilter, reset, active } = useTaskFilters();
  const { data: all = [], isLoading } = useTasks();
  const filtered = useSearchTasks(filters, active > 0);
  const { data: users = [] } = useUsers();
  const { data: tags = [] } = useTags();
  const { data: columns = [] } = useColumns();
  const sel = useSelection();

  const visible = columns.filter((c) => !c.hidden);
  const tabKey = colTab || visible[0]?.key || '';

  const tasks = active > 0 ? (filtered.data ?? []) : all;
  const byStatus = useMemo(() => {
    const m = new Map(columns.map((c) => [c.key, [] as typeof tasks]));
    const rest: typeof tasks = [];
    for (const t of tasks) {
      const bucket = m.get(t.status);
      if (bucket) bucket.push(t); else rest.push(t);
    }
    if (rest.length) m.set('__other__', rest);
    return m;
  }, [tasks, columns]);

  if (isLoading) return <PageSpinner />;

  return (
    <div className="flex h-full flex-col">
      {/* Панель: поиск + фильтры + вид + действия */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-raised px-4 py-2.5">
        <SearchBar value={filters.q ?? ''} onChange={(v) => setFilter('q', v || undefined)} />
        <FilterChips filters={filters} setFilter={setFilter} reset={reset} active={active} users={users} tags={tags} />
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => setColsOpen(true)}
            className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-hover"
            title="Настроить колонки доски"
          >
            Колонки
          </button>
          <div className="flex rounded-lg border border-border p-0.5">
            {([['board', 'Канбан'], ['list', 'Список']] as const).map(([v, l]) => (
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
          <Tabs tabs={visible.map((c) => ({ id: c.key, label: c.name, count: byStatus.get(c.key)?.length }))} value={tabKey} onChange={setColTab} />
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto">
        {tasks.length === 0 ? (
          <EmptyState title={active ? 'Ничего не найдено' : 'Задач пока нет'} hint={active ? 'Попробуйте изменить фильтры' : 'Создайте первую задачу'} action={!active && <Button size="sm" onClick={() => nav('/tasks/new')}>+ Создать</Button>} />
        ) : view === 'board' ? (
          <>
            {/* Десктоп: видимые колонки */}
            <div className="hidden h-full gap-3 overflow-x-auto p-4 sm:flex">
              {visible.map((c) => (
                <BoardColumn key={c.key} column={c} tasks={byStatus.get(c.key) ?? []} onOpen={openTask} selected={sel.selected} onSelect={sel.toggle} />
              ))}
              {(byStatus.get('__other__')?.length ?? 0) > 0 && (
                <section className="flex min-h-40 min-w-60 flex-1 basis-0 flex-col rounded-xl border border-border border-t-2 border-t-faint bg-surface">
                  <header className="px-3 py-2.5"><h3 className="text-sm font-semibold text-muted">Без колонки</h3></header>
                  <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2.5 pb-2">
                    {byStatus.get('__other__')!.map((t) => <TaskCard key={t.id} task={t} onOpen={openTask} selected={sel.selected.has(t.id)} onSelect={sel.toggle} />)}
                  </div>
                </section>
              )}
            </div>
            {/* Мобильный: одна колонка-таб */}
            <div className="flex flex-col gap-2 p-3 sm:hidden">
              {(byStatus.get(tabKey) ?? []).map((t) => (
                <div key={t.id} className="rounded-lg border border-border bg-raised">
                  <CardMobile task={t} onOpen={openTask} />
                </div>
              ))}
              {!(byStatus.get(tabKey) ?? []).length && <p className="py-8 text-center text-xs text-faint">Пусто</p>}
            </div>
          </>
        ) : (
          <div className="mx-auto max-w-6xl">
            {visible.map((c) => (byStatus.get(c.key)?.length ?? 0) > 0 && (
              <div key={c.key}>
                <h3 className="bg-surface px-4 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: c.color }}>{c.name} · {byStatus.get(c.key)!.length}</h3>
                {byStatus.get(c.key)!.map((t) => <TaskRow key={t.id} task={t} onOpen={openTask} selected={sel.selected.has(t.id)} onSelect={sel.toggle} />)}
              </div>
            ))}
            {(byStatus.get('__other__')?.length ?? 0) > 0 && (
              <div>
                <h3 className="bg-surface px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted">Без колонки · {byStatus.get('__other__')!.length}</h3>
                {byStatus.get('__other__')!.map((t) => <TaskRow key={t.id} task={t} onOpen={openTask} selected={sel.selected.has(t.id)} onSelect={sel.toggle} />)}
              </div>
            )}
          </div>
        )}
      </div>

      <BulkBar selected={sel.selected} onDone={sel.clear} />
      <ColumnsModal open={colsOpen} onClose={() => setColsOpen(false)} />
    </div>
  );
}

// Компактная карточка для мобильной доски
function CardMobile({ task, onOpen }: { task: TaskView; onOpen: (id: number) => void }) {
  return <TaskCard task={task} onOpen={onOpen} selected={false} onSelect={() => {}} />;
}
