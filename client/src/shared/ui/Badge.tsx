import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

const tones = {
  gray: 'bg-hover text-muted',
  accent: 'bg-accent-soft text-accent',
  green: 'bg-success/15 text-success',
  amber: 'bg-warning/20 text-warning',
  red: 'bg-danger-soft text-danger',
  blue: 'bg-[#26b5ce]/15 text-[#26b5ce]',
} as const;

export function Badge({ tone = 'gray', children, className }: { tone?: keyof typeof tones; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-4', tones[tone], className)}>
      {children}
    </span>
  );
}
