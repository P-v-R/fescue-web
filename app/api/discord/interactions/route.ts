import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY!
const GOAL = parseInt(process.env.WORKBENCH_GOAL ?? '2500', 10)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fescuegolfclub.com'

// Discord interaction types
const PING = 1
const APPLICATION_COMMAND = 2

// Discord response types
const PONG = 1
const CHANNEL_MESSAGE_WITH_SOURCE = 4

// ---- Signature verification ----

async function verifySignature(req: NextRequest, rawBody: string): Promise<boolean> {
  const signature = req.headers.get('x-signature-ed25519')
  const timestamp = req.headers.get('x-signature-timestamp')
  if (!signature || !timestamp) return false

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      Buffer.from(PUBLIC_KEY, 'hex'),
      { name: 'Ed25519' },
      false,
      ['verify'],
    )
    return crypto.subtle.verify(
      'Ed25519',
      key,
      Buffer.from(signature, 'hex'),
      new TextEncoder().encode(timestamp + rawBody),
    )
  } catch {
    return false
  }
}

// ---- Response helpers ----

function ephemeral(content: string) {
  return NextResponse.json({
    type: CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content, flags: 64 },
  })
}

function embedResponse(embed: object) {
  return NextResponse.json({
    type: CHANNEL_MESSAGE_WITH_SOURCE,
    data: { embeds: [embed] },
  })
}

// ---- Progress bar ----

function progressBar(total: number, goal: number): string {
  const filled = Math.min(13, Math.round((total / goal) * 13))
  return '█'.repeat(filled) + '░'.repeat(13 - filled)
}

// ---- Display name ----

function getDisplayName(interaction: DiscordInteraction): string {
  const member = interaction.member
  const user = member?.user ?? interaction.user!
  return member?.nick ?? user.global_name ?? user.username
}

// ---- Types ----

type DiscordUser = {
  id: string
  username: string
  global_name?: string
}

type DiscordMember = {
  user: DiscordUser
  nick?: string
}

type DiscordInteraction = {
  type: number
  data?: {
    name: string
    options?: { name: string; value: unknown }[]
  }
  member?: DiscordMember
  user?: DiscordUser
}

// ---- Command handlers ----

async function handlePledge(interaction: DiscordInteraction) {
  const member = interaction.member
  const user = member?.user ?? interaction.user!
  const discordUserId = user.id
  const discordUsername = getDisplayName(interaction)

  const options = interaction.data?.options ?? []
  const amount = options.find((o) => o.name === 'amount')?.value as number | undefined
  const noteRaw = options.find((o) => o.name === 'note')?.value as string | undefined
  const note = noteRaw?.trim().slice(0, 280) || null

  if (!amount || amount < 10 || amount > 2500) {
    return ephemeral('Amount must be between $10 and $2,500.')
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('workbench_pledges')
    .insert({ discord_user_id: discordUserId, discord_username: discordUsername, amount, note })

  if (error) {
    if (error.code === '23505') {
      return ephemeral("You've already pledged — each member can only pledge once.")
    }
    console.error('[discord bot] pledge insert error:', error)
    return ephemeral('Something went wrong. Please try again.')
  }

  const embed: Record<string, unknown> = {
    color: 0x004225,
    author: { name: 'Pledge received' },
    title: `${discordUsername} pledged $${amount.toLocaleString()}`,
    footer: { text: 'Use /workbench to see full progress' },
  }
  if (note) embed.description = `*"${note}"*`

  return embedResponse(embed)
}

async function handleWorkbench(interaction: DiscordInteraction) {
  const member = interaction.member
  const user = member?.user ?? interaction.user!

  const supabase = createAdminClient()
  const { data: pledges } = await supabase
    .from('workbench_pledges')
    .select('discord_user_id, discord_username, amount')
    .order('amount', { ascending: false })

  const rows = pledges ?? []
  const total = rows.reduce((sum, p) => sum + p.amount, 0)
  const pledgeCount = rows.length
  const pct = Math.min(100, Math.round((total / GOAL) * 100))
  const remaining = Math.max(0, GOAL - total)
  const bar = progressBar(total, GOAL)

  const top5 = rows.slice(0, 5)
  const overflow = rows.slice(5)
  const overflowTotal = overflow.reduce((sum, p) => sum + p.amount, 0)

  const leaderboardLines = top5.map((p, i) => {
    const star = p.discord_user_id === user.id ? ' ★' : ''
    return `${i + 1}. ${p.discord_username}${star} — $${p.amount.toLocaleString()}`
  })
  if (overflow.length > 0) {
    leaderboardLines.push(`+ ${overflow.length} more — $${overflowTotal.toLocaleString()}`)
  }

  const description = [
    `**$${total.toLocaleString()} raised**\u2003\u2003goal: $${GOAL.toLocaleString()}`,
    `\`${bar}\`  ${pct}% funded · $${remaining.toLocaleString()} to go`,
  ].join('\n')

  const embed: Record<string, unknown> = {
    color: 0x004225,
    title: 'Club Workbench Fund',
    description,
    footer: { text: `Pledge at ${APP_URL}/workbench · Updated just now` },
    timestamp: new Date().toISOString(),
  }

  if (pledgeCount > 0) {
    embed.fields = [
      {
        name: `PLEDGES (${pledgeCount} ${pledgeCount === 1 ? 'MEMBER' : 'MEMBERS'})`,
        value: leaderboardLines.join('\n'),
      },
    ]
  }

  return embedResponse(embed)
}

function handleHelp() {
  return embedResponse({
    color: 0x004225,
    title: 'Workbench Fund — Commands',
    fields: [
      {
        name: '/pledge amount:<dollars> [note:<text>]',
        value:
          'Pledge an amount toward the club workbench. Min $10, max $2,500. One pledge per member.',
      },
      {
        name: '/workbench',
        value: 'View the current fundraising progress and member leaderboard.',
      },
      {
        name: '/help',
        value: 'Show this help message.',
      },
    ],
    footer: { text: 'Fescue Golf Club · fescuegolfclub.com' },
  })
}

// ---- Main handler ----

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  const valid = await verifySignature(req, rawBody)
  if (!valid) {
    return new NextResponse('Invalid request signature', { status: 401 })
  }

  const interaction: DiscordInteraction = JSON.parse(rawBody)

  if (interaction.type === PING) {
    return NextResponse.json({ type: PONG })
  }

  if (interaction.type === APPLICATION_COMMAND) {
    switch (interaction.data?.name) {
      case 'pledge':
        return handlePledge(interaction)
      case 'workbench':
        return handleWorkbench(interaction)
      case 'help':
        return handleHelp()
    }
  }

  return new NextResponse('Unknown interaction type', { status: 400 })
}
