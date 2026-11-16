import { useState, type FormEvent } from 'react';
import { useAuth } from '../../../modules/auth';
import { useUsers, useUserMutations } from '../hooks';
import type { ListedUser } from '../api';
import { Avatar, Badge, Button, Field, Input, Modal, ModalHeader, PageSpinner, EmptyState } from '../../../shared/ui';
import { ROLE_LABELS, type Role } from '@crm/contracts';
import { ApiError } from '../../../shared/api/client';

const ROLE_TONE: Record<Role, 'red' | 'accent' | 'gray'> = { admin: 'red', lead: 'accent', manager: 'gray' };

// Форма профиля: имя, телефон, телеграм. Свой — каждому, чужой — админу
function ProfileModal({ user, onClose }: { user: ListedUser; onClose: () => void }) {
  const mut = useUserMutations();
  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone ?? '',
    telegram: user.telegram ?? '',
  });
  const [error, setError] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    mut.update.mutate(
      { id: user.id, name: form.name.trim(), phone: form.phone.trim() || null, telegram: form.telegram.trim().replace(/^@/, '') || null },
      {
        onSuccess: onClose,
        onError: (err) => setError(err instanceof ApiError ? err.message : 'Ошибка сохранения'),
      },
    );
  };

  return (
    <Modal open onClose={onClose} className="max-w-md">
      <ModalHeader title={`Профиль: ${user.name}`} onClose={onClose} />
      <form onSubmit={submit} className="flex flex-col gap-3 p-4">
        <Field label="Имя">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={120} />
        </Field>
        <Field label="Телефон">
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+7 900 123-45-67" maxLength={40} />
        </Field>
        <Field label="Telegram">
          <Input value={form.telegram} onChange={(e) => setForm({ ...form, telegram: e.target.value })} placeholder="username (без @)" maxLength={80} />
        </Field>
        {error && <p className="text-xs text-danger">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Отмена</Button>
          <Button type="submit" disabled={mut.update.isPending || !form.name.trim()}>Сохранить</Button>
        </div>
      </form>
    </Modal>
  );
}

export function ContactsPage() {
  const { user: me } = useAuth();
  const { data: users = [], isLoading } = useUsers();
  const [edit, setEdit] = useState<ListedUser | null>(null);
  const isAdmin = me?.role === 'admin';

  if (isLoading) return <PageSpinner />;

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Команда</h1>
        <span className="text-xs text-faint">{users.length} чел.</span>
      </div>

      {users.length === 0 ? (
        <EmptyState title="Пока никого нет" />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u) => {
            const canEdit = isAdmin || u.id === me?.id;
            return (
              <div key={u.id} className="flex flex-col gap-3 rounded-xl border border-border bg-raised p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={u.name} id={u.id} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{u.name}{u.id === me?.id && <span className="ml-1.5 text-xs text-faint">(вы)</span>}</p>
                    <Badge tone={ROLE_TONE[u.role]} className="mt-1">{ROLE_LABELS[u.role]}</Badge>
                  </div>
                  {canEdit && (
                    <button onClick={() => setEdit(u)} className="rounded-md p-1.5 text-faint hover:bg-hover hover:text-text" title="Редактировать профиль">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M11.5 1.5l3 3L5 14H2v-3l9.5-9.5z"/></svg>
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-1 text-xs text-muted">
                  <a href={`mailto:${u.email}`} className="truncate hover:text-accent">{u.email}</a>
                  {u.phone ? (
                    <a href={`tel:${u.phone.replace(/[^\d+]/g, '')}`} className="hover:text-accent">{u.phone}</a>
                  ) : (
                    <span className="text-faint">Телефон не указан</span>
                  )}
                  {u.telegram ? (
                    <a href={`https://t.me/${u.telegram}`} target="_blank" rel="noreferrer" className="hover:text-accent">@{u.telegram}</a>
                  ) : (
                    <span className="text-faint">Telegram не указан</span>
                  )}
                  <span className="text-faint">Открытых задач: {u.open_tasks}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {edit && <ProfileModal user={edit} onClose={() => setEdit(null)} />}
    </div>
  );
}
