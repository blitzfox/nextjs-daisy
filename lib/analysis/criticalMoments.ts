import axios from 'axios';
import { CriticalMoment, AnalysisRequest, AnalysisResponse } from '@/lib/types';
import { Chess } from 'chess.js';

// Function to extract FEN positions from moves
export function extractPositionsFromMoves(moves: string): string[] {
  try {
    const chess = new Chess();
    const positions: string[] = [chess.fen()]; // Starting position
    
    // Check if this is a full PGN or just moves
    let moveList: string[] = [];
    
    if (moves.includes('[Event') || moves.includes('[Site')) {
      // This is a full PGN, need to extract moves
      try {
        // Load the PGN to extract moves properly
        chess.loadPgn(moves);
        // Get the move history
        const history = chess.history();
        chess.reset(); // Reset to starting position
        
        // Apply moves one by one to build positions
        for (const move of history) {
          chess.move(move);
          positions.push(chess.fen());
        }
        
        return positions;
      } catch (pgnError) {
        console.error('Error loading PGN:', pgnError);
        return positions; // Return just starting position
      }
    } else {
      // This is just moves, process as before
      moveList = moves.trim().split(/\s+/);
    }
    
    for (const move of moveList) {
      if (!move.trim()) continue; // Skip empty moves
      
      try {
        chess.move(move);
        positions.push(chess.fen());
      } catch (e) {
        console.error(`Invalid move: ${move}`);
        // Continue with next move
      }
    }
    
    return positions;
  } catch (error) {
    console.error('Error extracting positions from moves:', error);
    return [];
  }
}

// Function to determine which color the user is playing
export function determinePlayerColor(pgn: string, username: string): 'White' | 'Black' | undefined {
  // Extract player names from PGN
  const whiteMatch = pgn.match(/\[White\s+"([^"]+)"/);
  const blackMatch = pgn.match(/\[Black\s+"([^"]+)"/);
  
  if (!whiteMatch || !blackMatch) return undefined;
  
  const whiteName = whiteMatch[1];
  const blackName = blackMatch[1];
  
  if (whiteName.toLowerCase() === username.toLowerCase()) {
    return 'White';
  } else if (blackName.toLowerCase() === username.toLowerCase()) {
    return 'Black';
  }
  
  return undefined;
}

// Function to send game to OpenAI for analysis
export async function analyzeCriticalMoments(
  moves: string,
  username?: string,
  colorToAnalysis?: 'White' | 'Black'
): Promise<CriticalMoment[]> {
  try {
    // Extract FEN positions from moves
    const positions = extractPositionsFromMoves(moves);
    
    if (positions.length < 10) {
      throw new Error('Game is too short to analyze');
    }
    
    // Check if this is already a PGN or just moves
    let pgn: string;
    
    if (moves.includes('[Event') || moves.includes('[Site')) {
      // This is already a PGN
      pgn = moves;
    } else {
      // This is just moves, create a PGN
      const chess = new Chess();
      const moveList = moves.trim().split(/\s+/);
      for (const move of moveList) {
        if (!move.trim()) continue;
        try {
          chess.move(move);
        } catch (e) {
          console.error(`Invalid move: ${move}`);
        }
      }
      pgn = chess.pgn();
    }
    
    // If color not specified but username is, try to determine it
    if (!colorToAnalysis && username) {
      colorToAnalysis = determinePlayerColor(pgn, username);
    }
    
    // Send to API for analysis
    const response = await axios.post<AnalysisResponse>('/api/analysis/critical-moments', {
      pgn,
      colorToAnalysis,
      username
    } as AnalysisRequest);
    
    if (response.data.error) {
      throw new Error(response.data.error);
    }
    
    // Process and return critical moments
    return processCriticalMoments(response.data.criticalMoments, positions);
  } catch (error) {
    console.error('Error analyzing critical moments:', error);
    throw error;
  }
}

// Process critical moments to add position indices
function processCriticalMoments(
  moments: CriticalMoment[],
  positions: string[]
): CriticalMoment[] {
  return moments.map((moment, index) => {
    // Calculate position index from move number
    const moveNumber = moment.moveNumber;
    let positionIndex = 0;
    
    // Parse move number (e.g., "15" or "15...")
    if (typeof moveNumber === 'string') {
      const match = moveNumber.match(/(\d+)(\.{3})?/);
      if (match) {
        const num = parseInt(match[1], 10);
        const isBlack = match[2] === '...';
        
        // Calculate position
        positionIndex = isBlack ? num * 2 : (num * 2) - 1;
      }
    } else if (typeof moveNumber === 'number') {
      // If it's just a number, assume it's a full move number
      positionIndex = (moveNumber * 2) - 1;
    }
    
    // Ensure position index is within bounds
    positionIndex = Math.min(positionIndex, positions.length - 1);
    positionIndex = Math.max(positionIndex, 0);
    
    // Add circle highlighting for board visualization
    let circle = '';
    // Extract square from moveInfo (e.g., "Move 15. e4" -> "e4")
    const moveMatch = moment.moveInfo.match(/[KQRBN]?[a-h][1-8]/);
    if (moveMatch) {
      circle = moveMatch[0].slice(-2); // Extract just the square part (e.g., "e4")
    }
    
    return {
      ...moment,
      id: index + 1,
      position: positionIndex,
      circle
    };
  });
}