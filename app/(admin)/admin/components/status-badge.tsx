export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'text-gold',
    contacted: 'text-gold/70 italic',
    invited: 'text-sage',
    declined: 'text-navy/40 line-through',
    onboarded: 'text-sage/60 italic',
  };
  return (
    <span
      className={`font-mono text-label uppercase tracking-[0.15em] ${styles[status] ?? ''}`}
    >
      {status}
    </span>
  );
}
