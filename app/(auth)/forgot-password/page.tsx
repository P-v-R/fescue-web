import { AuthCard } from '@/components/ui/auth-card'
import { ForgotPasswordForm } from './forgot-password-form'

export const metadata = {
  title: 'Reset Password — Fescue Golf Club',
}

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      subtitle="We'll send a reset link to your registered email address."
    >
      <ForgotPasswordForm />
    </AuthCard>
  )
}
