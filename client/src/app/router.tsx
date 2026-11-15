import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { PageSpinner } from '../shared/ui';
import { useAuth, LoginPage, RegisterPage } from '../modules/auth';
import { BoardPage } from '../modules/tasks';
import { GanttPage } from '../modules/gantt';
import { SprintsPage, SprintBoardPage } from '../modules/sprints';
import { ReportsPage } from '../modules/reports';
import { UsersPage } from '../modules/users';
import { Layout } from './layout';

function Protected() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="flex h-full items-center justify-center"><PageSpinner /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function GuestOnly() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <PageSpinner />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    element: <GuestOnly />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <Protected />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: '/', element: <BoardPage /> },
          { path: '/gantt', element: <GanttPage /> },
          { path: '/sprints', element: <SprintsPage /> },
          { path: '/sprints/:id', element: <SprintBoardPage /> },
          { path: '/reports', element: <ReportsPage /> },
          { path: '/users', element: <UsersPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
