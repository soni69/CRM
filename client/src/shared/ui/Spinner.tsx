import { cn } from '../utils/cn';

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn('animate-spin text-muted', className)} width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function PageSpinner() {
  return <div className="flex h-full min-h-40 items-center justify-center"><Spinner /></div>;
}
