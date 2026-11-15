import { Select } from '../../../shared/ui';
import { useSprints } from '../hooks';

export function SprintSelect({ value, onChange }: { value: number | null | undefined; onChange: (id: number | null) => void }) {
  const { data: sprints = [] } = useSprints();
  return (
    <Select value={value ?? ''} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}>
      <option value="">Без спринта</option>
      {sprints.filter((s) => s.status !== 'closed').map((s) => (
        <option key={s.id} value={s.id}>{s.name}</option>
      ))}
    </Select>
  );
}
