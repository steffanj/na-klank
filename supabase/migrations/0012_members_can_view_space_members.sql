-- Allow members to see all members in their own space (needed to show primary contact name).
-- Uses auth_is_accepted_member (security definer) to avoid RLS recursion.
DROP POLICY IF EXISTS "Users can view their own membership" ON memorial_space_members;
DROP POLICY IF EXISTS "Members can view other members in their space" ON memorial_space_members;

CREATE POLICY "Members can view other members in their space"
ON memorial_space_members
FOR SELECT
USING (
  auth_is_accepted_member(memorial_space_id)
  OR auth_is_space_director(memorial_space_id)
);
