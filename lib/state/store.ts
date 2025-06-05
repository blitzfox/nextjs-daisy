import { create } from 'zustand';
import { fetchLichessGames, fetchChessDotComGames } from '@/lib/api-clients/games';
import { Game, CriticalMoment, Platform } from '@/lib/types';

// Helper function to count moves from PGN
const countMovesFromPGN = (pgn: string): number => {
  if (!pgn) return 0;
  
  try {
    // Remove PGN headers (lines starting with [)
    const gameText = pgn.split('\n')
      .filter(line => !line.trim().startsWith('['))
      .join(' ')
      .trim();
    
    // Remove game result (1-0, 0-1, 1/2-1/2, *)
    const cleanText = gameText.replace(/\s*(1-0|0-1|1\/2-1\/2|\*)\s*$/, '');
    
    // Split by spaces and filter out move numbers, comments, and empty strings
    const tokens = cleanText.split(/\s+/)
      .filter(token => {
        // Skip empty tokens
        if (!token) return false;
        // Skip move numbers (e.g., "1.", "2.", etc.)
        if (/^\d+\.+$/.test(token)) return false;
        // Skip comments in curly braces
        if (token.startsWith('{') || token.endsWith('}')) return false;
        // Skip variations in parentheses
        if (token.startsWith('(') || token.endsWith(')')) return false;
        return true;
      });
    
    return tokens.length;
  } catch (error) {
    console.error('Error counting moves from PGN:', error);
    return 0;
  }
};

interface ChessState {
  // User info
  username: string;
  platform: Platform;
  sessionUuid: string;
  
  // Game data
  games: Game[];
  selectedGame: Game | null;
  currentGameMoves: string;
  
  // Analysis data
  criticalMoments: CriticalMoment[];
  startingPosition: number;
  circles: Record<number, string>;
  audioClips: string[];
  voiceAnalysisEnabled: boolean;
  moveHistory: string[];
  
  // UI state
  isLoading: boolean;
  message: string;
  
  // Actions
  setUsername: (username: string) => void;
  setPlatform: (platform: Platform) => void;
  fetchGames: (username: string, platform: Platform) => Promise<Game[]>;
  selectGame: (game: Game) => void;
  setCriticalMoments: (moments: CriticalMoment[]) => void;
  setStartingPosition: (position: number) => void;
  setCircles: (circles: Record<number, string>) => void;
  setAudioClips: (clips: string[]) => void;
  setVoiceAnalysisEnabled: (enabled: boolean) => void;
  setMessage: (message: string) => void;
  setMoveHistory: (moves: string[]) => void;
}

export const useChessStore = create<ChessState>((set, get) => ({
  // User info
  username: '',
  platform: 'lichess',
  sessionUuid: typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  
  // Game data
  games: [],
  selectedGame: null,
  currentGameMoves: '',
  
  // Analysis data
  criticalMoments: [],
  startingPosition: 0,
  circles: {},
  audioClips: [],
  voiceAnalysisEnabled: false,
  moveHistory: [],
  
  // UI state
  isLoading: false,
  message: 'Welcome to Grandmaster AI Agent!',
  
  // Actions
  setUsername: (username) => set({ username }),
  
  setPlatform: (platform) => set({ platform }),
  
  fetchGames: async (username, platform) => {
    set({ isLoading: true, message: 'Fetching games...' });
    
    try {
      let games: Game[] = [];
      
      if (platform === 'lichess') {
        games = await fetchLichessGames(username);
      } else {
        games = await fetchChessDotComGames(username);
      }
      
      set({ 
        games,
        isLoading: false,
        message: games.length > 0 
          ? 'Select a game to analyze' 
          : 'No games found. Try another username.'
      });
      
      return games;
    } catch (error) {
      console.error('Error fetching games:', error);
      set({ 
        isLoading: false, 
        message: 'Error fetching games. Please try again.' 
      });
      throw error;
    }
  },
  
  selectGame: (game) => {
    const finalPosition = countMovesFromPGN(game.pgn);
    set({ 
      selectedGame: game,
      currentGameMoves: game.moves,
      startingPosition: finalPosition,
      criticalMoments: [],
      circles: {},
      audioClips: [],
      message: 'Game selected. Click "Analyze" to start.'
    });
  },
  
  setCriticalMoments: (moments) => set({ criticalMoments: moments }),
  
  setStartingPosition: (position) => set({ startingPosition: position }),
  
  setCircles: (circles) => set({ circles }),
  
  setAudioClips: (clips) => set({ audioClips: clips }),
  
  setVoiceAnalysisEnabled: (enabled) => set({ voiceAnalysisEnabled: enabled }),
  
  setMessage: (message) => set({ message }),
  
  setMoveHistory: (moves) => set({ moveHistory: moves })
}));