'use client'

import { useState } from 'react'
import { updateProfileAction } from './actions'
import { formatPhone } from '@/lib/utils/phone'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type Props = {
  phone: string | null
  discord: string | null
}

// Pencil icon
function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

export function ContactInfoSection({ phone, discord }: Props) {
  const [editing, setEditing] = useState(false)
  const [phoneVal, setPhoneVal] = useState(phone ?? '')
  const [discordVal, setDiscordVal] = useState(discord ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    const result = await updateProfileAction({ phone: phoneVal, discord: discordVal })
    setSaving(false)
    if (result.error) {
      setError(result.error)
    } else {
      setEditing(false)
    }
  }

  return (
    <section className="mb-10 pb-10 border-b border-cream-mid">
      <div className="flex items-center gap-2 mb-5">
        <p className="font-mono text-label uppercase tracking-[0.28em] text-sage">Contact Info</p>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            aria-label="Edit contact info"
            className="text-sand hover:text-gold transition-colors"
          >
            <PencilIcon />
          </button>
        )}
      </div>

      {!editing ? (
        <>
          <p className="font-sans text-xs font-light text-navy/40 mb-4">
            Visible to other members in the directory.
          </p>
          <div className="flex flex-col gap-3">
            <div>
              <p className="font-mono text-label uppercase tracking-[0.2em] text-sand mb-0.5">Phone</p>
              <p className="font-sans text-sm font-light text-navy-dark">
                {phone ?? <span className="text-navy/30 italic">Not set</span>}
              </p>
            </div>
            <div>
              <p className="font-mono text-label uppercase tracking-[0.2em] text-sand mb-0.5">Discord</p>
              <p className="font-sans text-sm font-light text-navy-dark">
                {discord ?? <span className="text-navy/30 italic">Not set</span>}
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-4">
          <Input
            label="Phone"
            type="tel"
            value={phoneVal}
            onChange={(e) => setPhoneVal(formatPhone(e.target.value))}
            placeholder="(555) 000-0000"
          />
          <Input
            label="Discord"
            type="text"
            value={discordVal}
            onChange={(e) => setDiscordVal(e.target.value)}
            placeholder="username or username#1234"
          />
          {error && (
            <p className="font-mono text-label text-red-500">{error}</p>
          )}
          <div className="flex gap-3">
            <Button onClick={handleSave} loading={saving}>Save</Button>
            <Button variant="ghost" onClick={() => { setEditing(false); setError(null) }} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
