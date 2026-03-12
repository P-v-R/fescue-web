import { Resend } from 'resend'

export function createResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set.')
  }
  return new Resend(apiKey)
}

export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY
}

// Use verified domain address in production.
// Resend sandbox address works for testing before domain is verified.
export const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS ?? 'onboarding@resend.dev'
