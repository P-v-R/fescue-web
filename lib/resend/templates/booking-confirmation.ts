import { emailShell } from './shared'

type BookingConfirmationData = {
  memberName: string
  bayName: string
  startTime: Date
  durationMinutes: number
  guests: { name: string; email: string }[]
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  })
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/New_York',
  })
}

export function bookingConfirmationHtml({
  memberName,
  bayName,
  startTime,
  durationMinutes,
  guests,
}: BookingConfirmationData): string {
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000)
  const firstName = memberName.split(' ')[0] ?? memberName
  const guestsHtml =
    guests.length > 0
      ? `<p style="margin:0 0 20px;font-family:Georgia,serif;font-size:15px;color:#2a2a2a;line-height:1.7;font-weight:300;">
           <strong style="color:#004225;">Guests:</strong> ${guests.map((g) => g.name).join(', ')}
         </p>`
      : ''

  return emailShell(`
    <tr>
      <td style="padding:48px 40px;">

        <p style="margin:0 0 8px;font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.28em;color:#B8963C;text-transform:uppercase;">
          Booking Confirmed
        </p>
        <p style="margin:0 0 12px;font-family:Georgia,serif;font-size:16px;font-weight:300;color:#004225;">
          Hey ${firstName},
        </p>
        <h1 style="margin:0 0 24px;font-family:Georgia,serif;font-size:28px;font-weight:300;color:#004225;line-height:1.3;">
          You're booked.
        </h1>

        <div style="width:48px;height:1px;background-color:#B8963C;margin:0 0 28px;"></div>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 28px;border:1px solid #E8E1D6;">
          <tr>
            <td style="padding:16px 20px;border-bottom:1px solid #E8E1D6;">
              <p style="margin:0;font-family:'Courier New',monospace;font-size:8px;letter-spacing:0.2em;color:#B8963C;text-transform:uppercase;">Bay</p>
              <p style="margin:4px 0 0;font-family:Georgia,serif;font-size:15px;color:#004225;">${bayName}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 20px;border-bottom:1px solid #E8E1D6;">
              <p style="margin:0;font-family:'Courier New',monospace;font-size:8px;letter-spacing:0.2em;color:#B8963C;text-transform:uppercase;">Date</p>
              <p style="margin:4px 0 0;font-family:Georgia,serif;font-size:15px;color:#004225;">${formatDate(startTime)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 20px;">
              <p style="margin:0;font-family:'Courier New',monospace;font-size:8px;letter-spacing:0.2em;color:#B8963C;text-transform:uppercase;">Time</p>
              <p style="margin:4px 0 0;font-family:Georgia,serif;font-size:15px;color:#004225;">${formatTime(startTime)} – ${formatTime(endTime)}</p>
            </td>
          </tr>
        </table>

        ${guestsHtml}

        <p style="margin:0;font-family:'Courier New',monospace;font-size:9px;color:#6b6b6b;letter-spacing:0.15em;">
          To cancel this booking, visit the member portal. Cancellations must be made before your session begins.
        </p>

      </td>
    </tr>
  `)
}

export function bookingConfirmationText({
  memberName,
  bayName,
  startTime,
  durationMinutes,
  guests,
}: BookingConfirmationData): string {
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000)
  const firstName = memberName.split(' ')[0] ?? memberName
  const guestsLine = guests.length > 0 ? `Guests: ${guests.map((g) => g.name).join(', ')}\n` : ''

  return `Hey ${firstName},

Your bay is booked.

Bay: ${bayName}
Date: ${formatDate(startTime)}
Time: ${formatTime(startTime)} – ${formatTime(endTime)}
${guestsLine}
To cancel, visit the member portal before your session begins.

— Fescue Golf Club`
}
