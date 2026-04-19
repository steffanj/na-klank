'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type JobStatus = 'pending' | 'processing' | 'done' | 'failed'

export interface GenerationJob {
  id: string
  status: JobStatus
  error_message: string | null
  target_id: string | null
  completed_at: string | null
}

export function useGenerationJob(jobId: string | null) {
  const [job, setJob] = useState<GenerationJob | null>(null)

  useEffect(() => {
    if (!jobId) return

    const supabase = createClient()
    let stopped = false

    async function poll() {
      const { data } = await supabase
        .from('generation_jobs')
        .select('id, status, error_message, target_id, completed_at')
        .eq('id', jobId)
        .single()
      if (data && !stopped) setJob(data as GenerationJob)
    }

    poll()

    const interval = setInterval(() => {
      if (stopped) return
      poll()
    }, 3000)

    const channel = supabase
      .channel(`job:${jobId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'generation_jobs', filter: `id=eq.${jobId}` },
        (payload) => { if (!stopped) setJob(payload.new as GenerationJob) }
      )
      .subscribe()

    return () => {
      stopped = true
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [jobId])

  return job
}
