# Chess Database Schema Guide

This guide explains the Supabase database schema designed for your chess analysis application.

## 🗄️ Database Tables

### 1. **profiles** - User Profiles
Stores user profile information linked to Supabase Auth.

```sql
- id: UUID (Primary Key, links to auth.users)
- username: TEXT
- email: TEXT  
- full_name: TEXT
- avatar_url: TEXT
- lichess_username: TEXT
- chessdotcom_username: TEXT
- preferred_platform: TEXT ('lichess' | 'chessdotcom')
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### 2. **game_sessions** - Your Main Game Data Table
Stores the data you requested: UUID, Timestamp, Username, Game ID, Game Name, Voice Enabled, plus additional chess analysis fields.

```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key to profiles)
- timestamp: TIMESTAMP
- username: TEXT
- game_id: TEXT
- game_name: TEXT
- voice_enabled: BOOLEAN
- platform: TEXT ('lichess' | 'chessdotcom' | 'manual')
- pgn: TEXT
- fen: TEXT
- result: TEXT
- white_player: TEXT
- black_player: TEXT
- white_rating: INTEGER
- black_rating: INTEGER
- time_control: TEXT
- opening_name: TEXT
- opening_eco: TEXT
- analysis_completed: BOOLEAN
```

### 3. **game_moments** - Critical Positions/Moments
Stores critical moments from games for analysis and replay.

```sql
- id: UUID (Primary Key)
- game_session_id: UUID (Foreign Key)
- user_id: UUID (Foreign Key)
- position_number: INTEGER
- move_number: TEXT
- move_played: TEXT
- fen: TEXT
- evaluation: DECIMAL
- win_chance: DECIMAL
- best_move: TEXT
- opponents_best_move: TEXT
- continuation: TEXT
- full_line: TEXT
- phase: TEXT ('opening' | 'middlegame' | 'endgame')
- moment_type: TEXT ('blunder' | 'mistake' | 'inaccuracy' | 'good_move' | 'brilliant')
- reason: TEXT
- analysis_text: TEXT
- audio_url: TEXT
- circle_annotation: TEXT
- summary: TEXT
```

### 4. **saved_moments** - User's Saved Moments for Practice
Allows users to save specific moments for practice and replay.

```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- game_moment_id: UUID (Foreign Key)
- user_notes: TEXT
- tags: TEXT[] (Array of tags)
- difficulty_rating: INTEGER (1-5)
- practice_count: INTEGER
- last_practiced_at: TIMESTAMP
- mastery_level: TEXT ('learning' | 'practicing' | 'mastered')
```

### 5. **critical_moments_view** - Combined View
A database view that joins tables to show all critical moments with additional context.

## 🔧 How to Deploy the Database

1. **Apply the migrations** to your Supabase project:
```bash
npx supabase db push
```

Or manually run the SQL files in your Supabase dashboard:
- `supabase/migrations/20250607175310_create_chess_database_schema.sql`
- `supabase/migrations/20250607175610_add_helper_functions.sql`

## 💻 Usage Examples

### Using the DatabaseService Class

```typescript
import { DatabaseService } from '../lib/supabase/database'

const db = new DatabaseService()

// Create a new game session
const newSession = await db.createGameSession({
  user_id: userId,
  username: 'player123',
  game_id: 'lichess_abc123',
  game_name: 'Rapid Game vs Opponent',
  voice_enabled: true,
  platform: 'lichess',
  pgn: '1. e4 e5 2. Nf3...',
  white_player: 'You',
  black_player: 'Opponent',
  analysis_completed: false
})

// Add critical moments to the game
const moments = await db.createGameMoments([
  {
    game_session_id: newSession.id,
    user_id: userId,
    position_number: 1,
    move_number: '12.',
    move_played: 'Nxd5??',
    fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 3',
    evaluation: -2.5,
    win_chance: 25.0,
    best_move: 'Nc3',
    moment_type: 'blunder',
    phase: 'middlegame',
    reason: 'Hangs the knight',
    analysis_text: 'This move loses the knight immediately.'
  }
])

// Save a moment for later practice
await db.saveGameMoment(userId, moments[0].id, {
  tags: ['tactics', 'knight-fork'],
  difficulty_rating: 4,
  user_notes: 'Remember to check for knight forks!'
})

// Get all critical moments for analysis
const criticalMoments = await db.getCriticalMoments(userId, {
  momentType: 'blunder',
  limit: 10
})

// Get practice moments (spaced repetition)
const practiceData = await db.supabase
  .rpc('get_practice_moments', { p_user_id: userId, p_limit: 5 })
```

### Querying the Database Directly

```typescript
import { createClient } from './lib/supabase/client'

const supabase = createClient()

// Get recent games with voice enabled
const { data: recentGames } = await supabase
  .from('game_sessions')
  .select('*')
  .eq('voice_enabled', true)
  .order('timestamp', { ascending: false })
  .limit(10)

// Get all blunders from last month
const { data: recentBlunders } = await supabase
  .from('critical_moments_view')
  .select('*')
  .eq('moment_type', 'blunder')
  .gte('game_timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
  .order('game_timestamp', { ascending: false })
```

## 🎯 Key Design Benefits

1. **Scalable**: Proper indexing and foreign keys for performance
2. **Secure**: Row Level Security (RLS) ensures users only see their own data
3. **Flexible**: Tags system allows custom categorization
4. **Practice-Ready**: Built-in spaced repetition support
5. **Analytics-Friendly**: Pre-built stats functions and views
6. **Voice Integration**: Dedicated field for voice-enabled sessions

## 🔒 Security Features

- **Row Level Security (RLS)** enabled on all tables
- Users can only access their own data
- Automatic profile creation on user signup
- Secure functions with `SECURITY DEFINER`

## 📊 Built-in Analytics

Use the helper functions for quick analytics:

```typescript
// Get comprehensive user stats
const stats = await supabase.rpc('get_user_chess_stats', { p_user_id: userId })

// Get recent activity feed
const activity = await supabase.rpc('get_recent_activity', { 
  p_user_id: userId, 
  p_limit: 20 
})

// Get moments for practice (spaced repetition)
const practice = await supabase.rpc('get_practice_moments', { 
  p_user_id: userId, 
  p_limit: 5 
})
```

## 🚀 Next Steps

1. **Deploy the schema** to your Supabase project
2. **Test the DatabaseService** class with sample data
3. **Integrate with your analysis pipeline** to populate game moments
4. **Build UI components** to display and interact with the data
5. **Add real-time subscriptions** for live updates

The database is designed to grow with your application and support advanced features like:
- Spaced repetition learning
- Performance analytics
- Social features (if needed later)
- Advanced search and filtering 