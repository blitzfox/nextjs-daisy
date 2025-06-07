-- Optimize RLS policies to improve query performance
-- Replace auth.uid() with (select auth.uid()) to avoid re-evaluation per row

-- Drop existing policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Drop existing policies for game_sessions  
DROP POLICY IF EXISTS "Users can view their own game sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Users can create their own game sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Users can update their own game sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Users can delete their own game sessions" ON public.game_sessions;

-- Drop existing policies for game_moments
DROP POLICY IF EXISTS "Users can view their own game moments" ON public.game_moments;
DROP POLICY IF EXISTS "Users can create their own game moments" ON public.game_moments;
DROP POLICY IF EXISTS "Users can update their own game moments" ON public.game_moments;
DROP POLICY IF EXISTS "Users can delete their own game moments" ON public.game_moments;

-- Drop existing policies for saved_moments
DROP POLICY IF EXISTS "Users can view their own saved moments" ON public.saved_moments;
DROP POLICY IF EXISTS "Users can create their own saved moments" ON public.saved_moments;
DROP POLICY IF EXISTS "Users can update their own saved moments" ON public.saved_moments;
DROP POLICY IF EXISTS "Users can delete their own saved moments" ON public.saved_moments;

-- Create optimized RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING ((select auth.uid()) = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING ((select auth.uid()) = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK ((select auth.uid()) = id);

-- Create optimized RLS policies for game_sessions
CREATE POLICY "Users can view their own game sessions" ON public.game_sessions
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create their own game sessions" ON public.game_sessions
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own game sessions" ON public.game_sessions
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own game sessions" ON public.game_sessions
  FOR DELETE USING ((select auth.uid()) = user_id);

-- Create optimized RLS policies for game_moments
CREATE POLICY "Users can view their own game moments" ON public.game_moments
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create their own game moments" ON public.game_moments
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own game moments" ON public.game_moments
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own game moments" ON public.game_moments
  FOR DELETE USING ((select auth.uid()) = user_id);

-- Create optimized RLS policies for saved_moments
CREATE POLICY "Users can view their own saved moments" ON public.saved_moments
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create their own saved moments" ON public.saved_moments
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own saved moments" ON public.saved_moments
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own saved moments" ON public.saved_moments
  FOR DELETE USING ((select auth.uid()) = user_id); 