'use client';

import React, { useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

interface MiniChessBoardProps {
  fen: string;
  bestMove?: string;
  size?: number;
  showCoordinates?: boolean;
  orientation?: 'white' | 'black';
  className?: string;
  theme?: 'default' | 'mini' | 'analysis' | 'blue';
  showMoveLabel?: boolean;
  playBestMove?: boolean;
}

const MiniChessBoard: React.FC<MiniChessBoardProps> = ({
  fen,
  bestMove,
  size = 200,
  showCoordinates = false,
  orientation = 'white',
  className = '',
  theme = 'default',
  showMoveLabel = true,
  playBestMove = false
}) => {
  // Theme-based styling
  const getThemeStyles = (): Record<string, string | number> => {
    switch (theme) {
      case 'mini':
        return {
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          border: '2px solid #e2e8f0'
        };
      case 'analysis':
        return {
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          border: '1px solid #cbd5e1'
        };
      case 'blue':
        return {
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
          border: '1px solid #93c5fd'
        };
      default:
        return {
          borderRadius: '4px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        };
    }
  };

  const themeStyles = getThemeStyles();

  // Get custom square colors based on theme
  const getCustomSquareColors = () => {
    if (theme === 'blue') {
      return {
        customLightSquareStyle: { backgroundColor: '#93c5fd' }, // blue-300 (darker)
        customDarkSquareStyle: { backgroundColor: '#3b82f6' }   // blue-500 (much darker)
      };
    }
    return {}; // Use default colors for other themes
  };

  const customSquareColors = getCustomSquareColors();

  // Get position after playing the best move
  const getPositionAfterBestMove = useMemo(() => {
    if (!bestMove || !fen || !playBestMove) {
      return fen; // Return original position if not playing best move
    }

    try {
      const chess = new Chess(fen);
      
      // Try to play the best move
      const move = chess.move(bestMove);
      if (move) {
        return chess.fen(); // Return position after best move
      }
      
      console.warn('Could not play best move:', bestMove);
      return fen; // Return original position if move fails
    } catch (error) {
      console.warn('Error playing best move:', bestMove, error);
      return fen; // Return original position on error
    }
  }, [bestMove, fen, playBestMove]);

  // Parse best move to highlight squares - only when not playing the move
  const highlightSquares = useMemo(() => {
    const squares: Record<string, React.CSSProperties> = {};
    
    // Only highlight squares if we're not playing the best move
    if (bestMove && fen && !playBestMove) {
      try {
        const chess = new Chess(fen);
        
        // Try to parse the move in different formats
        let fromSquare = '';
        let toSquare = '';
        
        if (bestMove.length >= 4 && /^[a-h][1-8][a-h][1-8]/.test(bestMove)) {
          // UCI format: e.g., "e2e4"
          fromSquare = bestMove.substring(0, 2);
          toSquare = bestMove.substring(2, 4);
        } else {
          // Try chess notation format: e.g., "f4", "Nf3", "Bxc4"
          try {
            const move = chess.move(bestMove);
            if (move) {
              fromSquare = move.from;
              toSquare = move.to;
              chess.undo(); // Undo the move since we just wanted to parse it
            }
          } catch (e) {
            // If move parsing fails, try to extract squares manually for simple moves
            const simpleMove = bestMove.replace(/[+#!?]/g, '').trim();
            if (/^[a-h][1-8]$/.test(simpleMove)) {
              // Simple pawn move like "f4"
              toSquare = simpleMove;
              // Try to find the from square by looking at legal moves
              const legalMoves = chess.moves({ verbose: true });
              const matchingMove = legalMoves.find(m => m.to === toSquare && m.san === bestMove.replace(/[+#!?]/g, ''));
              if (matchingMove) {
                fromSquare = matchingMove.from;
              }
            }
          }
        }
        
        // Validate squares are valid chess squares
        if (/^[a-h][1-8]$/.test(fromSquare) && /^[a-h][1-8]$/.test(toSquare)) {
          // Highlight from square with blue
          squares[fromSquare] = {
            backgroundColor: 'rgba(59, 130, 246, 0.4)',
            borderRadius: '50%',
            boxShadow: 'inset 0 0 0 3px #3b82f6',
          };
          
          // Highlight to square with green
          squares[toSquare] = {
            backgroundColor: 'rgba(34, 197, 94, 0.4)',
            borderRadius: '50%',
            boxShadow: 'inset 0 0 0 3px #22c55e',
          };
        }
      } catch (error) {
        console.warn('Error parsing best move:', bestMove, error);
      }
    }
    
    return squares;
  }, [bestMove, fen, playBestMove]);

  // Validate FEN
  const isValidFen = useMemo(() => {
    try {
      const chess = new Chess(getPositionAfterBestMove);
      return true;
    } catch {
      return false;
    }
  }, [getPositionAfterBestMove]);

  if (!isValidFen) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 border border-gray-300 rounded ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-xs text-gray-500">Invalid Position</span>
      </div>
    );
  }

  return (
    <div 
      className={`mini-chess-board ${theme === 'analysis' ? 'analysis-theme' : ''} ${className}`} 
      style={{ width: size, height: size + (bestMove && showMoveLabel ? 20 : 0) }}
    >
      <div 
        className={theme === 'analysis' ? 'analysis-board-wrapper' : ''}
        style={theme === 'analysis' ? { 
          background: 'linear-gradient(145deg, #f8fafc, #f1f5f9)',
          padding: '8px',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        } : {}}
      >
        <Chessboard
          id={`mini-board-${Math.random()}`}
          position={getPositionAfterBestMove}
          customSquareStyles={highlightSquares}
          arePiecesDraggable={false}
          boardOrientation={orientation}
          showBoardNotation={showCoordinates}
          animationDuration={0}
          customBoardStyle={theme === 'analysis' ? { borderRadius: '6px' } : themeStyles}
          {...customSquareColors}
        />
      </div>
      
      {bestMove && showMoveLabel && (
        <div className={`mt-1 text-center ${theme === 'analysis' ? 'analysis-move-label' : ''}`}>
          <span className={`text-xs font-mono ${theme === 'analysis' ? 'text-slate-600 font-semibold' : theme === 'blue' ? 'text-blue-700 font-semibold' : 'text-gray-600'}`}>
            {playBestMove ? `Played: ${bestMove}` : `Best: ${bestMove}`}
          </span>
        </div>
      )}
      
      <style jsx>{`
        .mini-chess-board {
          display: inline-block;
        }
        
        .analysis-theme {
          background: linear-gradient(145deg, #f8fafc, #f1f5f9);
          border-radius: 12px;
          padding: 4px;
        }
        
        .analysis-move-label {
          background: rgba(255, 255, 255, 0.8);
          border-radius: 4px;
          padding: 2px 6px;
          margin-top: 4px;
        }
        
        .mini-chess-board :global(.coordinate-light),
        .mini-chess-board :global(.coordinate-dark) {
          font-size: 10px !important;
          font-weight: 600 !important;
          color: #ffffff !important;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8) !important;
        }
        
        /* More aggressive coordinate styling */
        .mini-chess-board :global([class*="coordinate"]) {
          font-size: 11px !important;
          font-weight: 700 !important;
          color: #ffffff !important;
          text-shadow: 0 0 3px rgba(0, 0, 0, 0.9), 1px 1px 2px rgba(0, 0, 0, 0.8) !important;
          background: rgba(0, 0, 0, 0.2) !important;
          padding: 1px 2px !important;
          border-radius: 2px !important;
        }
        
        /* Target any text elements on the board that might be coordinates */
        .mini-chess-board :global(div) :global(div) :global(div) {
          font-size: 11px !important;
          font-weight: 700 !important;
          color: #ffffff !important;
          text-shadow: 0 0 3px rgba(0, 0, 0, 0.9) !important;
        }
      `}</style>
    </div>
  );
};

export default MiniChessBoard;