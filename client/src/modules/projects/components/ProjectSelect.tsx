import { Select } from '../../../shared/ui';
import { useProjects } from '../hooks';

// Выбор проекта в форме задачи / фильтрах
export function ProjectSelect({ value, onChange, className, empty = 'Без проекта' }: {
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  className?: string;
  empty?: string;
}) {
  const { data: projects = [] } = useProjects();
  return (
    <Select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      className={className}
    >
      <option value="">{empty}</option>
      {projects.map((p) => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </Select>
  );
}
