'use client';

import { useState } from 'react';

// ─── Tooltip ──────────────────────────────────────────────────────────────────
export function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <span className='relative group/tip inline-flex'>
      {children}
      <span className='pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max max-w-[240px] text-center bg-navy text-cream font-sans text-xs px-3 py-2 opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-50 leading-snug shadow-lg'>
        <span className='absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-navy' />
        {text}
      </span>
    </span>
  );
}

// ─── Help badge ───────────────────────────────────────────────────────────────
export function HelpBadge({ text }: { text: string }) {
  return (
    <Tooltip text={text}>
      <span className='inline-flex items-center justify-center w-4 h-4 rounded-full bg-sand/60 text-navy/50 font-mono text-[9px] cursor-help select-none hover:bg-gold/30 hover:text-navy transition-colors shrink-0'>
        ?
      </span>
    </Tooltip>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
export function AdminSection({
  icon,
  title,
  help,
  children,
  className = '',
}: {
  icon: string;
  title: string;
  help?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`bg-white border border-cream-mid ${className}`}>
      <div className='flex items-center gap-3 px-5 py-4 border-b border-cream-mid bg-cream/40'>
        <span className='text-lg leading-none select-none'>{icon}</span>
        <h2 className='font-serif text-base font-light text-navy'>{title}</h2>
        {help && <HelpBadge text={help} />}
      </div>
      <div className='p-5'>{children}</div>
    </section>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
export function StatCard({ value, label, sublabel }: { value: number | string; label: string; sublabel?: string }) {
  return (
    <div className='bg-white border border-cream-mid px-5 py-4 flex flex-col gap-0.5'>
      <span className='font-serif text-3xl font-light text-navy leading-none'>{value}</span>
      <span className='font-mono text-xs uppercase tracking-[0.18em] text-navy/60'>{label}</span>
      {sublabel && <span className='font-mono text-[10px] text-navy/30 tracking-wide'>{sublabel}</span>}
    </div>
  );
}

// ─── Status message ───────────────────────────────────────────────────────────
export function StatusMessage({ message }: { message: { text: string; isError: boolean } | null }) {
  if (!message) return null;
  return (
    <div className={[
      'flex items-start gap-3 px-4 py-3 border font-sans text-sm',
      message.isError
        ? 'bg-red-50 text-red-700 border-red-200'
        : 'bg-sage/10 text-sage-dark border-sage/30',
    ].join(' ')}>
      <span className='shrink-0'>{message.isError ? '⚠' : '✓'}</span>
      <span>{message.text}</span>
    </div>
  );
}

// ─── Inline confirm wrapper ───────────────────────────────────────────────────
export function ConfirmButton({
  onConfirm,
  disabled,
  label,
  confirmLabel,
  confirmMessage,
  variant = 'danger',
}: {
  onConfirm: () => void;
  disabled?: boolean;
  label: string;
  confirmLabel?: string;
  confirmMessage: string;
  variant?: 'danger' | 'primary';
}) {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <div className={[
        'flex items-center gap-3 px-3 py-2 border text-xs',
        variant === 'danger' ? 'bg-red-50 border-red-200' : 'bg-navy/5 border-navy/20',
      ].join(' ')}>
        <span className='font-sans text-xs text-navy/60 shrink-0'>{confirmMessage}</span>
        <button
          onClick={() => { onConfirm(); setOpen(false); }}
          disabled={disabled}
          className={[
            'font-mono text-[10px] uppercase tracking-[0.15em] px-3 py-1.5 transition-colors disabled:opacity-40 whitespace-nowrap',
            variant === 'danger'
              ? 'text-white bg-red-500 hover:bg-red-600'
              : 'text-cream bg-navy hover:bg-navy-mid',
          ].join(' ')}
        >
          {confirmLabel ?? 'Confirm'}
        </button>
        <button
          onClick={() => setOpen(false)}
          className='font-mono text-[10px] uppercase tracking-[0.15em] text-navy/40 hover:text-navy px-2 transition-colors'
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setOpen(true)}
      disabled={disabled}
      className={[
        'font-mono text-[10px] uppercase tracking-[0.15em] px-3 py-1.5 border transition-colors disabled:opacity-40',
        variant === 'danger'
          ? 'text-red-500 border-red-100 hover:bg-red-50'
          : 'text-navy border-navy/20 hover:bg-navy hover:text-cream',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

// ─── Field label ──────────────────────────────────────────────────────────────
export function FieldLabel({ children, required, help }: {
  children: React.ReactNode;
  required?: boolean;
  help?: string;
}) {
  return (
    <div className='flex items-center gap-1.5 mb-1.5'>
      <label className='font-mono text-[10px] uppercase tracking-[0.18em] text-navy/50'>
        {children}
        {required && <span className='text-gold ml-0.5'>*</span>}
      </label>
      {help && <HelpBadge text={help} />}
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
export const inputCls = 'w-full border border-cream-mid bg-white px-3 py-2 font-sans text-sm text-navy placeholder:text-navy/25 focus:outline-none focus:border-navy transition-colors';
export const selectCls = 'border border-cream-mid bg-white px-3 py-2 font-sans text-sm text-navy focus:outline-none focus:border-navy transition-colors';

// ─── Empty state ──────────────────────────────────────────────────────────────
export function AdminEmpty({ text, subtext }: { text: string; subtext?: string }) {
  return (
    <div className='py-10 text-center border border-dashed border-cream-mid'>
      <p className='font-serif italic text-navy/30 text-sm'>{text}</p>
      {subtext && <p className='font-mono text-[10px] text-navy/20 tracking-wide mt-1'>{subtext}</p>}
    </div>
  );
}

// ─── Status pill ──────────────────────────────────────────────────────────────
export function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'text-gold bg-gold/10',
    contacted: 'text-navy bg-navy/10',
    invited: 'text-sage bg-sage/10',
    approved: 'text-sage bg-sage/10',
    onboarded: 'text-sage bg-sage/10',
    declined: 'text-navy/40 bg-cream-mid',
    active: 'text-sage bg-sage/10',
    inactive: 'text-red-400 bg-red-50',
  };
  return (
    <span className={`font-mono text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 ${styles[status] ?? 'text-navy/40 bg-cream-mid'}`}>
      {status}
    </span>
  );
}
