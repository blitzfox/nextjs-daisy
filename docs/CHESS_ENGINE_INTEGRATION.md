# Chess Engine Integration

## Overview

The NextJS chess analysis application now features **real Stockfish chess engine integration** via WebSocket connection to chess-api.com. This replaces the previous mock data system with genuine engine analysis.

## Features

### ✅ Real Engine Analysis
- **Stockfish Engine**: Industry-standard chess engine
- **Depth-20 Analysis**: Deep positional evaluation
- **Centipawn Precision**: Accurate evaluation scores
- **Win Chance Calculation**: Probability-based assessments
- **Continuation Lines**: Engine-suggested move sequences

### ✅ Robust Architecture
- **WebSocket Communication**: Real-time engine connection
- **Retry Logic**: 3 attempts with exponential backoff
- **Error Handling**: Graceful fallback to mock data
- **Cross-Platform**: Works in Node.js and browser environments
- **Performance Optimized**: Limits analysis for speed

## Technical Implementation

### Core Components

#### `ChessEngineAnalyzer` Class
```typescript
// Located in: lib/engine/chessApi.ts

const analyzer = new ChessEngineAnalyzer();
const results = await analyzer.analyzeGame(pgnText);
const table = analyzer.formatAsTable(results);
```

#### Integration with API Routes
```typescript
// Located in: app/api/analysis/critical-moments/route.ts

try {
  const analyzer = new ChessEngineAnalyzer();
  const analysisResults = await analyzer.analyzeGame(body.pgn);
  engineAnalysis = analyzer.formatAsTable(analysisResults);
} catch (engineError) {
  // Fallback to mock analysis
  engineAnalysis = await analyzeWithMockEngine(chess);
}
```

### WebSocket Connection Details

#### Connection Parameters
- **URL**: `wss://chess-api.com/v1`
- **Timeout**: 15 seconds for connection
- **Analysis Timeout**: 30 seconds per position
- **Depth**: 20 moves deep
- **Variants**: 1 (single best line)

#### Message Protocol
```json
{
  "fen": "position_fen_string",
  "depth": 20,
  "variants": 1,
  "taskId": "unique_id"
}
```

#### Response Format
```json
{
  "type": "bestmove",
  "san": "Nf3",
  "eval": 0.23,
  "winChance": 52.1,
  "continuationArr": ["e6", "d4", "d5", "Nc3"]
}
```

## Configuration

### Environment Variables
```env
CHESS_API_URL=wss://chess-api.com/v1
```

### Next.js Configuration
```javascript
// next.config.js
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('ws');
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['ws'],
  },
};
```

### Dependencies
```json
{
  "ws": "^8.x.x",
  "@types/ws": "^8.x.x",
  "chess.js": "^1.x.x"
}
```

## Usage

### Basic Analysis
```typescript
import { ChessEngineAnalyzer } from '@/lib/engine/chessApi';

const analyzer = new ChessEngineAnalyzer();

// Analyze a game from PGN
const pgnText = "1. e4 e5 2. Nf3 Nc6 3. Bb5";
const results = await analyzer.analyzeGame(pgnText);

// Each result contains:
// - fen: Position FEN string
// - moveNumber: "1.", "1...", "2.", etc.
// - movePlayed: "1. e4", "1... e5", etc.
// - evaluation: Centipawn evaluation
// - winChance: Win probability percentage
// - bestMove: Engine's recommended move
// - opponentsBestMove: Likely opponent response
// - continuation: Engine's suggested line
```

### Integration with Critical Moments Analysis
```typescript
// The engine analysis feeds into the OpenAI critical moments extraction
const engineAnalysis = analyzer.formatAsTable(results);
const criticalMoments = await extractCriticalMoments(engineAnalysis, colorToAnalysis);
```

## Error Handling

### Automatic Fallback
The system automatically falls back to mock analysis if:
- WebSocket connection fails
- Chess-api.com is unavailable
- Analysis timeout occurs
- Network issues arise

### Retry Logic
- **3 Retry Attempts**: With exponential backoff
- **Graceful Degradation**: Continues with available data
- **User Notification**: Logs indicate real vs. mock analysis

### Logging
```
[CHESS-API] 14:30:25 Creating WebSocket connection to chess-api.com...
[CHESS-API] 14:30:26 WebSocket connection established in 432ms
[CHESS-API] 14:30:27 Analyzing depth 20, eval: +0.23
[CHESS-API] 14:30:28 Analysis complete: Nf3 [+0.23]
```

## Performance Considerations

### Current Limitations
- **10 Move Limit**: Analysis limited to first 10 moves for speed
- **Sequential Processing**: Positions analyzed one by one
- **1.5 Second Delay**: Between analysis requests

### Performance Optimizations
- **Connection Reuse**: Single WebSocket for multiple positions
- **Timeout Management**: Prevents hanging requests
- **Resource Limits**: Controlled analysis depth and scope

## Comparison: Before vs. After

### Before (Mock Data)
```typescript
// Random evaluations
const evaluation = (Math.sin(i * 0.3) * 2 + noise).toFixed(2);
const bestMove = legalMoves[Math.floor(Math.random() * 3)];
```

### After (Real Engine)
```typescript
// Genuine Stockfish analysis
const analysis = await analyzer.analyzePositionWithEngine(ws, position);
// Returns real evaluation, best move, win chance, continuation
```

## Future Enhancements

### Planned Improvements
- **Full Game Analysis**: Remove 10-move limitation
- **Configurable Depth**: User-selectable analysis depth
- **Multi-PV Analysis**: Multiple best moves per position
- **Parallel Processing**: Faster analysis pipeline
- **Engine Selection**: Choice of different engines

### Advanced Features
- **Time Controls**: Analysis time limits
- **Opening Books**: Integration with opening databases
- **Endgame Tablebases**: Perfect endgame analysis
- **Cloud Scaling**: Multiple engine instances

## Troubleshooting

### Common Issues

#### Connection Failures
```
[ERROR] 14:30:25 WebSocket connection timeout
```
**Solution**: Check internet connection and chess-api.com availability

#### Analysis Timeouts
```
[ERROR] 14:30:55 Analysis timeout for position
```
**Solution**: System automatically retries or falls back to mock data

#### Import Errors
```
[ERROR] Failed to create WebSocket: Module not found
```
**Solution**: Ensure `ws` package is installed: `npm install ws @types/ws`

### Debug Mode
Enable verbose logging by modifying the `debugLog` method:
```typescript
private debugLog(message: string, level: 'INFO' | 'ERROR' | 'DETAIL' = 'INFO') {
  // Change to include 'DETAIL' for verbose output
  if (level === 'INFO' || level === 'ERROR' || level === 'DETAIL') {
    console.log(`[CHESS-API] ${message}`);
  }
}
```

## Architecture Benefits

### Reliability
- **Fallback System**: Never fails completely
- **Error Recovery**: Automatic retry logic
- **Graceful Degradation**: Continues with available data

### Scalability
- **Modular Design**: Easy to extend and modify
- **Environment Agnostic**: Works in multiple contexts
- **Resource Efficient**: Optimized for performance

### Maintainability
- **Clear Separation**: Engine logic isolated
- **Type Safety**: Full TypeScript support
- **Comprehensive Logging**: Easy debugging

This implementation provides a solid foundation for professional-quality chess analysis with room for future enhancements and scaling. 🚀 