import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../modules/auth';
import { Avatar, Dropdown, DropdownItem, PageSpinner } from '../shared/ui';
import { useTheme } from '../shared/hooks';
import { Logo } from './Logo';
import { cn } from '../shared/utils/cn';
import { ROLE_LABELS } from '@crm/contracts';

const NAV = [
  { to: '/', label: 'Канбан', end: true },
  { to: '/gantt', label: 'Гант' },
  { to: '/sprints', label: 'Спринты' },
  { to: '/reports', label: 'Отчёты' },
  { to: '/projects', label: 'Проекты' },
  { to: '/contacts', label: 'Команда' },
];

export function Layout() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const nav = useNavigate();
  if (!user) return <PageSpinner />;

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-13 shrink-0 items-center gap-4 border-b border-border bg-raised px-4">
        <NavLink to="/"><Logo size={22} /></NavLink>
        <nav className="hidden items-center gap-0.5 sm:flex">
          {NAV.map((n) => (
            <NavLink
              key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                isActive ? 'bg-hover text-text' : 'text-muted hover:text-text',
              )}
            >
              {n.label}
            </NavLink>
          ))}
          {user.role === 'admin' && (
            <NavLink to="/users" className={({ isActive }) => cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              isActive ? 'bg-hover text-text' : 'text-muted hover:text-text',
            )}>Пользователи</NavLink>
          )}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={toggle} className="rounded-lg p-2 text-muted hover:bg-hover hover:text-text" title="Тема">
            {dark ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.4"/><path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M12.6 3.4l-1.1 1.1M4.5 11.5l-1.1 1.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>
            )}
          </button>
          <Dropdown
            align="right"
            trigger={
              <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-hover">
                <Avatar name={user.name} id={user.id} size={26} />
                <span className="hidden text-sm font-medium sm:block">{user.name}</span>
              </button>
            }
          >
            <div className="px-2.5 py-1.5 text-xs text-faint">{ROLE_LABELS[user.role]} · {user.email}</div>
            <DropdownItem danger onClick={() => { logout(); nav('/login'); }}>Выйти</DropdownItem>
          </Dropdown>
        </div>
      </header>
      <main className="min-h-0 flex-1"><Outlet /></main>
      {/* Мобильная навигация */}
      <nav className="flex shrink-0 items-center justify-around border-t border-border bg-raised py-1 sm:hidden">
        {[...NAV, ...(user.role === 'admin' ? [{ to: '/users', label: 'Люди' }] : [])].map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end === undefined ? false : n.end}
            className={({ isActive }) => cn('rounded-lg px-3 py-1.5 text-xs font-medium', isActive ? 'text-accent' : 'text-muted')}>
            {n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
