import { forwardRef } from 'react'

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-2">
        <label
          htmlFor={inputId}
          className="font-mono text-label uppercase tracking-[0.28em] text-sage"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={[
            'w-full bg-transparent border-0 border-b pb-2 pt-1',
            'font-sans text-sm font-light text-navy-dark',
            'placeholder:text-sand',
            'outline-none transition-colors duration-200',
            error
              ? 'border-b-red-400'
              : 'border-b-sand-light focus:border-b-navy',
          ].join(' ')}
          {...props}
        />
        {error && (
          <p className="font-mono text-label tracking-[0.15em] text-red-500 uppercase">
            {error}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
