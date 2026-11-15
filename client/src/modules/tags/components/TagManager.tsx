import { useState } from 'react';
import { useTags, useTagMutations } from '../hooks';
import { Modal, ModalHeader, Input, Button, ConfirmDialog, EmptyState } from '../../../shared/ui';
import { cn } from '../../../shared/utils/cn';

const PALETTE = ['#e06b6b','#f2994a','#f2c94c','#4cb782','#26b5ce','#5e6ad2','#bb6bd9','#888888'];

export function TagManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: tags = [] } = useTags();
  const mut = useTagMutations();
  const [confirmId, setConfirmId] = useState<number | null>(null);

  return (
    <Modal open={open} onClose={onClose} className="max-w-md">
      <ModalHeader title="Управление тегами" onClose={onClose} />
      <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto p-5">
        {tags.map((t) => (
          <div key={t.id} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ background: t.color }} />
              <Input
                key={t.id + t.name}
                defaultValue={t.name}
                maxLength={40}
                className="h-8 text-xs"
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== t.name) mut.update.mutate({ id: t.id, name: v });
                }}
              />
              <Button variant="ghost" size="sm" className="text-danger" onClick={() => setConfirmId(t.id)}>Удалить</Button>
            </div>
            <div className="flex gap-1.5 pl-5">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => c !== t.color && mut.update.mutate({ id: t.id, color: c })}
                  className={cn('h-5 w-5 rounded-full transition-transform hover:scale-110', t.color === c && 'scale-110 ring-2 ring-text')}
                  style={{ background: c }}
                  aria-label={`Цвет ${c}`}
                />
              ))}
            </div>
          </div>
        ))}
        {!tags.length && <EmptyState title="Тегов пока нет" hint="Создайте тег в поле «Теги» задачи" />}
      </div>
      <ConfirmDialog
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => { if (confirmId) mut.remove.mutate(confirmId); setConfirmId(null); }}
        title="Удалить тег?"
        body="Тег будет снят со всех задач. Действие необратимо."
      />
    </Modal>
  );
}
