-- Create profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  lichess_username TEXT,
  chessdotcom_username TEXT,
  preferred_platform TEXT CHECK (preferred_platform IN ('lichess', 'chessdotcom')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create game_sessions table (your main table with the requested fields)
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  username TEXT NOT NULL,
  game_id TEXT NOT NULL,
  game_name TEXT,
  voice_enabled BOOLEAN DEFAULT false,
  
  -- Additional useful fields for chess analysis
  platform TEXT CHECK (platform IN ('lichess', 'chessdotcom', 'manual')),
  pgn TEXT,
  fen TEXT,
  result TEXT,
  white_player TEXT,
  black_player TEXT,
  white_rating INTEGER,
  black_rating INTEGER,
  time_control TEXT,
  opening_name TEXT,
  opening_eco TEXT,
  analysis_completed BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create game_moments table (critical positions/moments from games)
CREATE TABLE IF NOT EXISTS public.game_moments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_session_id UUID REFERENCES public.game_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Position information
  position_number INTEGER NOT NULL,
  move_number TEXT NOT NULL,
  move_played TEXT,
  fen TEXT NOT NULL,
  
  -- Analysis data
  evaluation DECIMAL(10,2),
  win_chance DECIMAL(5,2),
  best_move TEXT,
  opponents_best_move TEXT,
  continuation TEXT,
  full_line TEXT,
  
  -- Categorization
  phase TEXT CHECK (phase IN ('opening', 'middlegame', 'endgame')),
  moment_type TEXT CHECK (moment_type IN ('blunder', 'mistake', 'inaccuracy', 'good_move', 'brilliant')),
  reason TEXT,
  analysis_text TEXT,
  
  -- Audio/Visual
  audio_url TEXT,
  circle_annotation TEXT,
  summary TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create saved_moments table (user's saved moments for replay)
CREATE TABLE IF NOT EXISTS public.saved_moments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_moment_id UUID REFERENCES public.game_moments(id) ON DELETE CASCADE NOT NULL,
  
  -- User notes and tags
  user_notes TEXT,
  tags TEXT[], -- Array of tags like ['tactics', 'endgame', 'favorite']
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  practice_count INTEGER DEFAULT 0,
  last_practiced_at TIMESTAMP WITH TIME ZONE,
  mastery_level TEXT CHECK (mastery_level IN ('learning', 'practicing', 'mastered')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  
  -- Ensure user can't save the same moment twice
  UNIQUE(user_id, game_moment_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON public.game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_timestamp ON public.game_sessions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_id ON public.game_sessions(game_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_platform ON public.game_sessions(platform);

CREATE INDEX IF NOT EXISTS idx_game_moments_game_session_id ON public.game_moments(game_session_id);
CREATE INDEX IF NOT EXISTS idx_game_moments_user_id ON public.game_moments(user_id);
CREATE INDEX IF NOT EXISTS idx_game_moments_phase ON public.game_moments(phase);
CREATE INDEX IF NOT EXISTS idx_game_moments_moment_type ON public.game_moments(moment_type);
CREATE INDEX IF NOT EXISTS idx_game_moments_position ON public.game_moments(position_number);

CREATE INDEX IF NOT EXISTS idx_saved_moments_user_id ON public.saved_moments(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_moments_tags ON public.saved_moments USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_saved_moments_mastery ON public.saved_moments(mastery_level);

-- Create a view for critical moments (for easy querying)
CREATE OR REPLACE VIEW public.critical_moments_view AS
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
  -- Check if this moment is saved by the user
  CASE WHEN sm.id IS NOT NULL THEN true ELSE false END as is_saved,
  sm.user_notes,
  sm.tags,
  sm.difficulty_rating,
  sm.mastery_level,
  gm.created_at
FROM public.game_moments gm
JOIN public.game_sessions gs ON gm.game_session_id = gs.id
LEFT JOIN public.saved_moments sm ON gm.id = sm.game_moment_id AND gm.user_id = sm.user_id;

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_moments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for game_sessions
CREATE POLICY "Users can view their own game sessions" ON public.game_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own game sessions" ON public.game_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game sessions" ON public.game_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own game sessions" ON public.game_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for game_moments
CREATE POLICY "Users can view their own game moments" ON public.game_moments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own game moments" ON public.game_moments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game moments" ON public.game_moments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own game moments" ON public.game_moments
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for saved_moments
CREATE POLICY "Users can view their own saved moments" ON public.saved_moments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved moments" ON public.saved_moments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved moments" ON public.saved_moments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved moments" ON public.saved_moments
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_game_sessions_updated_at
  BEFORE UPDATE ON public.game_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saved_moments_updated_at
  BEFORE UPDATE ON public.saved_moments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
