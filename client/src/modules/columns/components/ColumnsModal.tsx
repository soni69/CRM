import { useState } from 'react';
import type { BoardColumn } from '@crm/contracts';
import { Modal, ModalHeader, Button, Input, ConfirmDialog } from '../../../shared/ui';
import { useColumns, useColumnMutations } from '../hooks';
import { useCan } from '../../roles';
import { cn } from '../../../shared/utils/cn';

const PALETTE = ['#26b5ce', '#f2c94c', '#4cb782', '#e06b6b', '#5e6ad2', '#bb6bd9', '#f2994a', '#8d94a8'];

function ColumnRow({ col, index, total }: { col: BoardColumn; index: number; total: number }) {
  const m = useColumnMutations();
  const { data: columns = [] } = useColumns();
  const [name, setName] = useState(col.name);
  const [confirmDel, setConfirmDel] = useState(false);

  const move = (dir: -1 | 1) => {
    const ids = columns.map((c) => c.id);
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    m.reorder.mutate(ids);
  };

  return (
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
  );
}

// Настройка колонок доски: порядок, цвет, видимость, «финальный» статус
export function ColumnsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: columns = [] } = useColumns();
  const m = useColumnMutations();
  const can = useCan();
  const canManage = can('task.update.any');
  const [newName, setNewName] = useState('');

  const add = () => {
    const name = newName.trim();
    if (!name) return;
    m.create.mutate({ name, color: PALETTE[columns.length % PALETTE.length] });
    setNewName('');
  };

  return (
    <Modal open={open} onClose={onClose} className="max-w-2xl">
      <ModalHeader title="Колонки доски" onClose={onClose} />
      <div className="flex flex-col gap-2 p-4">
        {columns.map((c, i) => (
          <ColumnRow key={c.id} col={c} index={i} total={columns.length} />
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
        <p className="text-xs text-faint">▲▼ — порядок на доске · «Финал» — задачи с этим статусом считаются завершёнными (отчёты, просрочка, зачёркивание)</p>
      </div>
    </Modal>
  );
}
