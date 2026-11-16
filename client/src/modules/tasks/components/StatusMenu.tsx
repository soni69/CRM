import { Dropdown, DropdownItem } from '../../../shared/ui';
import { StatusBadge } from './badges';
import { cn } from '../../../shared/utils/cn';
import { useUpdateStatus } from '../hooks';
import { useColumns } from '../../columns';

// Смена статуса кликом по бейджу — варианты = колонки доски с учётом правил переходов
export function StatusMenu({ taskId, status, disabled }: { taskId: number; status: string; disabled?: boolean }) {
  const setStatus = useUpdateStatus();
  const { data: columns = [] } = useColumns();
  const source = columns.find((c) => c.key === status);
  // Если у текущей колонки заданы правила — показываем только разрешённые цели
  const targets = source?.allowed_to
    ? columns.filter((c) => c.key === status || source.allowed_to!.includes(c.key))
    : columns;

  if (disabled) return <StatusBadge status={status} />;
  return (
    <Dropdown trigger={
      <button className="inline-flex items-center gap-0.5 hover:opacity-80" title="Сменить статус">
        <StatusBadge status={status} />
        <span className="text-[9px] text-faint">▼</span>
      </button>
    }>
      {targets.filter((c) => c.key !== status).map((c) => (
        <DropdownItem key={c.key} onClick={() => setStatus.mutate({ id: taskId, status: c.key })}>
          <span className="inline-block h-2 w-2 rounded-full opacity-80" style={{ backgroundColor: c.color }} />
          {c.name}
        </DropdownItem>
      ))}
      {targets.length <= 1 && (
        <DropdownItem onClick={() => {}}>
          <span className={cn('text-faint')}>Нет доступных переходов</span>
        </DropdownItem>
      )}
    </Dropdown>
  );
}
