import { Select } from '../../../shared/ui';
import { useUsers } from '../hooks';
import { useProjects } from '../../projects/hooks';

export function AssigneeSelect({ value, onChange, allowEmpty = true, label, projectId }: {
  value: number | null | undefined; onChange: (id: number | null) => void;
  allowEmpty?: boolean; label?: string; projectId?: number | null;
}) {
  const { data: all = [] } = useUsers();
  const { data: projects = [] } = useProjects();
  // Если задан проект — только его участники
  const memberIds = projectId ? new Set(projects.find((p) => p.id === projectId)?.member_ids ?? []) : null;
  const users = memberIds ? all.filter((u) => memberIds.has(u.id)) : all;
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
