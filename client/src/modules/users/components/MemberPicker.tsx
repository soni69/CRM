import { useUsers } from '../hooks';
import { cn } from '../../../shared/utils/cn';
import { Avatar } from '../../../shared/ui';

// Мультивыбор пользователей — для соисполнителей и наблюдателей
export function MemberPicker({ value, onChange, exclude = [] }: {
  value: number[]; onChange: (ids: number[]) => void; exclude?: number[];
}) {
  const { data: users = [] } = useUsers();
  const list = users.filter((u) => !exclude.includes(u.id));
  const toggle = (id: number) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  return (
    <div className="flex max-h-36 flex-col gap-0.5 overflow-y-auto rounded-lg border border-border p-1">
      {list.map((u) => {
        const sel = value.includes(u.id);
        return (
          <button
            type="button" key={u.id} onClick={() => toggle(u.id)}
            className={cn('flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-hover', sel && 'bg-accent-soft')}
          >
            <span className={cn(
              'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
              sel ? 'border-accent bg-accent' : 'border-border-strong',
            )}>
              {sel && <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M1.5 5.5L4 8l4.5-5.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </span>
            <Avatar name={u.name} id={u.id} size={20} />
            <span className={cn('flex-1 truncate', !sel && 'text-muted')}>{u.name}</span>
          </button>
        );
      })}
      {!list.length && <p className="p-2 text-xs text-faint">Нет пользователей</p>}
    </div>
  );
}
