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
      {list.map((u) => (
        <button
          type="button" key={u.id} onClick={() => toggle(u.id)}
          className={cn('flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-hover', value.includes(u.id) && 'bg-accent-soft')}
        >
          <Avatar name={u.name} id={u.id} size={20} />
          <span className="flex-1 truncate">{u.name}</span>
          {value.includes(u.id) && <span className="text-accent">✓</span>}
        </button>
      ))}
      {!list.length && <p className="p-2 text-xs text-faint">Нет пользователей</p>}
    </div>
  );
}
