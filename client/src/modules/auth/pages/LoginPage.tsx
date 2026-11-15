import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api';
import { Button, Field, Input } from '../../../shared/ui';
import { ApiError } from '../../../shared/api/client';
import { AuthLayout } from './AuthLayout';

export function LoginPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const login = useMutation({
    mutationFn: () => authApi.login({ email, password }),
    onSuccess: (d) => { qc.setQueryData(['me'], d.user); nav('/'); },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Ошибка входа'),
  });

  const submit = (e: FormEvent) => { e.preventDefault(); setError(''); login.mutate(); };

  return (
    <AuthLayout
      title="С возвращением"
      subtitle="Войдите, чтобы продолжить работу с задачами"
    >
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        <Field label="Email"><Input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.ru" /></Field>
        <Field label="Пароль"><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" /></Field>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={login.isPending}>{login.isPending ? 'Вход…' : 'Войти'}</Button>
      </form>
    </AuthLayout>
  );
}
