import axios from 'axios';
import { Game, LichessGame, ChessDotComGame, Platform } from '@/lib/types';

// Create optimized axios instance with timeout
const apiClient = axios.create({
  timeout: 10000, // 10 second timeout
});

// Simple memory cache for recent API calls
const gameCache = new Map<string, { data: Game[], timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

// Function to fetch games from Lichess API
export async function fetchLichessGames(username: string, maxGames: number = 50): Promise<Game[]> {
  // Check cache first
  const cacheKey = `lichess-${username}-${maxGames}`;
  const cached = gameCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Returning cached Lichess games');
    return cached.data;
  }

  try {
    const response = await apiClient.get(
      `https://lichess.org/api/games/user/${username}`,
      {
        params: {
          max: maxGames,
          // Removed pgnInJson and opening to reduce response size dramatically
          perfType: 'bullet,blitz,rapid,classical',
          ongoing: false,
        },
        headers: {
          'Accept': 'application/x-ndjson',
        },
      }
    );
    
    // Optimized NDJSON parsing
    const lines = response.data.split('\n');
    const games: LichessGame[] = [];
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          games.push(JSON.parse(line));
        } catch (e) {
          console.warn('Failed to parse line:', line);
        }
      }
    }
    
    // Process games and create minimal PGN from moves
    const processedGames = games.map((game: LichessGame) => {
      const white = game.players.white.user?.name || 'Anonymous';
      const black = game.players.black.user?.name || 'Anonymous';
      
      // Determine the result
      let result = 'Draw';
      if (game.winner === 'white') {
        result = '1-0';
      } else if (game.winner === 'black') {
        result = '0-1';
      } else {
        result = '½-½';
      }
      
      // Convert UTC timestamp to date string
      const date = new Date(game.createdAt).toISOString();
      
      // Create minimal PGN from moves (much faster than full PGN)
      const minimalPgn = createMinimalPgn(game.moves || '', white, black, result, date, game.id);
      
      return {
        id: game.id,
        white,
        black,
        result,
        date,
        moves: '', // Keep empty as before
        pgn: minimalPgn,
        whiteRating: game.players.white.rating,
        blackRating: game.players.black.rating,
        timeControl: game.speed,
        opening: game.opening?.name,
      };
    });

    // Cache the results
    gameCache.set(cacheKey, { data: processedGames, timestamp: Date.now() });
    
    return processedGames;
  } catch (error) {
    console.error('Error fetching Lichess games:', error);
    throw new Error('Failed to fetch games from Lichess');
  }
}

// Helper function to create minimal PGN from moves
function createMinimalPgn(moves: string, white: string, black: string, result: string, date: string, gameId: string): string {
  if (!moves.trim()) return '';
  
  const dateFormatted = new Date(date).toISOString().split('T')[0];
  
  // Create minimal PGN headers
  const headers = [
    `[Event "Lichess Game"]`,
    `[Site "https://lichess.org/${gameId}"]`,
    `[Date "${dateFormatted}"]`,
    `[White "${white}"]`,
    `[Black "${black}"]`,
    `[Result "${result}"]`,
    '',
    moves,
    ''
  ].join('\n');
  
  return headers;
}

// Function to fetch games from Chess.com API
export async function fetchChessDotComGames(username: string, maxGames: number = 50): Promise<Game[]> {
  // Check cache first
  const cacheKey = `chessdotcom-${username}-${maxGames}`;
  const cached = gameCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Returning cached Chess.com games');
    return cached.data;
  }

  try {
    // First, get the user's profile to check if username exists
    const profileResponse = await apiClient.get(
      `https://api.chess.com/pub/player/${username}`
    );
    
    // Get the archives (months with games)
    const archivesResponse = await apiClient.get(
      `https://api.chess.com/pub/player/${username}/games/archives`
    );
    
    const archives = archivesResponse.data.archives;
    if (!archives || !archives.length) {
      return [];
    }
    
    // Sort archives by date (most recent first)
    archives.sort().reverse();
    
    let allGames: ChessDotComGame[] = [];
    let gamesCollected = 0;
    
    // Fetch games from archives until we have enough
    for (const archiveUrl of archives) {
      if (gamesCollected >= maxGames) break;
      
      const archiveResponse = await apiClient.get(archiveUrl);
      const monthGames = archiveResponse.data.games || [];
      
      // Add games from this month
      allGames = [...allGames, ...monthGames];
      gamesCollected += monthGames.length;
      
      if (gamesCollected >= maxGames) {
        allGames = allGames.slice(0, maxGames);
        break;
      }
    }
    
    // Convert to our Game format
    const processedGames = allGames.map((game: ChessDotComGame) => {
      const white = game.white.username;
      const black = game.black.username;
      
      // Determine the result
      let result;
      if (game.white.result === 'win') {
        result = '1-0';
      } else if (game.black.result === 'win') {
        result = '0-1';
      } else {
        result = '½-½';
      }
      
      // Convert timestamp to date string
      const date = new Date(game.end_time * 1000).toISOString();
      
      // Generate a unique ID
      const id = game.url.split('/').pop() || `chessdotcom_${Date.now()}`;
      
      return {
        id,
        white,
        black,
        result,
        date,
        moves: '', // Empty since components use pgn directly
        pgn: game.pgn,
        whiteRating: game.white.rating,
        blackRating: game.black.rating,
        timeControl: game.time_control,
      };
    });

    // Cache the results
    gameCache.set(cacheKey, { data: processedGames, timestamp: Date.now() });
    
    return processedGames;
  } catch (error) {
    console.error('Error fetching Chess.com games:', error);
    throw new Error('Failed to fetch games from Chess.com');
  }
}

// Function to fetch games based on platform
export async function fetchGamesByPlatform(username: string, platform: Platform, maxGames: number = 50): Promise<Game[]> {
  if (platform === 'lichess') {
    return fetchLichessGames(username, maxGames);
  } else {
    return fetchChessDotComGames(username, maxGames);
  }
}