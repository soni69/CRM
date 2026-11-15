import { useState } from 'react';
import { useTags, useCreateTag } from '../hooks';
import { cn } from '../../../shared/utils/cn';
import { Input } from '../../../shared/ui';

const PALETTE = ['#e06b6b','#f2994a','#f2c94c','#4cb782','#26b5ce','#5e6ad2','#bb6bd9','#888888'];

export function TagPicker({ value, onChange }: { value: number[]; onChange: (ids: number[]) => void }) {
  const { data: tags = [] } = useTags();
  const create = useCreateTag();
  const [newName, setNewName] = useState('');

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
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <button
            type="button" key={t.id} onClick={() => toggle(t.id)}
            className={cn('rounded-md border px-2 py-1 text-xs font-medium transition-all', value.includes(t.id) ? 'border-transparent' : 'border-border opacity-60 hover:opacity-100')}
            style={value.includes(t.id) ? { background: t.color + '22', color: t.color, borderColor: t.color + '66' } : {}}
          >
            {t.name}
          </button>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Новый тег…" className="h-7 text-xs" />
      </div>
    </div>
  );
}
