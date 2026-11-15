import { useEffect, useState } from 'react';
import { Input } from '../../../shared/ui';
import { useDebounce } from '../../../shared/hooks';

export function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [local, setLocal] = useState(value);
  const deb = useDebounce(local, 300);
  useEffect(() => { onChange(deb); }, [deb]); // eslint-disable-line
  useEffect(() => { setLocal(value); }, [value]);

  return (
    <div className="relative w-full max-w-sm">
      <svg className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" width="14" height="14" viewBox="0 0 16 16" fill="none">
        <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
        <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
      <Input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder="Поиск по задачам…"
        className="h-8 pl-8"
      />
    </div>
  );
}
