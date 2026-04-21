-- Allow uploaders to delete their own cloned voices
create policy "Uploaders can delete their cloned voices"
  on public.cloned_voices for delete using (uploaded_by = auth.uid());
