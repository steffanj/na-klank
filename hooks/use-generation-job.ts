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

    supabase
      .from('generation_jobs')
      .select('id, status, error_message, target_id, completed_at')
      .eq('id', jobId)
      .single()
      .then(({ data }) => { if (data) setJob(data as GenerationJob) })

    const channel = supabase
      .channel(`job:${jobId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'generation_jobs', filter: `id=eq.${jobId}` },
        (payload) => setJob(payload.new as GenerationJob)
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [jobId])

  return job
}
