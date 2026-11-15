import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api';
import { Button, Field, Input } from '../../../shared/ui';
import { ApiError } from '../../../shared/api/client';
import { AuthLayout } from './AuthLayout';

export function RegisterPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const reg = useMutation({
    mutationFn: () => authApi.register({ name, email, password }),
    onSuccess: (d) => { qc.setQueryData(['me'], d.user); nav('/'); },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Ошибка регистрации'),
  });

  const submit = (e: FormEvent) => { e.preventDefault(); setError(''); reg.mutate(); };

  return (
    <AuthLayout
      title="Создать аккаунт"
      subtitle="Зарегистрируйтесь, чтобы работать с задачами команды"
      footer={<>Уже есть аккаунт? <Link to="/login" className="text-accent hover:underline">Войти</Link></>}
    >
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        <Field label="Имя"><Input required autoFocus minLength={2} value={name} onChange={(e) => setName(e.target.value)} placeholder="Иван Петров" /></Field>
        <Field label="Email"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.ru" /></Field>
        <Field label="Пароль"><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Минимум 6 символов" /></Field>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={reg.isPending}>{reg.isPending ? 'Создание…' : 'Зарегистрироваться'}</Button>
      </form>
    </AuthLayout>
  );
}
