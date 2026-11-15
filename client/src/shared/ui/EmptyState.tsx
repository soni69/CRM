import type { ReactNode } from 'react';

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-faint">
        <rect x="6" y="8" width="28" height="26" rx="4" stroke="currentColor" strokeWidth="2"/>
        <path d="M13 17h14M13 23h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <p className="font-medium text-muted">{title}</p>
      {hint && <p className="text-xs text-faint">{hint}</p>}
      {action}
    </div>
  );
}
