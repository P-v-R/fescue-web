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

// Per-purpose from addresses — all sent from the verified mail.fescuegolfclub.com domain.
export const FROM_ADDRESSES = {
  bookings: 'bookings@mail.fescuegolfclub.com',
  noreply: 'noreply@mail.fescuegolfclub.com',
  hello: 'hello@mail.fescuegolfclub.com',
}
