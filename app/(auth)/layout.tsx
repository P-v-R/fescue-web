import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-navy-dark flex items-center justify-center px-4 py-8 sm:py-16 overflow-hidden">
      {/* Heraldic outer frame */}
      <div className="absolute inset-8 border border-[rgba(184,150,60,0.12)] pointer-events-none hidden lg:block" />

      {/* Quail illustration — decorative, bottom-right on large screens */}
      <div className="absolute bottom-0 right-0 hidden lg:block pointer-events-none select-none opacity-20">
        <Image
          src="/logo-quail.png"
          alt=""
          width={340}
          height={400}
          className="object-contain"
          priority
        />
      </div>

      <div className="w-full max-w-md relative z-10">{children}</div>
    </div>
  )
}
