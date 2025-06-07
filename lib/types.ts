// Platform types
export type Platform = 'lichess' | 'chessdotcom';

// Game types
export interface Game {
  id: string;
  white: string;
  black: string;
  result: string;
  date: string;
  moves: string;
  pgn: string;
  fen?: string;
  timeControl?: string;
  whiteRating?: number;
  blackRating?: number;
  opening?: string;
}

// Analysis types
export interface CriticalMoment {
  id: number;
  position: number;
  moveNumber: string;
  moveInfo: string;
  evaluation: string;
  bestMove: string;
  opponentsBestMove?: string;
  fen: string;
  continuation: string;
  fullLine: string;
  phase: string;
  reason: string;
  analysis: string;
  circle?: string;
  audioUrl?: string;
  summary?: string;
}

// API response types
export interface LichessGame {
  id: string;
  rated: boolean;
  variant: string;
  speed: string;
  perf: string;
  createdAt: number;
  lastMoveAt: number;
  status: string;
  players: {
    white: {
      user: {
        name: string;
        id: string;
      };
      rating: number;
    };
    black: {
      user: {
        name: string;
        id: string;
      };
      rating: number;
    };
  };
  winner?: 'white' | 'black';
  moves: string;
  pgn: string;
  opening?: {
    name: string;
    eco?: string;
  };
}

export interface ChessDotComGame {
  url: string;
  pgn: string;
  time_control: string;
  end_time: number;
  rated: boolean;
  white: {
    username: string;
    rating: number;
    result: string;
  };
  black: {
    username: string;
    rating: number;
    result: string;
  };
}

// Analysis API request/response types
export interface AnalysisRequest {
  pgn: string;
  colorToAnalysis?: 'White' | 'Black';
  username?: string;
}

export interface AnalysisResponse {
  criticalMoments: CriticalMoment[];
  error?: string;
}

// Audio types
export interface AudioRequest {
  text: string;
  voiceId?: string;
}

export interface AudioResponse {
  audioUrl: string;
  error?: string;
}

// Database types for Supabase
export interface Profile {
  id: string;
  username?: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  lichess_username?: string;
  chessdotcom_username?: string;
  preferred_platform?: 'lichess' | 'chessdotcom';
  created_at: string;
  updated_at: string;
}

export interface GameSession {
  id: string;
  user_id: string;
  timestamp: string;
  username: string;
  game_id: string;
  game_name?: string;
  voice_enabled: boolean;
  
  // Additional chess analysis fields
  platform?: 'lichess' | 'chessdotcom' | 'manual';
  pgn?: string;
  fen?: string;
  result?: string;
  white_player?: string;
  black_player?: string;
  white_rating?: number;
  black_rating?: number;
  time_control?: string;
  opening_name?: string;
  opening_eco?: string;
  analysis_completed: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface GameMoment {
  id: string;
  game_session_id: string;
  user_id: string;
  
  // Position information
  position_number: number;
  move_number: string;
  move_played?: string;
  fen: string;
  
  // Analysis data
  evaluation?: number;
  win_chance?: number;
  best_move?: string;
  opponents_best_move?: string;
  continuation?: string;
  full_line?: string;
  
  // Categorization
  phase?: 'opening' | 'middlegame' | 'endgame';
  moment_type?: 'blunder' | 'mistake' | 'inaccuracy' | 'good_move' | 'brilliant';
  reason?: string;
  analysis_text?: string;
  
  // Audio/Visual
  audio_url?: string;
  circle_annotation?: string;
  summary?: string;
  
  created_at: string;
}

export interface SavedMoment {
  id: string;
  user_id: string;
  game_moment_id: string;
  
  // User notes and tags
  user_notes?: string;
  tags?: string[];
  difficulty_rating?: number; // 1-5
  practice_count: number;
  last_practiced_at?: string;
  mastery_level?: 'learning' | 'practicing' | 'mastered';
  
  created_at: string;
  updated_at: string;
}

export interface CriticalMomentsView {
  id: string;
  game_session_id: string;
  user_id: string;
  username: string;
  game_name?: string;
  platform?: string;
  game_timestamp: string;
  position_number: number;
  move_number: string;
  move_played?: string;
  fen: string;
  evaluation?: number;
  win_chance?: number;
  best_move?: string;
  opponents_best_move?: string;
  continuation?: string;
  phase?: string;
  moment_type?: string;
  reason?: string;
  analysis_text?: string;
  audio_url?: string;
  summary?: string;
  is_saved: boolean;
  user_notes?: string;
  tags?: string[];
  difficulty_rating?: number;
  mastery_level?: string;
  created_at: string;
}

// Insert types (for creating new records)
export type GameSessionInsert = Omit<GameSession, 'id' | 'created_at' | 'updated_at'>;
export type GameMomentInsert = Omit<GameMoment, 'id' | 'created_at'>;
export type SavedMomentInsert = Omit<SavedMoment, 'id' | 'created_at' | 'updated_at'>;
export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'>;