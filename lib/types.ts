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