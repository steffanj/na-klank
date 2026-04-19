'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGenerationJob } from '@/hooks/use-generation-job'

type Props = {
  jobId: string | null
  spaceId: string
}

export default function EulogyGenerating({ jobId, spaceId }: Props) {
  const job = useGenerationJob(jobId)
  const router = useRouter()

  useEffect(() => {
    if (!jobId) {
      const t = setTimeout(() => router.refresh(), 3000)
      return () => clearTimeout(t)
    }
  }, [jobId, router])

  useEffect(() => {
    if (job?.status === 'done') router.refresh()
  }, [job?.status, router])

  const failed = job?.status === 'failed'

  return (
    <div
      className="border border-stone-300 rounded-xl px-6 py-10 text-center"
      style={{ backgroundColor: '#FFF8F2' }}
    >
      {failed ? (
        <>
          <p className="text-black mb-3">Er is iets misgegaan bij het opstellen.</p>
          <a
            href={`/spaces/${spaceId}/eulogy`}
            className="text-sm text-stone-500 hover:text-stone-700 underline"
          >
            Probeer opnieuw
          </a>
        </>
      ) : (
        <>
          <div className="flex justify-center mb-5">
            <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
          </div>
          <p className="text-black mb-2">Rouwbrief wordt opgesteld…</p>
          <p className="text-sm text-stone-400">Dit kan een paar minuten duren.</p>
        </>
      )}
    </div>
  )
}
