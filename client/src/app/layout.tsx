import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../modules/auth';
import { Avatar, Dropdown, DropdownItem, PageSpinner } from '../shared/ui';
import { useTheme } from '../shared/hooks';
import { Logo } from './Logo';
import { cn } from '../shared/utils/cn';
import { ROLE_LABELS } from '@crm/contracts';

const I = ({ children }: { children: React.ReactNode }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const icons = {
  kanban: <I><rect x="1.5" y="2.5" width="3.6" height="11" rx="1"/><rect x="6.2" y="2.5" width="3.6" height="7.5" rx="1"/><rect x="10.9" y="2.5" width="3.6" height="9" rx="1"/></I>,
  gantt: <I><path d="M2 4h6M5 8h9M2 12h8"/><path d="M2 4h.01"/></I>,
  sprint: <I><path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9"/><path d="M13.7 1.8v2.6h-2.6"/></I>,
  project: <I><path d="M1.8 4.2v7.6a1.4 1.4 0 0 0 1.4 1.4h9.6a1.4 1.4 0 0 0 1.4-1.4V6a1.4 1.4 0 0 0-1.4-1.4H8.4L6.8 3a1.4 1.4 0 0 0-1-.4H3.2a1.4 1.4 0 0 0-1.4 1.4Z"/></I>,
  report: <I><path d="M3 13.5h10"/><path d="M4.5 10V7M8 10V4.5M11.5 10v-3"/></I>,
  team: <I><circle cx="5.5" cy="5.5" r="2.2"/><path d="M1.8 13.4c.6-2 2-3 3.7-3s3.1 1 3.7 3"/><circle cx="11" cy="6" r="1.8"/><path d="M11.4 10.6c1.6.1 2.6 1 3 2.6"/></I>,
  users: <I><circle cx="8" cy="5.5" r="2.5"/><path d="M3.5 13.6c.7-2.4 2.4-3.6 4.5-3.6s3.8 1.2 4.5 3.6"/></I>,
};

const NAV = [
  { to: '/', label: 'Канбан', end: true, icon: icons.kanban },
  { to: '/gantt', label: 'Гант', icon: icons.gantt },
  { to: '/sprints', label: 'Спринты', icon: icons.sprint },
  { to: '/projects', label: 'Проекты', icon: icons.project },
  { to: '/reports', label: 'Отчёты', icon: icons.report },
  { to: '/contacts', label: 'Команда', icon: icons.team },
];

function ThemeButton({ collapsed }: { collapsed: boolean }) {
  const { dark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className={cn('flex w-full items-center rounded-lg py-2 text-sm font-medium text-muted transition-colors hover:bg-hover hover:text-text', collapsed ? 'justify-center px-0' : 'gap-2.5 px-2.5')}
      title={dark ? 'Светлая тема' : 'Тёмная тема'}
    >
      {dark ? (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.4"/><path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M12.6 3.4l-1.1 1.1M4.5 11.5l-1.1 1.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>
      )}
      {!collapsed && (dark ? 'Светлая тема' : 'Тёмная тема')}
    </button>
  );
}

export function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('nav-collapsed') === '1');
  if (!user) return <PageSpinner />;

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      localStorage.setItem('nav-collapsed', c ? '0' : '1');
      return !c;
    });
  };

  const items = [...NAV, ...(user.role === 'admin' ? [{ to: '/users', label: 'Пользователи', icon: icons.users }] : [])];

  return (
    <div className="flex h-full">
      {/* Левый сайдбар */}
      <aside className={cn('hidden shrink-0 flex-col border-r border-border bg-raised transition-[width] duration-200 sm:flex', collapsed ? 'w-14' : 'w-56')}>
        <div className={cn('flex items-center pb-2 pt-4', collapsed ? 'justify-center px-0' : 'justify-between px-4')}>
          <NavLink to="/" title="TeamTasks">
            {collapsed ? (
              <svg width="22" height="22" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="var(--accent)"/><path d="M9 17.5l4.5 4.5L23 11.5" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            ) : <Logo size={22} />}
          </NavLink>
          {!collapsed && (
            <button onClick={toggleCollapsed} className="rounded-md p-1.5 text-faint transition-colors hover:bg-hover hover:text-text" title="Скрыть меню">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3L5 8l5 5"/><path d="M3 3v10"/></svg>
            </button>
          )}
        </div>
        {collapsed && (
          <button onClick={toggleCollapsed} className="mx-auto mb-1 rounded-md p-1.5 text-faint transition-colors hover:bg-hover hover:text-text" title="Показать меню">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3l5 5-5 5"/><path d="M13 3v10"/></svg>
          </button>
        )}
        <nav className={cn('mt-1 flex flex-1 flex-col gap-0.5', collapsed ? 'px-2' : 'px-2.5')}>
          {items.map((n) => (
            <NavLink
              key={n.to} to={n.to} end={n.end}
              title={collapsed ? n.label : undefined}
              className={({ isActive }) => cn(
                'flex items-center rounded-lg py-2 text-sm font-medium transition-colors',
                collapsed ? 'justify-center px-0' : 'gap-2.5 px-2.5',
                isActive ? 'bg-accent-soft text-accent-hover' : 'text-muted hover:bg-hover hover:text-text',
              )}
            >
              <span className="shrink-0">{n.icon}</span>
              {!collapsed && n.label}
            </NavLink>
          ))}
        </nav>
        <div className={cn('flex flex-col gap-0.5 border-t border-border', collapsed ? 'p-2' : 'p-2.5')}>
          <ThemeButton collapsed={collapsed} />
          <Dropdown
            align="left"
            trigger={
              <button className={cn('flex w-full items-center rounded-lg py-2 text-left transition-colors hover:bg-hover', collapsed ? 'justify-center px-0' : 'gap-2.5 px-2.5')} title={collapsed ? user.name : undefined}>
                <Avatar name={user.name} id={user.id} size={24} />
                {!collapsed && (
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium leading-tight">{user.name}</span>
                    <span className="block truncate text-[11px] text-faint">{ROLE_LABELS[user.role]}</span>
                  </span>
                )}
              </button>
            }
          >
            <div className="px-2.5 py-1.5 text-xs text-faint">{user.email}</div>
            <DropdownItem danger onClick={() => { logout(); nav('/login'); }}>Выйти</DropdownItem>
          </Dropdown>
        </div>
      </aside>

      {/* Контент */}
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="min-h-0 flex-1"><Outlet /></main>
        {/* Мобильная навигация */}
        <nav className="flex shrink-0 items-center justify-around border-t border-border bg-raised py-1 sm:hidden">
          {items.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end === undefined ? false : n.end}
              className={({ isActive }) => cn('flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[10px] font-medium', isActive ? 'text-accent' : 'text-muted')}>
              <span>{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
