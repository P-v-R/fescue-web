const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL
const SUGGESTIONS_WEBHOOK_URL = process.env.DISCORD_SUGGESTIONS_WEBHOOK_URL

export async function notifyNewEvent(event: {
  id: string
  title: string
  description?: string
  starts_at: string
  ends_at?: string
  location?: string
  rsvp_enabled: boolean
}) {
  if (!WEBHOOK_URL) throw new Error('DISCORD_WEBHOOK_URL is not configured.')

  const date = new Date(event.starts_at)
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: process.env.TZ ?? 'America/Los_Angeles',
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fescuegolfclub.com'
  const eventUrl = `${appUrl}/events/${event.id}`

  const fields: { name: string; value: string; inline?: boolean }[] = [
    { name: 'Date', value: dateStr, inline: true },
    { name: 'Time', value: timeStr, inline: true },
  ]
  if (event.location) {
    fields.push({ name: 'Location', value: event.location, inline: true })
  }
  if (event.rsvp_enabled) {
    fields.push({ name: 'RSVP', value: `[View event & RSVP](${eventUrl})` })
  }

  await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'Fescue Bot',
      avatar_url: `${appUrl}/icon.png`,
      embeds: [
        {
          title: `📅 ${event.title}`,
          description: event.description ?? undefined,
          url: eventUrl,
          color: 0x004225,
          fields,
          footer: { text: 'Fescue Golf Club' },
        },
      ],
    }),
  }).catch((err) => {
    console.error('[discord] failed to send event notification:', err)
  })
}

export async function notifySuggestion({
  body,
  memberName,
  anonymous,
}: {
  body: string
  memberName: string
  anonymous: boolean
}) {
  if (!SUGGESTIONS_WEBHOOK_URL) throw new Error('DISCORD_SUGGESTIONS_WEBHOOK_URL is not configured.')

  const author = anonymous ? 'Anonymous member' : memberName

  await fetch(SUGGESTIONS_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'Fescue Bot',
      embeds: [
        {
          title: '💬 New Club Suggestion',
          description: body,
          color: 0x004225,
          footer: { text: `Submitted by ${author}` },
        },
      ],
    }),
  }).catch((err) => {
    console.error('[discord] failed to send suggestion:', err)
  })
}
