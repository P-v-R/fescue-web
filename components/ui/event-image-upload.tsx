'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

type Props = {
  value: string        // current image URL (empty string = none)
  onChange: (url: string) => void
}

export function EventImageUpload({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10 MB.')
      return
    }

    setError(null)
    setUploading(true)

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `events/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(path, file, { upsert: true })

      if (uploadError) throw new Error(uploadError.message)

      const { data } = supabase.storage.from('event-images').getPublicUrl(path)
      onChange(data.publicUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleRemove() {
    onChange('')
    if (inputRef.current) inputRef.current.value = ''
  }

  // ── Preview state ──────────────────────────────────────────────────────────
  if (value) {
    return (
      <div className='relative w-full aspect-video max-w-sm overflow-hidden border border-cream-mid'>
        <Image src={value} alt='Event photo' fill className='object-cover' sizes='384px' />
        <button
          type='button'
          onClick={handleRemove}
          className='absolute top-2 right-2 bg-navy/80 text-cream font-mono text-label uppercase tracking-[0.15em] px-2 py-1 hover:bg-navy transition-colors'
        >
          Remove
        </button>
      </div>
    )
  }

  // ── Upload zone ────────────────────────────────────────────────────────────
  return (
    <div>
      <input
        ref={inputRef}
        type='file'
        accept='image/jpeg,image/png,image/webp,image/gif'
        className='sr-only'
        onChange={handleChange}
      />
      <button
        type='button'
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className='w-full max-w-sm aspect-video border border-dashed border-cream-mid bg-white flex flex-col items-center justify-center gap-2 hover:border-navy transition-colors disabled:opacity-50 cursor-pointer'
      >
        {uploading ? (
          <>
            <span className='text-2xl animate-spin'>⟳</span>
            <span className='font-mono text-label uppercase tracking-[0.2em] text-navy/50'>
              Uploading…
            </span>
          </>
        ) : (
          <>
            <span className='text-2xl'>📷</span>
            <span className='font-mono text-label uppercase tracking-[0.2em] text-navy/50'>
              Click to upload a photo
            </span>
            <span className='font-mono text-label text-navy/30'>
              JPG, PNG, WebP — max 10 MB
            </span>
          </>
        )}
      </button>
      {error && (
        <p className='mt-2 font-mono text-label uppercase tracking-[0.15em] text-red-500'>
          {error}
        </p>
      )}
    </div>
  )
}
