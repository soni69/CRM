import { useState } from 'react';
import { useTags, useCreateTag } from '../hooks';
import { useCan } from '../../../modules/roles';
import { TagManager } from './TagManager';
import { cn } from '../../../shared/utils/cn';
import { Input } from '../../../shared/ui';

const PALETTE = ['#e06b6b','#f2994a','#f2c94c','#4cb782','#26b5ce','#5e6ad2','#bb6bd9','#888888'];

export function TagPicker({ value, onChange }: { value: number[]; onChange: (ids: number[]) => void }) {
  const { data: tags = [] } = useTags();
  const create = useCreateTag();
  const can = useCan();
  const [newName, setNewName] = useState('');
  const [managing, setManaging] = useState(false);

  const toggle = (id: number) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  const addTag = () => {
    const name = newName.trim();
    if (!name) return;
    create.mutate({ name, color: PALETTE[tags.length % PALETTE.length] }, {
      onSuccess: (d) => { onChange([...value, d.tag.id]); setNewName(''); },
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((t) => (
          <button
            type="button" key={t.id} onClick={() => toggle(t.id)}
            className={cn('rounded-md border px-2 py-1 text-xs font-medium transition-all', value.includes(t.id) ? 'border-transparent' : 'border-border opacity-60 hover:opacity-100')}
            style={value.includes(t.id) ? { background: t.color + '22', color: t.color, borderColor: t.color + '66' } : {}}
          >
            {t.name}
          </button>
        ))}
        {can('board.manage') && tags.length > 0 && (
          <button
            type="button" onClick={() => setManaging(true)} title="Управление тегами"
            className="rounded-md p-1 text-faint hover:bg-hover hover:text-text"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" strokeWidth="1.3"/><path d="M13.3 10a1.5 1.5 0 0 0 .3 1.65l.05.05a1.5 1.5 0 1 1-2.13 2.13l-.05-.05a1.5 1.5 0 0 0-1.65-.3 1.5 1.5 0 0 0-.9 1.37V15a1.5 1.5 0 1 1-3 0v-.07a1.5 1.5 0 0 0-.98-1.37 1.5 1.5 0 0 0-1.65.3l-.05.05a1.5 1.5 0 1 1-2.13-2.13l.05-.05a1.5 1.5 0 0 0 .3-1.65 1.5 1.5 0 0 0-1.37-.9H1a1.5 1.5 0 1 1 0-3h.07a1.5 1.5 0 0 0 1.37-.98 1.5 1.5 0 0 0-.3-1.65l-.05-.05a1.5 1.5 0 1 1 2.13-2.13l.05.05a1.5 1.5 0 0 0 1.65.3h.08a1.5 1.5 0 0 0 .9-1.37V1a1.5 1.5 0 1 1 3 0v.07a1.5 1.5 0 0 0 .9 1.37 1.5 1.5 0 0 0 1.65-.3l.05-.05a1.5 1.5 0 1 1 2.13 2.13l-.05.05a1.5 1.5 0 0 0-.3 1.65v.08a1.5 1.5 0 0 0 1.37.9H15a1.5 1.5 0 1 1 0 3h-.07a1.5 1.5 0 0 0-1.37.9v.06Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
          </button>
        )}
      </div>
      <TagManager open={managing} onClose={() => setManaging(false)} />
      <div className="mt-2 flex gap-2">
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Новый тег…" className="h-7 text-xs" />
      </div>
    </div>
  );
}
