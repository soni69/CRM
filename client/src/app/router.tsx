import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { PageSpinner } from '../shared/ui';
import { useAuth, LoginPage } from '../modules/auth';
import { BoardPage, TaskPage, NewTaskPage } from '../modules/tasks';
import { GanttPage } from '../modules/gantt';
import { SprintsPage, SprintBoardPage } from '../modules/sprints';
import { ReportsPage } from '../modules/reports';
import { UsersPage, ContactsPage } from '../modules/users';
import { ProjectsPage, ProjectPage } from '../modules/projects';
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
    ],
  },
  {
    element: <Protected />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: '/', element: <BoardPage /> },
          { path: '/tasks/new', element: <NewTaskPage /> },
          { path: '/tasks/:id', element: <TaskPage /> },
          { path: '/gantt', element: <GanttPage /> },
          { path: '/sprints', element: <SprintsPage /> },
          { path: '/sprints/:id', element: <SprintBoardPage /> },
          { path: '/reports', element: <ReportsPage /> },
          { path: '/users', element: <UsersPage /> },
          { path: '/contacts', element: <ContactsPage /> },
          { path: '/projects', element: <ProjectsPage /> },
          { path: '/projects/:id', element: <ProjectPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
