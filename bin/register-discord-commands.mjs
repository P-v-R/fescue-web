/**
 * One-time script to register slash commands with Discord.
 * Run with: node scripts/register-discord-commands.mjs
 *
 * Requires DISCORD_APP_ID and DISCORD_BOT_TOKEN in your environment.
 * You can run it with dotenv: node --env-file=.env.local scripts/register-discord-commands.mjs
 */

const APP_ID = process.env.DISCORD_APP_ID
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN

if (!APP_ID || !BOT_TOKEN) {
  console.error('Missing DISCORD_APP_ID or DISCORD_BOT_TOKEN.')
  process.exit(1)
}

const commands = [
  {
    name: 'pledge',
    description: 'Pledge an amount toward the club workbench fund',
    options: [
      {
        name: 'amount',
        description: 'Amount to pledge in dollars (max $2,500)',
        type: 4, // INTEGER
        required: true,
        min_value: 1,
        max_value: 2500,
      },
      {
        name: 'note',
        description: 'Optional note with your pledge',
        type: 3, // STRING
        required: false,
        max_length: 280,
      },
    ],
  },
  {
    name: 'workbench',
    description: 'View the workbench fund progress and leaderboard',
  },
  {
    name: 'help',
    description: 'Show available commands for the Fescue workbench fund',
  },
]

const res = await fetch(`https://discord.com/api/v10/applications/${APP_ID}/commands`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bot ${BOT_TOKEN}`,
  },
  body: JSON.stringify(commands),
})

if (!res.ok) {
  const text = await res.text()
  console.error(`Discord API error ${res.status}:`, text)
  process.exit(1)
}

const data = await res.json()
console.log(`Registered ${data.length} command(s):`)
data.forEach((cmd) => console.log(`  /${cmd.name}`))
