-- Fix Security Definer issue with critical_moments_view
-- Recreate the view to ensure it respects RLS policies properly

-- Drop the existing view
DROP VIEW IF EXISTS public.critical_moments_view;

-- Recreate the view with explicit security invoker and RLS-compliant filtering
CREATE VIEW public.critical_moments_view 
WITH (security_invoker = true) AS
SELECT 
  gm.id,
  gm.game_session_id,
  gm.user_id,
  gs.username,
  gs.game_name,
  gs.platform,
  gs.timestamp as game_timestamp,
  gm.position_number,
  gm.move_number,
  gm.move_played,
  gm.fen,
  gm.evaluation,
  gm.win_chance,
  gm.best_move,
  gm.opponents_best_move,
  gm.continuation,
  gm.phase,
  gm.moment_type,
  gm.reason,
  gm.analysis_text,
  gm.audio_url,
  gm.summary,
  -- Check if this moment is saved by the user (only for the current user)
  CASE WHEN sm.id IS NOT NULL THEN true ELSE false END as is_saved,
  sm.user_notes,
  sm.tags,
  sm.difficulty_rating,
  sm.mastery_level,
  gm.created_at
FROM public.game_moments gm
JOIN public.game_sessions gs ON gm.game_session_id = gs.id
LEFT JOIN public.saved_moments sm ON gm.id = sm.game_moment_id 
  AND gm.user_id = sm.user_id 
  AND sm.user_id = (select auth.uid()) -- Ensure RLS compliance
WHERE 
  -- Explicitly filter by current user to ensure RLS compliance
  gm.user_id = (select auth.uid())
  AND gs.user_id = (select auth.uid());

-- Add a comment explaining the security approach
COMMENT ON VIEW public.critical_moments_view IS 
'View for critical moments that respects RLS policies. Uses security_invoker=true and explicit user filtering to ensure users only see their own data.'; 