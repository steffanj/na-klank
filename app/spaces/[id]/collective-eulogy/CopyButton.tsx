'use client'

import { useState } from 'react'

export default function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="text-xs text-black shrink-0 border border-stone-300 rounded-lg px-3 py-1.5 hover:border-stone-400 transition-colors"
      style={{ backgroundColor: '#FFF1E5' }}
    >
      {copied ? 'Gekopieerd' : 'Kopieer'}
    </button>
  )
}
