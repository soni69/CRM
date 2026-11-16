import { useNavigate } from 'react-router-dom';
import { Dropdown } from '../../../shared/ui';
import { useNotifications, useNotificationMutations } from '../hooks';
import { formatDate } from '../../../shared/utils/format';
import { cn } from '../../../shared/utils/cn';

const TYPE_ICON: Record<string, string> = {
  overdue: 'text-danger',
  due_soon: 'text-warning',
  assigned: 'text-accent',
};

// Колокольчик в сайдбаре: бейдж непрочитанных + выпадающий список
export function NotificationBell({ collapsed }: { collapsed: boolean }) {
  const { data } = useNotifications();
  const mut = useNotificationMutations();
  const nav = useNavigate();
  const unread = data?.unread ?? 0;
  const items = data?.notifications ?? [];

  return (
    <Dropdown
      align="left"
      up
      className="w-full"
      trigger={
        <button
          className={cn('relative flex w-full items-center rounded-lg py-2 text-sm font-medium text-muted transition-colors hover:bg-hover hover:text-text', collapsed ? 'justify-center px-0' : 'gap-2.5 px-2.5')}
          title="Уведомления"
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2a4.2 4.2 0 0 0-4.2 4.2c0 3.1-1.3 4.3-1.3 4.3h11S12.2 9.3 12.2 6.2A4.2 4.2 0 0 0 8 2Z"/>
            <path d="M6.6 13a1.5 1.5 0 0 0 2.8 0"/>
          </svg>
          {!collapsed && 'Уведомления'}
          {unread > 0 && (
            <span className={cn('flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white', collapsed ? 'absolute -right-0.5 -top-0.5' : 'ml-auto')}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      }
    >
      <div className="max-h-80 w-72 overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-xs font-semibold">Уведомления</span>
          {unread > 0 && (
            <button onClick={() => mut.readAll.mutate()} className="text-[11px] text-accent hover:underline">
              Прочитать все
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-faint">Пока пусто</p>
        ) : (
          items.slice(0, 20).map((n) => (
            <button
              key={n.id}
              onClick={() => {
                mut.read.mutate(n.id);
                if (n.task_id) nav(`/tasks/${n.task_id}`);
              }}
              className={cn('flex w-full flex-col gap-0.5 border-b border-border/50 px-3 py-2.5 text-left last:border-0 hover:bg-hover', !n.read && 'bg-accent-soft/40')}
            >
              <span className="flex items-center gap-1.5 text-xs font-medium">
                <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full bg-current', TYPE_ICON[n.type] ?? 'text-faint')} />
                {n.title}
              </span>
              {n.body && <span className="line-clamp-2 text-[11px] text-muted">{n.body}</span>}
              <span className="text-[10px] text-faint">{formatDate(n.created_at.slice(0, 10))}</span>
            </button>
          ))
        )}
      </div>
    </Dropdown>
  );
}
