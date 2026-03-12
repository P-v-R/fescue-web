type Variant = 'primary' | 'ghost' | 'gold'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  loading?: boolean
}

const styles: Record<Variant, string> = {
  primary: [
    'bg-navy text-cream',
    'shadow-[inset_0_0_0_1px_rgba(184,150,60,0.25)]',
    'hover:bg-navy-mid',
  ].join(' '),
  ghost: 'border border-navy text-navy hover:bg-navy hover:text-cream',
  gold: 'border border-gold text-gold hover:bg-gold hover:text-navy-dark',
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={[
        'font-mono text-label uppercase tracking-[0.22em]',
        'px-7 py-3.5 transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        styles[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? 'Please wait…' : children}
    </button>
  )
}
