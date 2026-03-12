import { AuthCard } from '@/components/ui/auth-card'
import { LoginForm } from './login-form'

export const metadata = {
  title: 'Sign In — Fescue Golf Club',
}

export default function LoginPage() {
  return (
    <AuthCard
      title="Sign in to your account"
      subtitle="Members only. Need access? Request an invitation."
    >
      <LoginForm />
    </AuthCard>
  )
}
