import type { ReactNode } from 'react';
import { Logo } from '../../../app/Logo';

export function AuthLayout({ title, subtitle, children, footer }: {
  title: string; subtitle: string; children: ReactNode; footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-full items-center justify-center bg-surface p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center"><Logo size={36} /></div>
        <h1 className="text-center text-xl font-semibold">{title}</h1>
        <p className="mt-1 text-center text-sm text-muted">{subtitle}</p>
        <div className="mt-6 rounded-xl border border-border bg-raised p-5 shadow-sm">{children}</div>
        {footer && <p className="mt-4 text-center text-sm text-muted">{footer}</p>}
      </div>
    </div>
  );
}
