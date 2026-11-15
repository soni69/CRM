import { Select } from '../../../shared/ui';
import { useUsers } from '../hooks';

export function AssigneeSelect({ value, onChange, allowEmpty = true, label }: {
  value: number | null | undefined; onChange: (id: number | null) => void;
  allowEmpty?: boolean; label?: string;
}) {
  const { data: users = [] } = useUsers();
  return (
    <Select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      aria-label={label}
    >
      {allowEmpty && <option value="">Не назначен</option>}
      {users.map((u) => (
        <option key={u.id} value={u.id}>{u.name}{u.open_tasks ? ` (${u.open_tasks})` : ''}</option>
      ))}
    </Select>
  );
}
