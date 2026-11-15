import { useEffect, useRef, useState } from 'react';
import { cn } from '../utils/cn';
import { formatDate } from '../utils/format';

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const WD = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const pad = (n: number) => String(n).padStart(2, '0');
const dstr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Календарь-поповер; time=true добавляет поле «до ЧЧ:ММ» внутри
export function DatePicker({ value, onChange, placeholder = 'Дата…', disabled, time, timeValue, onTimeChange, className }: {
  value: string | null | undefined;
  onChange: (d: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  time?: boolean;
  timeValue?: string | null;
  onTimeChange?: (t: string | null) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [view, setView] = useState(() => (value ? new Date(value + 'T00:00:00') : new Date()));
  const today = dstr(new Date());

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const toggle = () => {
    if (disabled) return;
    if (!open && value) setView(new Date(value + 'T00:00:00'));
    setOpen((o) => !o);
  };

  const y = view.getFullYear(), m = view.getMonth();
  const firstWeekday = (new Date(y, m, 1).getDay() + 6) % 7; // Пн = 0
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => dstr(new Date(y, m, i + 1))),
  ];
  const shiftMonth = (d: number) => setView(new Date(y, m + d, 1));

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        className={cn(
          'flex h-9 w-full items-center gap-2 rounded-lg border border-border bg-raised px-3 text-left text-sm transition-colors',
          disabled ? 'cursor-default opacity-70' : 'hover:border-border-strong focus:border-accent focus:outline-1 focus:outline-accent',
        )}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-faint">
          <rect x="1.5" y="2.5" width="11" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M1.5 5.5h11M4.5 1.5v2M9.5 1.5v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        <span className={cn('min-w-0 flex-1 truncate', !value && 'text-faint')}>
          {value ? `${formatDate(value)}${time && timeValue ? `, ${timeValue}` : ''}` : placeholder}
        </span>
      </button>

      {open && (
        <div className="anim-pop absolute top-full z-40 mt-1 w-64 rounded-lg border border-border bg-raised p-2.5 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={() => shiftMonth(-1)} className="rounded-md p-1 text-muted hover:bg-hover hover:text-text" aria-label="Предыдущий месяц">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <span className="text-xs font-semibold">{MONTHS[m]} {y}</span>
            <button type="button" onClick={() => shiftMonth(1)} className="rounded-md p-1 text-muted hover:bg-hover hover:text-text" aria-label="Следующий месяц">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
          <div className="mb-1 grid grid-cols-7">
            {WD.map((d) => <span key={d} className="py-0.5 text-center text-[10px] font-medium text-faint">{d}</span>)}
            {cells.map((d, i) => d === null ? <span key={`e${i}`} /> : (
              <button
                key={d} type="button"
                onClick={() => { onChange(d); if (!time) setOpen(false); }}
                className={cn(
                  'mx-auto flex h-7 w-7 items-center justify-center rounded-md text-xs transition-colors hover:bg-hover',
                  d === value && 'bg-accent text-white hover:bg-accent',
                  d === today && d !== value && 'ring-1 ring-accent',
                )}
              >
                {Number(d.slice(8, 10))}
              </button>
            ))}
          </div>
          {time && (
            <div className="mt-1 flex items-center gap-2 border-t border-border pt-2">
              <span className="text-xs text-muted">до</span>
              <input
                type="time"
                value={timeValue ?? ''}
                onChange={(e) => onTimeChange?.(e.target.value || null)}
                className="h-7 flex-1 rounded-md border border-border bg-surface px-2 text-xs text-text focus:border-accent focus:outline-1 focus:outline-accent"
              />
            </div>
          )}
          <div className="mt-2 flex justify-between border-t border-border pt-2">
            <button type="button" onClick={() => { onChange(today); if (!time) setOpen(false); }} className="text-xs text-accent hover:underline">Сегодня</button>
            {(value || (time && timeValue)) && (
              <button type="button" onClick={() => { onChange(null); onTimeChange?.(null); setOpen(false); }} className="text-xs text-faint hover:text-text">Очистить</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
