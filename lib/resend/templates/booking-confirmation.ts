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
      ? `<p style="margin:0 0 20px;font-family:Georgia,serif;font-size:15px;color:#4A4A4A;line-height:1.7;font-weight:300;">
           <strong style="color:#0A2B5E;">Guests:</strong> ${guests.map((g) => g.name).join(', ')}
         </p>`
      : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Booking Confirmation — Fescue Golf Club</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F0E8;font-family:Georgia,serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F5F0E8;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background-color:#ffffff;border:1px solid #E8E1D6;">

          <!-- Header -->
          <tr>
            <td style="background-color:#0A2B5E;padding:36px 40px;text-align:center;">
              <p style="margin:0;font-family:Georgia,serif;font-size:22px;letter-spacing:0.18em;color:#F5F0E8;text-transform:uppercase;">
                Fescue
              </p>
              <p style="margin:8px 0 0;font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.28em;color:#B8963C;text-transform:uppercase;">
                Golf Club
              </p>
            </td>
          </tr>

          <!-- Gold divider -->
          <tr>
            <td style="height:3px;background-color:#B8963C;"></td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:48px 40px;">

              <p style="margin:0 0 8px;font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.28em;color:#B8963C;text-transform:uppercase;">
                Booking Confirmed
              </p>
              <p style="margin:0 0 12px;font-family:Georgia,serif;font-size:16px;font-weight:300;color:#0A2B5E;">
                Hey ${firstName},
              </p>
              <h1 style="margin:0 0 24px;font-family:Georgia,serif;font-size:28px;font-weight:300;color:#0A2B5E;line-height:1.3;">
                You're booked.
              </h1>

              <div style="width:48px;height:1px;background-color:#B8963C;margin:0 0 28px;"></div>

              <!-- Booking details -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 28px;border:1px solid #E8E1D6;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #E8E1D6;">
                    <p style="margin:0;font-family:'Courier New',monospace;font-size:8px;letter-spacing:0.2em;color:#B8963C;text-transform:uppercase;">Bay</p>
                    <p style="margin:4px 0 0;font-family:Georgia,serif;font-size:15px;color:#0A2B5E;">${bayName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #E8E1D6;">
                    <p style="margin:0;font-family:'Courier New',monospace;font-size:8px;letter-spacing:0.2em;color:#B8963C;text-transform:uppercase;">Date</p>
                    <p style="margin:4px 0 0;font-family:Georgia,serif;font-size:15px;color:#0A2B5E;">${formatDate(startTime)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-family:'Courier New',monospace;font-size:8px;letter-spacing:0.2em;color:#B8963C;text-transform:uppercase;">Time</p>
                    <p style="margin:4px 0 0;font-family:Georgia,serif;font-size:15px;color:#0A2B5E;">${formatTime(startTime)} – ${formatTime(endTime)}</p>
                  </td>
                </tr>
              </table>

              ${guestsHtml}

              <p style="margin:0;font-family:'Courier New',monospace;font-size:9px;color:#9B9182;letter-spacing:0.15em;">
                To cancel this booking, visit the member portal. Cancellations must be made before your session begins.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F5F0E8;padding:24px 40px;border-top:1px solid #E8E1D6;">
              <p style="margin:0;font-family:'Courier New',monospace;font-size:8px;letter-spacing:0.2em;color:#9B9182;text-align:center;text-transform:uppercase;">
                Fescue Golf Club &nbsp;·&nbsp; Private Membership
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
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
