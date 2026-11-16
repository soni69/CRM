import { cn } from '../utils/cn';

export function Tabs<T extends string>({ tabs, value, onChange }: {
  tabs: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'relative shrink-0 whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors',
            value === t.id ? 'text-text' : 'text-muted hover:text-text',
          )}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 text-xs text-faint">{t.count}</span>}
          {value === t.id && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-accent" />}
        </button>
      ))}
    </div>
  );
}
