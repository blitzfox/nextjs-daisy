-- Function to increment practice count and update last_practiced_at
CREATE OR REPLACE FUNCTION public.increment_practice_count(
  p_user_id UUID,
  p_game_moment_id UUID
)
RETURNS public.saved_moments AS $$
DECLARE
  updated_moment public.saved_moments;
BEGIN
  UPDATE public.saved_moments
  SET 
    practice_count = practice_count + 1,
    last_practiced_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id AND game_moment_id = p_game_moment_id
  RETURNING * INTO updated_moment;
  
  RETURN updated_moment;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's chess statistics
CREATE OR REPLACE FUNCTION public.get_user_chess_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_games', (SELECT COUNT(*) FROM public.game_sessions WHERE user_id = p_user_id),
    'total_moments', (SELECT COUNT(*) FROM public.game_moments WHERE user_id = p_user_id),
    'saved_moments', (SELECT COUNT(*) FROM public.saved_moments WHERE user_id = p_user_id),
    'blunders', (SELECT COUNT(*) FROM public.game_moments WHERE user_id = p_user_id AND moment_type = 'blunder'),
    'mistakes', (SELECT COUNT(*) FROM public.game_moments WHERE user_id = p_user_id AND moment_type = 'mistake'),
    'good_moves', (SELECT COUNT(*) FROM public.game_moments WHERE user_id = p_user_id AND moment_type = 'good_move'),
    'brilliant_moves', (SELECT COUNT(*) FROM public.game_moments WHERE user_id = p_user_id AND moment_type = 'brilliant'),
    'avg_evaluation', (SELECT ROUND(AVG(evaluation), 2) FROM public.game_moments WHERE user_id = p_user_id AND evaluation IS NOT NULL),
    'games_by_platform', (
      SELECT json_object_agg(platform, count)
      FROM (
        SELECT platform, COUNT(*) as count
        FROM public.game_sessions
        WHERE user_id = p_user_id AND platform IS NOT NULL
        GROUP BY platform
      ) platform_counts
    ),
    'moments_by_phase', (
      SELECT json_object_agg(phase, count)
      FROM (
        SELECT phase, COUNT(*) as count
        FROM public.game_moments
        WHERE user_id = p_user_id AND phase IS NOT NULL
        GROUP BY phase
      ) phase_counts
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent activity for a user
CREATE OR REPLACE FUNCTION public.get_recent_activity(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  activity_type TEXT,
  activity_date TIMESTAMP WITH TIME ZONE,
  game_name TEXT,
  description TEXT,
  metadata JSON
) AS $$
BEGIN
  RETURN QUERY
  (
    -- Recent game sessions
    SELECT 
      'game_session'::TEXT as activity_type,
      gs.created_at as activity_date,
      gs.game_name,
      'Analyzed game: ' || COALESCE(gs.game_name, 'Game #' || gs.game_id) as description,
      json_build_object(
        'platform', gs.platform,
        'result', gs.result,
        'opening', gs.opening_name
      ) as metadata
    FROM public.game_sessions gs
    WHERE gs.user_id = p_user_id
    
    UNION ALL
    
    -- Recent saved moments
    SELECT 
      'saved_moment'::TEXT as activity_type,
      sm.created_at as activity_date,
      gs.game_name,
      'Saved moment from ' || COALESCE(gs.game_name, 'Game #' || gs.game_id) as description,
      json_build_object(
        'tags', sm.tags,
        'difficulty_rating', sm.difficulty_rating,
        'mastery_level', sm.mastery_level
      ) as metadata
    FROM public.saved_moments sm
    JOIN public.game_moments gm ON sm.game_moment_id = gm.id
    JOIN public.game_sessions gs ON gm.game_session_id = gs.id
    WHERE sm.user_id = p_user_id
  ) 
  ORDER BY activity_date DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically categorize moment types based on evaluation
CREATE OR REPLACE FUNCTION public.categorize_moment_type(
  old_eval DECIMAL,
  new_eval DECIMAL
) RETURNS TEXT AS $$
DECLARE
  eval_diff DECIMAL;
BEGIN
  IF old_eval IS NULL OR new_eval IS NULL THEN
    RETURN 'unknown';
  END IF;
  
  eval_diff := new_eval - old_eval;
  
  CASE
    WHEN eval_diff <= -200 THEN RETURN 'blunder';
    WHEN eval_diff <= -100 THEN RETURN 'mistake';
    WHEN eval_diff <= -50 THEN RETURN 'inaccuracy';
    WHEN eval_diff >= 100 THEN RETURN 'brilliant';
    WHEN eval_diff >= 50 THEN RETURN 'good_move';
    ELSE RETURN 'normal';
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get moments for spaced repetition practice
CREATE OR REPLACE FUNCTION public.get_practice_moments(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE(
  moment_id UUID,
  fen TEXT,
  best_move TEXT,
  analysis_text TEXT,
  difficulty_rating INTEGER,
  days_since_practice INTEGER,
  practice_priority INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gm.id as moment_id,
    gm.fen,
    gm.best_move,
    gm.analysis_text,
    sm.difficulty_rating,
    EXTRACT(days FROM NOW() - COALESCE(sm.last_practiced_at, sm.created_at))::INTEGER as days_since_practice,
    -- Priority calculation: higher for longer time since practice and higher difficulty
    (EXTRACT(days FROM NOW() - COALESCE(sm.last_practiced_at, sm.created_at)) * 
     COALESCE(sm.difficulty_rating, 3))::INTEGER as practice_priority
  FROM public.saved_moments sm
  JOIN public.game_moments gm ON sm.game_moment_id = gm.id
  WHERE sm.user_id = p_user_id
    AND sm.mastery_level != 'mastered'
    AND gm.best_move IS NOT NULL
  ORDER BY practice_priority DESC, sm.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
