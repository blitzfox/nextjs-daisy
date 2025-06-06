import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Chess } from 'chess.js';
import { 
  CommentaryRequest, 
  CommentaryResponse, 
  AICommentary, 
  MoveCommentary, 
  GameSummary,
  CommentaryLevel 
} from '@/lib/types';
import { 
  getGameSummaryPrompt,
  getProgressiveSummaryPrompt,
  getMoveCommentaryPrompt,
  COMMENTARY_STYLE_EXAMPLES
} from '@/lib/prompts/commentary';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface MoveInfo {
  moveNumber: string;
  movePlayed: string;
  fen: string;
  san: string;
}

function parsePGNToMoves(pgn: string): MoveInfo[] {
  const chess = new Chess();
  const moves: MoveInfo[] = [];
  
  try {
    chess.loadPgn(pgn);
    const history = chess.history({ verbose: true });
    
    // Reset and replay to get positions
    chess.reset();
    
    for (let i = 0; i < history.length; i++) {
      const move = history[i];
      chess.move(move);
      
      const fullMoveNumber = Math.floor(i / 2) + 1;
      const isWhite = i % 2 === 0;
      const moveNumber = isWhite ? `${fullMoveNumber}.` : `${fullMoveNumber}...`;
      
      moves.push({
        moveNumber,
        movePlayed: `${moveNumber} ${move.san}`,
        fen: chess.fen(),
        san: move.san
      });
    }
  } catch (error) {
    console.error('Error parsing PGN:', error);
  }
  
  return moves;
}

async function generateMoveCommentary(
  moves: MoveInfo[], 
  level: CommentaryLevel,
  gameInfo: CommentaryRequest['gameInfo']
): Promise<MoveCommentary[]> {
  const commentary: MoveCommentary[] = [];
  const batchSize = 10; // Process moves in batches to avoid token limits (increased from 5)
  
  // Create all batches
  const batches = [];
  for (let i = 0; i < moves.length; i += batchSize) {
    batches.push(moves.slice(i, i + batchSize));
  }
  
  // Process batches in parallel
  const batchPromises = batches.map(async (batch, batchIndex) => {
    const prompt = `${getMoveCommentaryPrompt(level)}

${COMMENTARY_STYLE_EXAMPLES}

GAME CONTEXT:
White: ${gameInfo.white}
Black: ${gameInfo.black}
Result: ${gameInfo.result}
${gameInfo.tournament ? `Tournament: ${gameInfo.tournament}` : ''}

MOVES TO COMMENT ON:
${batch.map(move => `${move.movePlayed} (FEN: ${move.fen})`).join('\n')}

For each move, provide commentary with the following information:
- Commentary: 1-2 sentences explaining the move and its ideas
- Key Ideas: List 2-3 main concepts or principles demonstrated
- Momentum Assessment: Does this move shift momentum? (white/black/neutral)
- Highlight Status: Is this a particularly important/instructive move?

The response will be automatically formatted as JSON.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4.1',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        try {
          const parsedResponse = JSON.parse(content);
          const batchCommentary = parsedResponse.moves as MoveCommentary[];
          
          // Ensure we preserve the original movePlayed format
          const correctedCommentary = batchCommentary.map((aiMove, index) => ({
            ...aiMove,
            moveNumber: batch[index].moveNumber,
            movePlayed: batch[index].movePlayed, // Use original format like "31. Nxc4"
            fen: batch[index].fen
          }));
          
          return { batchIndex, commentary: correctedCommentary };
        } catch (parseError) {
          console.error('Error parsing commentary JSON:', parseError);
          // Fallback to basic commentary
          return {
            batchIndex,
            commentary: batch.map(move => ({
              moveNumber: move.moveNumber,
              movePlayed: move.movePlayed,
              fen: move.fen,
              commentary: "A solid move continuing the game plan.",
              keyIdeas: ["Piece development", "King safety"],
              momentumShift: "neutral" as const,
              isHighlight: false
            }))
          };
        }
      }
    } catch (error) {
      console.error(`Error generating commentary for batch ${batchIndex}:`, error);
      return {
        batchIndex,
        commentary: batch.map(move => ({
          moveNumber: move.moveNumber,
          movePlayed: move.movePlayed,
          fen: move.fen,
          commentary: "Move analysis unavailable.",
          keyIdeas: ["Game continuation"],
          momentumShift: "neutral" as const,
          isHighlight: false
        }))
      };
    }
  });

  // Wait for all batches to complete
  const batchResults = await Promise.all(batchPromises);
  
  // Sort results by batch index and flatten
  batchResults
    .filter(result => result !== undefined)
    .sort((a, b) => (a?.batchIndex || 0) - (b?.batchIndex || 0))
    .forEach(result => {
      if (result) {
        commentary.push(...result.commentary);
      }
    });
  
  return commentary;
}

async function generateMoveCommentaryStreaming(
  moves: MoveInfo[], 
  level: CommentaryLevel,
  gameInfo: CommentaryRequest['gameInfo'],
  controller: ReadableStreamDefaultController<Uint8Array>
): Promise<MoveCommentary[]> {
  const commentary: MoveCommentary[] = [];
  const batchSize = 10; // Process moves in batches to avoid token limits (increased from 5)
  
  // Create all batches
  const batches = [];
  for (let i = 0; i < moves.length; i += batchSize) {
    batches.push(moves.slice(i, i + batchSize));
  }
  
  // Process batches in parallel with progress updates
  const batchPromises = batches.map(async (batch, batchIndex) => {
    const prompt = `${getMoveCommentaryPrompt(level)}

${COMMENTARY_STYLE_EXAMPLES}

GAME CONTEXT:
White: ${gameInfo.white}
Black: ${gameInfo.black}
Result: ${gameInfo.result}
${gameInfo.tournament ? `Tournament: ${gameInfo.tournament}` : ''}

MOVES TO COMMENT ON:
${batch.map(move => `${move.movePlayed} (FEN: ${move.fen})`).join('\n')}

For each move, provide commentary with the following information:
- Commentary: 1-2 sentences explaining the move and its ideas
- Key Ideas: List 2-3 main concepts or principles demonstrated
- Momentum Assessment: Does this move shift momentum? (white/black/neutral)
- Highlight Status: Is this a particularly important/instructive move?

The response will be automatically formatted as JSON.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o', // GPT-4o is faster than GPT-4.1
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "move_commentary",
            schema: {
              type: "object",
              properties: {
                moves: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      moveNumber: { type: "string" },
                      movePlayed: { type: "string" },
                      fen: { type: "string" },
                      commentary: { type: "string" },
                      keyIdeas: {
                        type: "array",
                        items: { type: "string" }
                      },
                      momentumShift: {
                        type: "string",
                        enum: ["white", "black", "neutral"]
                      },
                      isHighlight: { type: "boolean" }
                    },
                    required: ["moveNumber", "movePlayed", "fen", "commentary", "keyIdeas", "momentumShift", "isHighlight"]
                  }
                }
              },
              required: ["moves"]
            }
          }
        }
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        try {
          const parsedResponse = JSON.parse(content);
          const batchCommentary = parsedResponse.moves as MoveCommentary[];
          
          // Ensure we preserve the original movePlayed format
          const correctedCommentary = batchCommentary.map((aiMove, index) => ({
            ...aiMove,
            moveNumber: batch[index].moveNumber,
            movePlayed: batch[index].movePlayed, // Use original format like "31. Nxc4"
            fen: batch[index].fen
          }));
          
          // Send progress update for this batch
          const progress = Math.round(((batchIndex + 1) / batches.length) * 70); // 70% for move commentary
          controller.enqueue(new TextEncoder().encode(
            `data: ${JSON.stringify({ 
              type: 'progress', 
              message: `🔥 Analyzed moves ${(batchIndex * 10) + 1}-${Math.min((batchIndex + 1) * 10, moves.length)}! The story unfolds...`,
              progress,
              batchData: correctedCommentary
            })}\n\n`
          ));
          
          return { batchIndex, commentary: correctedCommentary };
        } catch (parseError) {
          console.error('Error parsing commentary JSON:', parseError);
          // Fallback to basic commentary
          return {
            batchIndex,
            commentary: batch.map(move => ({
              moveNumber: move.moveNumber,
              movePlayed: move.movePlayed,
              fen: move.fen,
              commentary: "A solid move continuing the game plan.",
              keyIdeas: ["Piece development", "King safety"],
              momentumShift: "neutral" as const,
              isHighlight: false
            }))
          };
        }
      }
    } catch (error) {
      console.error(`Error generating commentary for batch ${batchIndex}:`, error);
      return {
        batchIndex,
        commentary: batch.map(move => ({
          moveNumber: move.moveNumber,
          movePlayed: move.movePlayed,
          fen: move.fen,
          commentary: "Move analysis unavailable.",
          keyIdeas: ["Game continuation"],
          momentumShift: "neutral" as const,
          isHighlight: false
        }))
      };
    }
  });

  // Wait for all batches to complete
  const batchResults = await Promise.all(batchPromises);
  
  // Sort results by batch index and flatten
  batchResults
    .filter(result => result !== undefined)
    .sort((a, b) => (a?.batchIndex || 0) - (b?.batchIndex || 0))
    .forEach(result => {
      if (result) {
        commentary.push(...result.commentary);
      }
    });
  
  return commentary;
}

async function generateGameSummary(
  pgn: string,
  moveCommentary: MoveCommentary[],
  level: CommentaryLevel,
  gameInfo: CommentaryRequest['gameInfo']
): Promise<GameSummary> {
  const prompt = `${getGameSummaryPrompt(level)}

${COMMENTARY_STYLE_EXAMPLES}

GAME INFORMATION:
White: ${gameInfo.white}
Black: ${gameInfo.black}
Result: ${gameInfo.result}
Date: ${gameInfo.date}
${gameInfo.tournament ? `Tournament: ${gameInfo.tournament}` : ''}
${gameInfo.round ? `Round: ${gameInfo.round}` : ''}

GAME COMMENTARY CONTEXT:
${moveCommentary.slice(0, 10).map(m => `${m.movePlayed}: ${m.commentary}`).join('\n')}
...
${moveCommentary.slice(-5).map(m => `${m.movePlayed}: ${m.commentary}`).join('\n')}

KEY HIGHLIGHTS:
${moveCommentary.filter(m => m.isHighlight).map(m => `${m.movePlayed}: ${m.commentary}`).join('\n')}

Write a comprehensive game summary in the Take Take Take style. Provide:
- A compelling title for the game
- A detailed narrative of the game's story
- Tournament context if applicable

The response will be automatically formatted as JSON.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Changed from 'gpt-4' for speed
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 1000,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "game_summary",
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              content: { type: "string" },
              tournamentContext: { type: "string" }
            },
            required: ["title", "content"]
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content || '';
    const summaryData = JSON.parse(content);
    const keyMoments = moveCommentary
      .filter(m => m.isHighlight)
      .map(m => parseInt(m.moveNumber.replace(/[^\d]/g, '')))
      .filter(n => !isNaN(n));

    return {
      type: 'game',
      title: summaryData.title,
      content: summaryData.content,
      tournamentContext: summaryData.tournamentContext || gameInfo.tournament,
      keyMoments
    };
  } catch (error) {
    console.error('Error generating game summary:', error);
    return {
      type: 'game',
      title: `${gameInfo.white} vs ${gameInfo.black}`,
      content: 'Summary could not be generated.',
      keyMoments: []
    };
  }
}

async function generateProgressiveSummaries(
  moves: MoveInfo[],
  moveCommentary: MoveCommentary[],
  level: CommentaryLevel,
  gameInfo: CommentaryRequest['gameInfo']
): Promise<GameSummary[]> {
  const summaries: GameSummary[] = [];
  
  // Define phases based on game length
  const totalMoves = moves.length;
  const phases = [
    {
      name: "Opening Phase",
      endMove: Math.min(15, Math.floor(totalMoves * 0.25)),
      description: "opening development and early plans"
    },
    {
      name: "Middlegame",
      endMove: Math.min(30, Math.floor(totalMoves * 0.7)),
      description: "strategic maneuvering and tactical complications"
    }
  ];
  
  // Add endgame phase if the game is long enough
  if (totalMoves > 35) {
    phases.push({
      name: "Endgame",
      endMove: Math.min(totalMoves, Math.floor(totalMoves * 0.95)),
      description: "final phase with simplified positions"
    });
  }
  
  for (const phase of phases) {
    if (phase.endMove >= moves.length || phase.endMove < 5) continue;
    
    const relevantCommentary = moveCommentary.slice(0, phase.endMove);
    const recentMoves = relevantCommentary.slice(-5); // Just the last 5 moves for context
    
    const prompt = `${getProgressiveSummaryPrompt(level, phase.endMove, phase.name, phase.description)}

${COMMENTARY_STYLE_EXAMPLES}

GAME INFORMATION:
White: ${gameInfo.white}
Black: ${gameInfo.black}
${gameInfo.tournament ? `Tournament: ${gameInfo.tournament}` : ''}

RECENT MOVES:
${recentMoves.map(m => `${m.movePlayed}: ${m.commentary}`).join('\n')}

Write a brief "${phase.name}" summary covering the ${phase.description}.
Keep it concise - 1-2 short paragraphs maximum.

The response will be automatically formatted as JSON.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 300, // Reduced from 600 for shorter content
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "progressive_summary",
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                content: { type: "string" }
              },
              required: ["title", "content"]
            }
          }
        }
      });

      const content = response.choices[0]?.message?.content || '';
      const summaryData = JSON.parse(content);
      summaries.push({
        type: 'progressive',
        moveNumber: phase.endMove.toString(),
        title: phase.name, // Use our clear phase name
        content: summaryData.content,
        keyMoments: relevantCommentary
          .filter(m => m.isHighlight)
          .map(m => parseInt(m.moveNumber.replace(/[^\d]/g, '')))
          .filter(n => !isNaN(n))
      });
    } catch (error) {
      console.error(`Error generating progressive summary for ${phase.name}:`, error);
    }
  }
  
  return summaries;
}

export async function POST(request: NextRequest) {
  try {
    const body: CommentaryRequest = await request.json();
    const { pgn, level, gameInfo } = body;

    if (!pgn || !level || !gameInfo) {
      return NextResponse.json(
        { error: 'Missing required fields: pgn, level, gameInfo' },
        { status: 400 }
      );
    }

    // Parse PGN to extract moves
    const moves = parsePGNToMoves(pgn);
    if (moves.length === 0) {
      return NextResponse.json(
        { error: 'Could not parse moves from PGN' },
        { status: 400 }
      );
    }

    console.log(`Generating ${level} commentary for ${moves.length} moves...`);

    // Create a readable stream for real-time updates
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial progress
          controller.enqueue(new TextEncoder().encode(
            `data: ${JSON.stringify({ 
              type: 'progress', 
              message: `🎯 Analyzing this epic ${moves.length}-move battle! Let's dive into the action...`,
              progress: 0 
            })}\n\n`
          ));

          // Generate move-by-move commentary with streaming
          const moveCommentary = await generateMoveCommentaryStreaming(moves, level, gameInfo, controller);
          
          // Send progress update
          controller.enqueue(new TextEncoder().encode(
            `data: ${JSON.stringify({ 
              type: 'progress', 
              message: '📝 Crafting the perfect game summary... Almost there!',
              progress: 80 
            })}\n\n`
          ));

          // Generate game summary
          const gameSummary = await generateGameSummary(pgn, moveCommentary, level, gameInfo);
          
          // Generate progressive summaries
          const progressiveSummaries = await generateProgressiveSummaries(
            moves, 
            moveCommentary, 
            level, 
            gameInfo
          );

          // Extract key highlights
          const keyHighlights = moveCommentary
            .filter((m: MoveCommentary) => m.isHighlight)
            .map((m: MoveCommentary) => ({
              moveNumber: m.moveNumber,
              title: m.keyIdeas[0] || 'Key Moment',
              description: m.commentary
            }));

          const commentary: AICommentary = {
            gameId: `${gameInfo.white}-${gameInfo.black}-${gameInfo.date}`,
            level,
            gameSummary,
            progressiveSummaries,
            moveCommentary,
            keyHighlights
          };

          // Send final result
          controller.enqueue(new TextEncoder().encode(
            `data: ${JSON.stringify({ 
              type: 'complete', 
              commentary,
              message: '🎉 Commentary complete! Ready to explore this chess masterpiece!'
            })}\n\n`
          ));

          console.log(`Commentary generation complete: ${moveCommentary.length} moves commented`);
          controller.close();

        } catch (error) {
          console.error('Error generating commentary:', error);
          controller.enqueue(new TextEncoder().encode(
            `data: ${JSON.stringify({ 
              type: 'error', 
              error: 'Failed to generate commentary' 
            })}\n\n`
          ));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error generating commentary:', error);
    return NextResponse.json(
      { error: 'Failed to generate commentary' },
      { status: 500 }
    );
  }
} 