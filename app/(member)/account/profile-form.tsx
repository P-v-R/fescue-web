'use client'

import { useState } from 'react'
import { updateProfileAction } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type Props = {
  phone: string | null
  discord: string | null
}

export function ProfileForm({ phone, discord }: Props) {
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

  if (!editing) {
    return (
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
        <button
          onClick={() => setEditing(true)}
          className="self-start font-mono text-label uppercase tracking-[0.18em] text-gold hover:text-navy transition-colors mt-1"
        >
          Edit Contact Info
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Phone"
        type="tel"
        value={phoneVal}
        onChange={(e) => setPhoneVal(e.target.value)}
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
  )
}
