'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

interface ChessBoardProps {
  fen: string;
  position: number;
  circle?: string;
  pgn?: string;
  whitePlayer?: string;
  blackPlayer?: string;
  onMoveChange?: (moveIndex: number) => void;
}

const ChessBoard: React.FC<ChessBoardProps> = ({ 
  fen, 
  position = 0, 
  circle = '', 
  pgn = '',
  whitePlayer = 'White',
  blackPlayer = 'Black',
  onMoveChange
}) => {
  const [game, setGame] = useState<Chess>(new Chess());
  const [currentPosition, setCurrentPosition] = useState<string>('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');

  // Initialize game from PGN
  useEffect(() => {
    const newGame = new Chess();
    
    if (pgn) {
      try {
        newGame.loadPgn(pgn);
        const history = newGame.history();
        setMoveHistory(history);
        
        // Reset to starting position initially
        newGame.reset();
        setGame(newGame);
        setCurrentPosition(newGame.fen());
        setCurrentMoveIndex(-1);
      } catch (error) {
        console.error('Error loading PGN:', error);
        setGame(newGame);
        setCurrentPosition(newGame.fen());
        setMoveHistory([]);
        setCurrentMoveIndex(-1);
      }
    } else {
      setGame(newGame);
      setCurrentPosition(newGame.fen());
      setMoveHistory([]);
      setCurrentMoveIndex(-1);
    }
  }, [pgn]);

  // Navigate to specific move
  const jumpToMove = useCallback((moveIndex: number) => {
    if (moveIndex < -1 || moveIndex >= moveHistory.length) return;
    
    const newGame = new Chess();
    
    // Play moves up to the target index
    for (let i = 0; i <= moveIndex; i++) {
      try {
        newGame.move(moveHistory[i]);
      } catch (error) {
        console.error('Error making move:', moveHistory[i], error);
        return;
      }
    }
    
    setGame(newGame);
    setCurrentPosition(newGame.fen());
    setCurrentMoveIndex(moveIndex);
    onMoveChange?.(moveIndex + 1);
  }, [moveHistory, onMoveChange]);

  // Handle position changes from parent
  useEffect(() => {
    if (position !== currentMoveIndex + 1) {
      const targetIndex = position - 1;
      jumpToMove(targetIndex);
    }
  }, [position, currentMoveIndex, jumpToMove]);

  // Navigation functions
  const goToStart = useCallback(() => {
    const newGame = new Chess();
    setGame(newGame);
    setCurrentPosition(newGame.fen());
    setCurrentMoveIndex(-1);
    onMoveChange?.(0);
  }, [onMoveChange]);

  const goBackOne = useCallback(() => {
    if (currentMoveIndex > -1) {
      jumpToMove(currentMoveIndex - 1);
    }
  }, [currentMoveIndex, jumpToMove]);

  const goForwardOne = useCallback(() => {
    if (currentMoveIndex < moveHistory.length - 1) {
      jumpToMove(currentMoveIndex + 1);
    }
  }, [currentMoveIndex, moveHistory.length, jumpToMove]);

  const goToEnd = useCallback(() => {
    if (moveHistory.length > 0) {
      jumpToMove(moveHistory.length - 1);
    }
  }, [moveHistory.length, jumpToMove]);

  const resetBoard = useCallback(() => {
    const newGame = new Chess();
    setGame(newGame);
    setCurrentPosition(newGame.fen());
    setMoveHistory([]);
    setCurrentMoveIndex(-1);
    onMoveChange?.(0);
  }, [onMoveChange]);

  const toggleBoard = useCallback(() => {
    setBoardOrientation(prev => prev === 'white' ? 'black' : 'white');
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        goBackOne();
      } else if (event.key === 'ArrowRight') {
        goForwardOne();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [goBackOne, goForwardOne]);

  // Parse circle notation and create custom square styles
  const customSquareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};
    
    if (circle) {
      try {
        const squaresToCircle = circle.split(',').map(s => s.trim());
        
        squaresToCircle.forEach(square => {
          if (square.length === 2 && /^[a-h][1-8]$/.test(square)) {
            styles[square] = {
              borderRadius: '50%',
              boxShadow: 'inset 0 0 0 3px #15781B',
              zIndex: 1,
              position: 'relative',
            };
          }
        });
      } catch (e) {
        console.error('Error parsing circle notation:', e);
      }
    }
    
    return styles;
  }, [circle]);

  // Get current player names based on board orientation
  const currentWhitePlayer = boardOrientation === 'white' ? whitePlayer : blackPlayer;
  const currentBlackPlayer = boardOrientation === 'white' ? blackPlayer : whitePlayer;

  // Helper function to get move classification
  const getMoveClass = (move: string, index: number) => {
    const classes = ['move-cell'];
    
    if (currentMoveIndex === index) classes.push('current-move');
    if (index % 2 === 0) classes.push('white-move');
    else classes.push('black-move');
    if (move.includes('+')) classes.push('check-move');
    if (move.includes('#')) classes.push('checkmate-move');
    if (move.includes('x')) classes.push('capture-move');
    if (move.includes('O-O')) classes.push('castle-move');
    
    return classes.join(' ');
  };

  return (
    <div className="chess-board-container">
      {/* Player name - Black (top) */}
      <div className="player-name black-player">
        <span className="piece-icon">♛</span>
        <span className="player-name-text">{currentBlackPlayer}</span>
        <span className="player-color-indicator">Black</span>
      </div>
      
      {/* Chess Board */}
      <div className="chess-board">
        <Chessboard 
          id="chess-analysis-board"
          position={currentPosition}
          customSquareStyles={customSquareStyles}
          areArrowsAllowed={true}
          arePiecesDraggable={false}
          boardOrientation={boardOrientation}
          animationDuration={200}
          showBoardNotation={true}
          customBoardStyle={{
            borderRadius: '4px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
          }}
        />
      </div>
      
      {/* Player name - White (bottom) */}
      <div className="player-name white-player">
        <span className="piece-icon">♕</span>
        <span className="player-name-text">{currentWhitePlayer}</span>
        <span className="player-color-indicator">White</span>
      </div>
      
      {/* Controls */}
      <div className="controls-row">
        <div className="left-controls">
          <button className="reset-button" onClick={resetBoard}>Reset Board</button>
          <button className="toggle-board-button" onClick={toggleBoard} title="Flip board">⇅</button>
        </div>
        <div className="navigation-controls">
          <button onClick={goToStart} title="Go to start" disabled={currentMoveIndex === -1}>◀◀</button>
          <button onClick={goBackOne} title="Previous move" disabled={currentMoveIndex === -1}>◀</button>
          <button onClick={goForwardOne} title="Next move" disabled={currentMoveIndex >= moveHistory.length - 1}>▶</button>
          <button onClick={goToEnd} title="Go to end" disabled={currentMoveIndex >= moveHistory.length - 1}>▶▶</button>
        </div>
      </div>
      
      {/* Move History */}
      <div className="game-info-container">
        <div className="move-history-section">
          <div className="move-history-header">
            <h3 className="move-history-title">Move History</h3>
            <div className="move-counter">
              {currentMoveIndex === -1 ? (
                'Starting Position'
              ) : (
                `${currentMoveIndex % 2 === 0 ? 'White' : 'Black'} Move ${Math.floor(currentMoveIndex / 2) + 1} of ${Math.ceil(moveHistory.length / 2)}`
              )}
            </div>
          </div>
          
          {moveHistory.length > 0 ? (
            <>
              {/* Column Headers */}
              <div className="move-history-column-headers">
                <div className="header-move-number">#</div>
                <div className="header-white">White</div>
                <div className="header-black">Black</div>
              </div>
              
              {/* Move Grid */}
              <div className="move-history-grid">
                {moveHistory.map((move, index) => (
                  <React.Fragment key={index}>
                    {/* Move number for white moves */}
                    {index % 2 === 0 && (
                      <div className="move-number">
                        {Math.floor(index / 2) + 1}.
                      </div>
                    )}
                    
                    {/* Move notation */}
                    <div 
                      className={getMoveClass(move, index)}
                      onClick={() => jumpToMove(index)}
                      title={`Move ${index + 1}: ${move}`}
                    >
                      {move}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </>
          ) : (
            <div className="no-moves">No moves yet. Load a PGN to see move history!</div>
          )}
        </div>
        
        {/* Move Legend */}
        <div className="move-legend-section">
          <h4 className="legend-title">Move Legend</h4>
          <div className="legend-grid">
            <div className="legend-item">
              <span className="legend-example current-move-example">Nf3</span>
              <span className="legend-description">Current position</span>
            </div>
            <div className="legend-item">
              <span className="legend-example check-move-example">Qh5+</span>
              <span className="legend-description">Check</span>
            </div>
            <div className="legend-item">
              <span className="legend-example checkmate-move-example">Qf7#</span>
              <span className="legend-description">Checkmate</span>
            </div>
            <div className="legend-item">
              <span className="legend-example capture-move-example">Nxe5</span>
              <span className="legend-description">Capture</span>
            </div>
            <div className="legend-item">
              <span className="legend-example castle-move-example">O-O</span>
              <span className="legend-description">Castling</span>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .chess-board-container {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          position: relative;
        }

        .chess-board {
          width: 100%;
          display: flex;
          justify-content: center;
          margin-bottom: 6px;
        }

        .player-name {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 8px 16px;
          font-weight: 600;
          font-size: 0.95em;
          border-radius: 8px;
          margin: 0 auto 8px auto;
          width: fit-content;
          min-width: 200px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          border: 2px solid transparent;
          transition: all 0.2s ease;
        }

        .black-player {
          background: linear-gradient(135deg, #2c2c2c, #1a1a1a);
          color: #ffffff;
          border-color: #444;
          margin-bottom: 8px;
        }

        .white-player {
          background: linear-gradient(135deg, #ffffff, #f8f9fa);
          color: #1a1a1a;
          border-color: #e9ecef;
          margin-top: 8px;
          margin-bottom: 12px;
        }

        .piece-icon {
          font-size: 1.2em;
          font-weight: bold;
        }

        .player-name-text {
          font-weight: 600;
          flex: 1;
          text-align: center;
        }

        .player-color-indicator {
          font-size: 0.75em;
          font-weight: 500;
          opacity: 0.8;
          padding: 2px 6px;
          border-radius: 4px;
          background-color: rgba(255,255,255,0.1);
        }

        .white-player .player-color-indicator {
          background-color: rgba(0,0,0,0.1);
        }

        .controls-row {
          margin-top: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .left-controls {
          display: flex;
          gap: 5px;
        }

        .reset-button, .toggle-board-button {
          padding: 6px 10px;
          border-radius: 4px;
          background-color: #f0f0f0;
          border: 1px solid #ddd;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.2s ease;
          font-size: 0.85em;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #222;
        }

        .reset-button:hover, .toggle-board-button:hover {
          background-color: #e0e0e0;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .navigation-controls {
          display: flex;
          gap: 5px;
        }

        .navigation-controls button {
          padding: 6px 10px;
          border-radius: 4px;
          background-color: #f0f0f0;
          border: 1px solid #ddd;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.2s ease;
          min-width: 36px;
          font-size: 0.85em;
          color: #222;
        }

        .navigation-controls button:hover:not(:disabled) {
          background-color: #e0e0e0;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .navigation-controls button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .game-info-container {
          margin-top: 16px;
          background-color: #f8f8f8;
          border-radius: 8px;
          padding: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .move-history-section {
          margin-bottom: 16px;
        }

        .move-history-header {
          margin-bottom: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .move-history-title {
          margin: 0;
          color: #333;
          font-size: 1.1em;
          font-weight: 600;
        }

        .move-counter {
          font-size: 0.85em;
          color: #666;
          background-color: #e9ecef;
          padding: 3px 6px;
          border-radius: 4px;
          font-weight: 600;
        }

        .move-history-column-headers {
          display: grid;
          grid-template-columns: auto 1fr 1fr;
          gap: 4px 8px;
          padding: 8px 12px;
          background-color: #f8f9fa;
          border: 1px solid #e0e0e0;
          border-bottom: none;
          border-radius: 6px 6px 0 0;
          font-weight: 600;
          font-size: 1em;
          color: #495057;
        }

        .header-move-number {
          text-align: right;
          padding-right: 8px;
          color: #6c757d;
        }

        .header-white {
          text-align: center;
          color: #007bff;
        }

        .header-black {
          text-align: center;
          color: #000000;
        }

        .move-history-grid {
          display: grid;
          grid-template-columns: auto 1fr 1fr;
          gap: 4px 8px;
          padding: 12px;
          border: 1px solid #e0e0e0;
          border-radius: 0 0 6px 6px;
          max-height: 300px;
          overflow-y: auto;
          font-family: 'Roboto Mono', monospace;
          line-height: 1.4;
          background-color: white;
        }

        .move-number {
          color: #888;
          font-size: 1em;
          font-weight: 600;
          text-align: right;
          padding-right: 8px;
          min-height: 24px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }

        .move-cell {
          font-weight: 500;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.2s ease;
          text-align: center;
          min-height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1em;
          background-color: #ffffff;
          border: 1px solid #e9ecef;
        }

        .move-cell:hover {
          background-color: #f0f0f0;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .current-move {
          background-color: #2196F3 !important;
          color: white !important;
          font-weight: bold;
          box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
        }

        .check-move {
          border: 2px solid #ffc107;
          font-weight: bold;
        }

        .checkmate-move {
          border: 2px solid #dc3545;
          font-weight: bold;
          background-color: #f8d7da !important;
          color: #721c24 !important;
        }

        .capture-move {
          font-weight: bold;
          position: relative;
        }

        .capture-move::after {
          content: '×';
          position: absolute;
          top: -2px;
          right: 2px;
          font-size: 0.7em;
          color: #dc3545;
        }

        .castle-move {
          font-weight: bold;
          background: linear-gradient(45deg, #f3e5f5, #e1bee7);
          border: 1px solid #9c27b0;
          color: #4a148c;
        }

        .no-moves {
          text-align: center;
          padding: 20px;
          color: #888;
          font-style: italic;
        }

        .move-legend-section {
          margin-top: 20px;
        }

        .legend-title {
          margin-bottom: 10px;
          font-size: 1.2em;
          font-weight: 600;
          color: #333;
        }

        .legend-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 10px;
        }

        .legend-item {
          display: flex;
          align-items: center;
        }

        .legend-example {
          font-weight: 500;
          margin-right: 10px;
          padding: 4px 8px;
          border-radius: 4px;
          min-width: 50px;
          text-align: center;
          font-family: 'Roboto Mono', monospace;
          font-size: 1em;
          border: 1px solid #e9ecef;
          background-color: #ffffff;
        }

        .legend-description {
          color: #666;
          font-size: 0.9em;
        }

        .current-move-example {
          background-color: #2196F3 !important;
          color: white !important;
          font-weight: bold;
          box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
        }

        .check-move-example {
          border: 2px solid #ffc107;
          font-weight: bold;
        }

        .checkmate-move-example {
          border: 2px solid #dc3545;
          font-weight: bold;
          background-color: #f8d7da !important;
          color: #721c24 !important;
        }

        .capture-move-example {
          font-weight: bold;
          position: relative;
        }

        .capture-move-example::after {
          content: '×';
          position: absolute;
          top: -2px;
          right: 2px;
          font-size: 0.7em;
          color: #dc3545;
        }

        .castle-move-example {
          font-weight: bold;
          background: linear-gradient(45deg, #f3e5f5, #e1bee7);
          border: 1px solid #9c27b0;
          color: #4a148c;
        }

        .move-history-grid::-webkit-scrollbar {
          width: 8px;
        }

        .move-history-grid::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        .move-history-grid::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 4px;
        }

        .move-history-grid::-webkit-scrollbar-thumb:hover {
          background: #bbb;
        }
      `}</style>
    </div>
  );
};

export default ChessBoard;