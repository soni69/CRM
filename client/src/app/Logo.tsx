export function Logo({ size = 24 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2 font-semibold tracking-tight" style={{ fontSize: size * 0.62 }}>
      <svg width={size} height={size} viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="var(--accent)"/><path d="M9 17.5l4.5 4.5L23 11.5" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
      TeamManager
    </span>
  );
}
