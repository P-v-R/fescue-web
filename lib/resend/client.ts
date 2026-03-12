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

export const FROM_ADDRESS = 'Fescue Golf Club <invites@fescuegolf.com>'
