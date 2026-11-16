import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '../utils/cn';

// Простое выпадающее меню: Dropdown (trigger) + Item[].
export function Dropdown({ trigger, children, align = 'left', className }: {
  trigger: ReactNode; children: ReactNode; align?: 'left' | 'right'; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return (
    <div ref={ref} className={cn('relative inline-block', className)}>
      <div onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}>{trigger}</div>
      {open && (
        <div
          className={cn('anim-pop absolute top-full z-40 mt-1 min-w-40 rounded-lg border border-border bg-raised p-1 shadow-xl', align === 'right' ? 'right-0' : 'left-0')}
          onClick={(e) => { e.stopPropagation(); setOpen(false); }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({ children, onClick, danger, className }: {
  children: ReactNode; onClick?: () => void; danger?: boolean; className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-hover',
        danger ? 'text-danger' : 'text-text', className,
      )}
    >
      {children}
    </button>
  );
}
