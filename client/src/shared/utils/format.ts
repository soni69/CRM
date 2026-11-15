export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso.length === 10 ? iso + 'T00:00:00' : iso);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) + ', ' +
    d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export function formatMinutes(min: number): string {
  if (min < 60) return `${min}м`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h}ч ${m}м` : `${h}ч`;
}

export function isOverdue(due: string | null, status: string): boolean {
  if (!due || status === 'done') return false;
  return due < new Date().toISOString().slice(0, 10);
}

export function initials(name: string): string {
  return name.split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

// Детерминированный цвет аватара по id пользователя
const AVATAR_COLORS = ['#5e6ad2', '#4cb782', '#f2c94c', '#e06b6b', '#26b5ce', '#eb5757', '#bb6bd9', '#f2994a'];
export function avatarColor(id: number): string {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}
