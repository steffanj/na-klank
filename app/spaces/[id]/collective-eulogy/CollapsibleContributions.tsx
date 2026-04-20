'use client'

import { useState } from 'react'

export default function CollapsibleContributions({ children, pendingCount }: { children: React.ReactNode; pendingCount: number }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full text-base text-black border-b border-stone-300 pb-2 mb-4 flex items-center justify-between hover:text-stone-600 transition-colors"
      >
        <span>
          Bijdragen bekijken of opnieuw modereren
          {pendingCount > 0 && (
            <span className="ml-2 text-xs text-stone-500">({pendingCount} nieuw)</span>
          )}
        </span>
        <span className="text-sm text-stone-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && children}
    </div>
  )
}
