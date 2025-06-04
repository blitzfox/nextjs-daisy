import axios from 'axios';
import { Game, LichessGame, ChessDotComGame, Platform } from '@/lib/types';

// Function to fetch games from Lichess API
export async function fetchLichessGames(username: string, maxGames: number = 40): Promise<Game[]> {
  try {
    const response = await axios.get(
      `https://lichess.org/api/games/user/${username}`,
      {
        params: {
          max: maxGames,
          pgnInJson: true,
          opening: true,
          perfType: 'bullet,blitz,rapid,classical',
          ongoing: false,
        },
        headers: {
          'Accept': 'application/x-ndjson',
        },
      }
    );
    
    // Lichess returns ndjson (newline delimited JSON)
    const games = response.data
      .split('\n')
      .filter((line: string) => line.trim() !== '')
      .map((line: string) => JSON.parse(line));
    
    return games.map((game: LichessGame) => {
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
      
      // Parse PGN to extract moves
      const moves = extractMovesFromPgn(game.pgn);
      
      return {
        id: game.id,
        white,
        black,
        result,
        date,
        moves,
        pgn: game.pgn,
        whiteRating: game.players.white.rating,
        blackRating: game.players.black.rating,
        timeControl: game.speed,
        opening: game.opening?.name,
      };
    });
  } catch (error) {
    console.error('Error fetching Lichess games:', error);
    throw new Error('Failed to fetch games from Lichess');
  }
}

// Function to fetch games from Chess.com API
export async function fetchChessDotComGames(username: string, maxGames: number = 40): Promise<Game[]> {
  try {
    // First, get the user's profile to check if username exists
    const profileResponse = await axios.get(
      `https://api.chess.com/pub/player/${username}`
    );
    
    // Get the archives (months with games)
    const archivesResponse = await axios.get(
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
      
      const archiveResponse = await axios.get(archiveUrl);
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
    return allGames.map((game: ChessDotComGame) => {
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
      
      // Parse PGN to extract moves
      const moves = extractMovesFromPgn(game.pgn);
      
      // Generate a unique ID
      const id = game.url.split('/').pop() || `chessdotcom_${Date.now()}`;
      
      return {
        id,
        white,
        black,
        result,
        date,
        moves,
        pgn: game.pgn,
        whiteRating: game.white.rating,
        blackRating: game.black.rating,
        timeControl: game.time_control,
      };
    });
  } catch (error) {
    console.error('Error fetching Chess.com games:', error);
    throw new Error('Failed to fetch games from Chess.com');
  }
}

// Helper function to extract moves from PGN
function extractMovesFromPgn(pgn: string): string {
  // Remove headers
  const withoutHeaders = pgn.replace(/\[\s*.*?\s*".*?"\s*\]\s*\n?/g, '').trim();
  
  // Remove move numbers, annotations, and comments
  const movesOnly = withoutHeaders
    .replace(/\{[^}]*\}/g, '') // Remove comments in curly braces
    .replace(/\([^)]*\)/g, '') // Remove variations in parentheses
    .replace(/\d+\.\s*/g, '') // Remove move numbers
    .replace(/\$\d+/g, '') // Remove NAG symbols
    .replace(/[!?]+/g, '') // Remove evaluation symbols
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  return movesOnly;
}

// Function to fetch games based on platform
export async function fetchGamesByPlatform(username: string, platform: Platform, maxGames: number = 40): Promise<Game[]> {
  if (platform === 'lichess') {
    return fetchLichessGames(username, maxGames);
  } else {
    return fetchChessDotComGames(username, maxGames);
  }
}