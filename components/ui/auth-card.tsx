import Image from 'next/image'
import type { ReactNode } from 'react'

// Shared card shell for all auth pages (login, forgot-password, invite)
export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="relative bg-cream p-10 sm:p-12">
      {/* Corner ticks */}
      <span className="absolute top-0 left-0 w-4 h-4 border-t border-l border-gold/40" />
      <span className="absolute top-0 right-0 w-4 h-4 border-t border-r border-gold/40" />
      <span className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-gold/40" />
      <span className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-gold/40" />

      {/* Club identity */}
      <div className="flex flex-col items-center mb-10">
        <Image
          src="/logo-badge.png"
          alt="Fescue Golf Club"
          width={110}
          height={110}
          className="object-contain mix-blend-multiply"
          priority
        />
      </div>

      {/* Page title */}
      <div className="mb-8">
        <h1 className="font-serif text-title font-light text-navy leading-snug">{title}</h1>
        {subtitle && (
          <p className="font-sans text-sm font-light text-sand mt-1">{subtitle}</p>
        )}
      </div>

      {children}
    </div>
  )
}
