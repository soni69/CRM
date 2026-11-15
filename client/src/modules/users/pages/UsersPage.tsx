import { useAuth } from '../../../modules/auth';
import { useUsers, useUserMutations } from '../hooks';
import { Avatar, Badge, Button, ConfirmDialog, PageSpinner, Select, EmptyState, useToast } from '../../../shared/ui';
import { ROLE_LABELS, ROLES, type Role } from '@crm/contracts';
import { formatDate } from '../../../shared/utils/format';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ApiError } from '../../../shared/api/client';

const ROLE_TONE: Record<Role, 'red' | 'accent' | 'gray'> = { admin: 'red', manager: 'accent', member: 'gray' };

export function UsersPage() {
  const { user } = useAuth();
  const { data: users = [], isLoading } = useUsers();
  const mut = useUserMutations();
  const toast = useToast();
  const [confirmId, setConfirmId] = useState<number | null>(null);

  if (user && user.role !== 'admin') return <Navigate to="/" replace />;
  if (isLoading) return <PageSpinner />;

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <h1 className="mb-4 text-lg font-semibold">Пользователи</h1>
      <div className="overflow-hidden rounded-xl border border-border bg-raised">
        {users.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 last:border-0">
            <Avatar name={u.name} id={u.id} size={30} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{u.name} {u.id === user?.id && <span className="text-faint">(вы)</span>}</p>
              <p className="truncate text-xs text-muted">{u.email} · с {formatDate(u.created_at)} · открытых задач: {u.open_tasks}</p>
            </div>
            <Badge tone={ROLE_TONE[u.role]}>{ROLE_LABELS[u.role]}</Badge>
            {u.id !== user?.id && (
              <div className="flex items-center gap-2">
                <Select
                  value={u.role} className="h-7 w-auto text-xs"
                  onChange={(e) => mut.setRole.mutate({ id: u.id, role: e.target.value as Role }, {
                    onError: (err) => toast(err instanceof ApiError ? err.message : 'Ошибка', 'err'),
                  })}
                >
                  {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </Select>
                <Button variant="ghost" size="sm" onClick={() => setConfirmId(u.id)} className="text-danger">Удалить</Button>
              </div>
            )}
          </div>
        ))}
        {!users.length && <EmptyState title="Нет пользователей" />}
      </div>
      <ConfirmDialog
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId && mut.remove.mutate(confirmId)}
        title="Удалить пользователя?"
        body="Его задачи останутся, но перестанут быть назначенными. Действие необратимо."
      />
    </div>
  );
}
