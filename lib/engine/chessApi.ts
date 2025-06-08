interface PositionAnalysis {
  fen: string;
  moveNumber: string;
  movePlayed: string;
  evaluation: number;
  winChance: number;
  bestMove: string;
  opponentsBestMove: string;
  continuation: string[];
}

interface EngineMessage {
  type: string;
  san?: string;
  eval?: number;
  winChance?: number;
  continuationArr?: string[];
  depth?: number;
  nodes?: number;
  text?: string;
  error?: string;
}

class ChessEngineAnalyzer {
  private currentPositions: string[] = [];
  private currentPositionIndex: number = 0;
  private analysisResults: PositionAnalysis[] = [];
  private gameMoves: string[] = [];
  private connectionStartTime: number = 0;
  private lastMessageTime: number = 0;

  private debugLog(message: string, level: 'INFO' | 'ERROR' | 'DETAIL' = 'INFO') {
    if (level === 'INFO' || level === 'ERROR') {
      const timestamp = new Date().toLocaleTimeString();
      const prefix = level === 'ERROR' ? '[ERROR]' : '[CHESS-API]';
      console.log(`${prefix} ${timestamp} ${message}`);
    }
  }

  private async parseMovesFromPGN(pgnText: string): Promise<string[]> {
    this.debugLog("Parsing moves from PGN...");
    
    if (!pgnText) {
      this.debugLog("Input is empty", "ERROR");
      return [];
    }

    try {
      // Dynamic import for chess.js
      const { Chess } = await import('chess.js');
      const chess = new Chess();
      
      // Clean PGN text
      const cleanText = pgnText.replace(/<div class='moves'>|<\/div>/g, "");
      
      // Load PGN and get positions
      chess.loadPgn(cleanText);
      const history = chess.history();
      
      // Reset and replay to get all positions
      chess.reset();
      const positions = [chess.fen()]; // Starting position
      this.gameMoves = []; // Reset game moves
      
      for (const moveStr of history) {
        try {
          const move = chess.move(moveStr);
          if (move) {
            this.gameMoves.push(move.san);
            positions.push(chess.fen());
          }
        } catch (e) {
          this.debugLog(`Error processing move ${moveStr}`, "ERROR");
        }
      }
      
      this.debugLog(`Parsed ${positions.length} positions from PGN`);
      return positions;
    } catch (e) {
      this.debugLog(`Error parsing PGN: ${e}`, "ERROR");
      return [];
    }
  }

  private formatAnalysisOutput(
    positionIndex: number, 
    bestMove: string, 
    evalScore: number, 
    winChance: number, 
    continuation: string[]
  ): PositionAnalysis {
    // Basic structure - move info will be updated in the main analysis loop
    return {
      fen: "", // Will be set in main loop
      moveNumber: "", // Will be set in main loop
      movePlayed: "", // Will be set in main loop
      evaluation: evalScore,
      winChance,
      bestMove, // This is now the best move for the player who was about to move
      opponentsBestMove: "", // Will be set in main loop
      continuation
    };
  }

  private generateOpponentsBest(bestMove: string): string {
    // Improved heuristic for opponent response based on common chess principles
    // This is still simplified but much better than random moves
    
    const move = bestMove.toLowerCase();
    
    // Opening principles for common first moves
    if (move === 'e4') {
      return 'e5'; // Most principled response to 1.e4
    }
    if (move === 'd4') {
      return 'd5'; // Most principled response to 1.d4
    }
    if (move === 'nf3') {
      return 'Nf6'; // Symmetric development
    }
    if (move === 'nc3') {
      return 'Nc6'; // Symmetric development
    }
    
    // Responses to common Black openings
    if (move === 'e5') {
      return 'Nf3'; // Italian/Spanish setup
    }
    if (move === 'd5') {
      return 'c4'; // Queen's Gambit
    }
    if (move === 'nf6') {
      return 'Bg5'; // Pin the knight or Nf3
    }
    if (move === 'c5') {
      return 'Nc3'; // Sicilian development
    }
    
    // Middle game responses
    if (move.includes('o-o') || move === 'o-o') {
      return 'O-O'; // Castle in response
    }
    if (move.startsWith('q')) {
      return 'Nf3'; // Develop pieces when opponent brings queen out early
    }
    if (move.startsWith('b')) {
      return 'a6'; // Prevent piece placement or prepare expansion
    }
    
    // Generic development moves if no specific response found
    const genericResponses = ['Nf3', 'Nc3', 'Nf6', 'Nc6', 'd6', 'e6', 'c6', 'a6'];
    return genericResponses[Math.floor(Math.random() * genericResponses.length)];
  }

  private async createWebSocketConnection(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      this.debugLog("Creating WebSocket connection to chess-api.com...");
      this.connectionStartTime = Date.now();
      
      let ws: any;
      
      try {
        // Use native WebSocket in browser, ws library in Node.js
        if (typeof window !== 'undefined') {
          ws = new WebSocket('wss://chess-api.com/v1');
        } else {
          // Dynamic import for Node.js environment
          const WebSocketLib = (await import('ws')).default;
          ws = new WebSocketLib('wss://chess-api.com/v1', {
            headers: {
              'User-Agent': 'NextJS-Chess-Analyzer/1.0'
            }
          });
        }
      } catch (importError) {
        this.debugLog(`Failed to create WebSocket: ${importError}`, "ERROR");
        reject(importError);
        return;
      }
      
      let connectionTimeout = setTimeout(() => {
        this.debugLog("WebSocket connection timeout", "ERROR");
        ws.close();
        reject(new Error('Connection timeout'));
      }, 15000);

      const onOpen = () => {
        clearTimeout(connectionTimeout);
        const elapsed = Date.now() - this.connectionStartTime;
        this.debugLog(`WebSocket connection established in ${elapsed}ms`);
        resolve(ws);
      };

      const onError = (error: any) => {
        clearTimeout(connectionTimeout);
        this.debugLog(`WebSocket error: ${error}`, "ERROR");
        reject(error);
      };

      const onClose = () => {
        clearTimeout(connectionTimeout);
        this.debugLog("WebSocket connection closed");
      };

      // Set event handlers based on environment
      if (typeof window !== 'undefined') {
        // Browser environment
        ws.onopen = onOpen;
        ws.onerror = onError;
        ws.onclose = onClose;
      } else {
        // Node.js environment
        ws.on('open', onOpen);
        ws.on('error', onError);
        ws.on('close', onClose);
      }
    });
  }

  private analyzePositionWithEngine(ws: any, position: string): Promise<PositionAnalysis> {
    return new Promise((resolve, reject) => {
      let analysisTimeout = setTimeout(() => {
        this.debugLog("Analysis timeout for position", "ERROR");
        reject(new Error('Analysis timeout'));
      }, 30000);

      const messageHandler = (data: any) => {
        try {
          // Handle different data formats between browser and Node.js
          const messageStr = typeof data === 'string' ? data : data.toString();
          const message: EngineMessage = JSON.parse(messageStr);
          this.lastMessageTime = Date.now();
          
          if (message.type === 'error') {
            clearTimeout(analysisTimeout);
            this.debugLog(`Engine error: ${message.error}`, "ERROR");
            reject(new Error(message.error || 'Engine analysis error'));
            return;
          }
          
          if (message.type === 'bestmove') {
            clearTimeout(analysisTimeout);
            
            // Remove event listener
            if (typeof window !== 'undefined') {
              ws.removeEventListener('message', messageHandler);
            } else {
              ws.off('message', messageHandler);
            }
            
            const analysis = this.formatAnalysisOutput(
              this.currentPositionIndex - 1,
              message.san || '',
              message.eval || 0,
              message.winChance || 50,
              message.continuationArr || []
            );
            
            this.debugLog(`Analysis complete: ${message.san} [${message.eval?.toFixed(2)}]`);
            resolve(analysis);
          } else if (message.type === 'move') {
            // Log progress updates
            if (message.depth && message.depth % 4 === 0) {
              this.debugLog(`Analyzing depth ${message.depth}, eval: ${message.eval?.toFixed(2)}`);
            }
          }
        } catch (e) {
          this.debugLog(`Error parsing engine message: ${e}`, "ERROR");
        }
      };

      // Set message handler based on environment
      if (typeof window !== 'undefined') {
        // Browser environment
        ws.addEventListener('message', (event: MessageEvent) => messageHandler(event.data));
      } else {
        // Node.js environment
        ws.on('message', messageHandler);
      }
      
      // Send analysis request
      const taskId = Math.random().toString(36).substring(2, 10);
      const analysisRequest = {
        fen: position,
        depth: 20,
        variants: 1,
        taskId
      };
      
      this.debugLog(`Sending analysis request for position ${this.currentPositionIndex}`);
      ws.send(JSON.stringify(analysisRequest));
      this.currentPositionIndex++;
    });
  }

  public async analyzeGame(pgnText: string, maxPositionsToAnalyze?: number): Promise<PositionAnalysis[]> {
    this.debugLog("Starting chess game analysis");
    
    // Reset state
    this.currentPositions = await this.parseMovesFromPGN(pgnText);
    this.currentPositionIndex = 0;
    this.analysisResults = [];
    
    if (this.currentPositions.length === 0) {
      throw new Error("No valid positions found in PGN");
    }
    
    // Analyze ALL positions by default (like Python version), or limit if specified
    const positionsToAnalyze = maxPositionsToAnalyze || this.currentPositions.length - 1; // -1 to skip starting position
    this.debugLog(`Analyzing ${this.currentPositions.length} positions (analyzing ${positionsToAnalyze} positions)`);
    
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        const ws = await this.createWebSocketConnection();
        
        // Analyze all positions first, then fix opponents best moves
        const maxPositions = Math.min(this.currentPositions.length, positionsToAnalyze + 1); // +1 for start position
        for (let i = 1; i < maxPositions; i++) { // Skip starting position
          this.currentPositionIndex = i;
          
          try {
            // Get the move that was actually played
            const moveIdx = i - 1;
            const fullMoveNum = Math.floor(moveIdx / 2) + 1;
            const isWhite = moveIdx % 2 === 0;
            const actualMovePlayed = this.gameMoves[moveIdx];
            
            // Analyze the position BEFORE the move to get engine's recommendation
            const positionBeforeMove = this.currentPositions[i - 1];
            const analysis = await this.analyzePositionWithEngine(ws, positionBeforeMove);
            
            // Set up the move information
            if (isWhite) {
              analysis.moveNumber = `${fullMoveNum}.`;
              analysis.movePlayed = `${fullMoveNum}. ${actualMovePlayed}`;
            } else {
              analysis.moveNumber = `${fullMoveNum}...`;
              analysis.movePlayed = `${fullMoveNum}... ${actualMovePlayed}`;
            }
            
            // Set the FEN to the position AFTER the move (for reference)
            analysis.fen = this.currentPositions[i];
            
            // Keep the engine's best move recommendation as-is
            // analysis.bestMove is already set by the engine
            
            // Temporarily set opponentsBestMove to empty - we'll fix this after all analysis
            analysis.opponentsBestMove = "";
            
            this.analysisResults.push(analysis);
            
          } catch (positionError) {
            this.debugLog(`Error analyzing position ${i}: ${positionError}`, "ERROR");
            // Continue with next position
          }
        }
        
        // FIXED: Now set opponents best moves using the Python logic
        // For each position, the opponent's best move is the best move from the NEXT position
        for (let i = 0; i < this.analysisResults.length - 1; i++) {
          this.analysisResults[i].opponentsBestMove = this.analysisResults[i + 1].bestMove;
        }
        
        // For the last position, there's no next move, so set to empty or N/A
        if (this.analysisResults.length > 0) {
          this.analysisResults[this.analysisResults.length - 1].opponentsBestMove = "";
        }
        
        ws.close();
        break; // Success, exit retry loop
        
      } catch (connectionError) {
        retryCount++;
        this.debugLog(`Connection attempt ${retryCount} failed: ${connectionError}`, "ERROR");
        
        if (retryCount < maxRetries) {
          this.debugLog(`Retrying in ${retryCount * 2} seconds...`);
          await new Promise(resolve => setTimeout(resolve, retryCount * 2000));
        }
      }
    }
    
    if (this.analysisResults.length === 0) {
      throw new Error("Failed to analyze any positions after all retries");
    }
    
    this.debugLog(`Analysis complete: ${this.analysisResults.length} positions analyzed`);
    return this.analysisResults;
  }

  public formatAsTable(results: PositionAnalysis[]): string {
    let table = "# Chess Game Analysis\n\n";
    table += `**Analysis completed for ${results.length} positions using real Stockfish engine.**\n\n`;
    table += "| Move Number | Move Played | Evaluation | Win Chance | Best Move | Opponents Best | FEN | Continuation |\n";
    table += "|-------------|-------------|------------|------------|-----------|----------------|-----|-------------|\n";
    
    results.forEach(result => {
      const winChanceStr = `${result.winChance.toFixed(1)}%`;
      const evaluationStr = `${result.evaluation >= 0 ? '+' : ''}${result.evaluation.toFixed(2)}`;
      const continuationStr = result.continuation.slice(0, 4).join(' ');
      
      table += `| ${result.moveNumber} | ${result.movePlayed} | ${evaluationStr} | ${winChanceStr} | ${result.bestMove} | ${result.opponentsBestMove} | ${result.fen} | ${continuationStr} |\n`;
    });
    
    table += "\n*Analysis completed using Chess-API.com with Stockfish engine*";
    return table;
  }

  public async saveTableToFile(results: PositionAnalysis[], filename: string = 'EngineTable.md'): Promise<void> {
    const table = this.formatAsTable(results);
    
    try {
      // For Node.js environment only
      if (typeof window === 'undefined') {
        const fs = await import('fs');
        await fs.promises.writeFile(filename, table, 'utf8');
        this.debugLog(`Analysis saved to ${filename}`);
      } else {
        this.debugLog("File saving not available in browser environment");
      }
    } catch (error) {
      this.debugLog(`Error saving to file: ${error}`, "ERROR");
    }
  }
}

export { ChessEngineAnalyzer, type PositionAnalysis }; 