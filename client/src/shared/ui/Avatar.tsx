import { cn } from '../utils/cn';
import { initials, avatarColor } from '../utils/format';

export function Avatar({ name, id, size = 24, className }: { name: string; id: number; size?: number; className?: string }) {
  return (
    <span
      title={name}
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white select-none', className)}
      style={{ width: size, height: size, fontSize: size * 0.42, background: avatarColor(id) }}
    >
      {initials(name)}
    </span>
  );
}
