import { useState } from 'react';
import type { BoardColumn } from '@crm/contracts';
import { Modal, ModalHeader, Button, Input, ConfirmDialog } from '../../../shared/ui';
import { useColumns, useColumnMutations } from '../hooks';
import { useCan } from '../../roles';
import { cn } from '../../../shared/utils/cn';

const PALETTE = ['#26b5ce', '#f2c94c', '#4cb782', '#e06b6b', '#5e6ad2', '#bb6bd9', '#f2994a', '#8d94a8'];

// Правила переходов и автоподзадачи колонки
function ColumnRules({ col, columns }: { col: BoardColumn; columns: BoardColumn[] }) {
  const m = useColumnMutations();
  const others = columns.filter((c) => c.id !== col.id);
  const unrestricted = col.allowed_to === null;
  const allowed = new Set(col.allowed_to ?? others.map((c) => c.key));

  const toggleTarget = (key: string) => {
    const next = new Set(allowed);
    next.has(key) ? next.delete(key) : next.add(key);
    // все разрешены = null (без ограничений)
    const all = others.every((c) => next.has(c.key));
    m.update.mutate({ id: col.id, allowed_to: all ? null : [...next] });
  };

  const saveSubtasks = (text: string) => {
    const titles = text.split('\n').map((s) => s.trim()).filter(Boolean);
    m.update.mutate({ id: col.id, auto_subtasks: titles });
  };

  return (
    <div className="ml-8 mt-1.5 flex flex-col gap-2 rounded-lg border border-border bg-surface p-2.5 text-xs">
      <div>
        <p className="mb-1 font-medium text-muted">Разрешённые переходы из «{col.name}»:</p>
        <div className="flex flex-wrap gap-1.5">
          {others.map((c) => (
            <button
              key={c.key}
              onClick={() => toggleTarget(c.key)}
              className={cn(
                'rounded-md border px-2 py-1 transition-colors',
                (unrestricted || allowed.has(c.key))
                  ? 'border-accent/50 bg-accent-soft text-accent'
                  : 'border-border text-faint opacity-50 hover:opacity-100',
              )}
            >
              {c.name}
            </button>
          ))}
          {unrestricted && <span className="self-center text-faint">(все — без ограничений)</span>}
        </div>
      </div>
      <div>
        <p className="mb-1 font-medium text-muted">Автоподзадачи при входе в «{col.name}» (по одной на строку):</p>
        <textarea
          defaultValue={col.auto_subtasks.join('\n')}
          onBlur={(e) => saveSubtasks(e.target.value)}
          placeholder={'Например:\nПроверить код\nНаписать тесты'}
          rows={Math.max(2, col.auto_subtasks.length)}
          className="w-full rounded-md border border-border bg-raised px-2 py-1.5 text-xs outline-none focus:border-accent"
        />
      </div>
    </div>
  );
}

function ColumnRow({ col, index, total, columns }: { col: BoardColumn; index: number; total: number; columns: BoardColumn[] }) {
  const m = useColumnMutations();
  const [name, setName] = useState(col.name);
  const [confirmDel, setConfirmDel] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  const move = (dir: -1 | 1) => {
    const ids = columns.map((c) => c.id);
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    m.reorder.mutate(ids);
  };

  return (
    <div>
      <div className={cn('flex items-center gap-2 rounded-lg border border-border bg-raised p-2', col.hidden && 'opacity-50')}>
        <div className="flex flex-col">
          <button onClick={() => move(-1)} disabled={index === 0} className="px-1 text-xs text-faint hover:text-text disabled:opacity-30" title="Выше">▲</button>
          <button onClick={() => move(1)} disabled={index === total - 1} className="px-1 text-xs text-faint hover:text-text disabled:opacity-30" title="Ниже">▼</button>
        </div>
        <span className="h-4 w-4 shrink-0 rounded-full border border-border" style={{ backgroundColor: col.color }} />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name.trim() && name !== col.name && m.update.mutate({ id: col.id, name: name.trim() })}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          className="h-8 flex-1 text-xs"
        />
        <div className="flex gap-1">
          {PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => m.update.mutate({ id: col.id, color: c })}
              className={cn('h-4 w-4 rounded-full transition-transform hover:scale-110', col.color === c && 'ring-2 ring-accent ring-offset-1 ring-offset-raised')}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <label className="flex items-center gap-1 text-xs text-muted" title="Статус этой колонки считается завершённым">
          <input
            type="checkbox"
            checked={!!col.is_done}
            onChange={(e) => m.update.mutate({ id: col.id, is_done: e.target.checked })}
            className="accent-accent"
          />
          Финал
        </label>
        <button
          onClick={() => setRulesOpen((v) => !v)}
          className={cn('rounded border px-2 py-1 text-xs', rulesOpen ? 'border-accent bg-accent-soft text-accent' : 'border-border text-muted hover:bg-hover')}
          title="Правила переходов и автоподзадачи"
        >
          Правила
        </button>
        <button
          onClick={() => m.update.mutate({ id: col.id, hidden: !col.hidden })}
          className="rounded border border-border px-2 py-1 text-xs text-muted hover:bg-hover"
          title={col.hidden ? 'Показать на доске' : 'Скрыть с доски'}
        >
          {col.hidden ? 'Показать' : 'Скрыть'}
        </button>
        <button onClick={() => setConfirmDel(true)} className="rounded px-2 py-1 text-xs text-danger hover:bg-danger/10">✕</button>
        <ConfirmDialog
          open={confirmDel}
          onClose={() => setConfirmDel(false)}
          onConfirm={() => { m.remove.mutate(col.id); setConfirmDel(false); }}
          title="Удалить колонку?"
          body={`«${col.name}» будет удалена. В колонке не должно быть задач.`}
        />
      </div>
      {rulesOpen && <ColumnRules col={col} columns={columns} />}
    </div>
  );
}

// Настройка колонок доски: порядок, цвет, видимость, правила переходов
export function ColumnsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: columns = [] } = useColumns();
  const m = useColumnMutations();
  const can = useCan();
  const canManage = can('board.manage');
  const [newName, setNewName] = useState('');

  const add = () => {
    const name = newName.trim();
    if (!name) return;
    m.create.mutate({ name, color: PALETTE[columns.length % PALETTE.length] });
    setNewName('');
  };

  return (
    <Modal open={open} onClose={onClose} className="max-w-2xl">
      <ModalHeader title="Колонки канбана" onClose={onClose} />
      <div className="flex flex-col gap-2 p-4">
        {columns.map((c, i) => (
          <ColumnRow key={c.id} col={c} index={i} total={columns.length} columns={columns} />
        ))}
        {canManage && (
          <div className="mt-1 flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
              placeholder="Название новой колонки…"
              className="h-9 flex-1"
            />
            <Button onClick={add} disabled={!newName.trim() || m.create.isPending}>+ Добавить</Button>
          </div>
        )}
        <p className="text-xs text-faint">▲▼ — порядок на доске · «Финал» — задачи завершены · «Правила» — разрешённые переходы и автоподзадачи</p>
      </div>
    </Modal>
  );
}
