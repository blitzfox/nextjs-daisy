import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { zodResponseFormat } from "openai/helpers/zod";
import { Chess } from 'chess.js';
import { AnalysisRequest, AnalysisResponse, CriticalMoment } from '@/lib/types';
import { 
  CriticalMomentsExtractionSchema,
  MomentAnalysisSchema,
  type CriticalMomentExtraction,
  type MomentAnalysis
} from '@/lib/schemas/analysis';
import { 
  extraction_prompt, 
  extraction_system_prompt,
  moment_1_prompt,
  moment_2_prompt,
  moment_3_prompt,
  moment_4_prompt
} from '@/lib/prompts/indPrompts';
import { ChessEngineAnalyzer } from '@/lib/engine/chessApi';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  // Check if client wants streaming
  const url = new URL(request.url);
  const streaming = url.searchParams.get('stream') === 'true';
  
  if (streaming) {
    return handleStreamingRequest(request);
  }
  
  // Original non-streaming implementation
  return handleRegularRequest(request);
}

async function handleStreamingRequest(request: NextRequest) {
  const body: AnalysisRequest = await request.json();
  
  if (!body.pgn) {
    return NextResponse.json(
      { error: 'PGN is required' },
      { status: 400 }
    );
  }

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      const sendEvent = (event: string, data: any) => {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };
      
      try {
        // Validate PGN
        const chess = new Chess();
        try {
          chess.loadPgn(body.pgn);
        } catch (e) {
          sendEvent('error', { error: 'Invalid PGN format' });
          controller.close();
          return;
        }
        
        sendEvent('status', { message: 'Starting chess engine analysis...', progress: 10 });
        
        // Engine analysis
        let engineAnalysis: string;
        try {
          const analyzer = new ChessEngineAnalyzer();
          const analysisResults = await analyzer.analyzeGame(body.pgn);
          engineAnalysis = analyzer.formatAsTable(analysisResults);
          await analyzer.saveTableToFile(analysisResults, 'EngineTable.md');
          
          sendEvent('status', { message: `Engine analysis completed: ${analysisResults.length} positions analyzed`, progress: 30 });
        } catch (engineError) {
          sendEvent('status', { message: 'Engine analysis failed, using fallback...', progress: 25 });
          engineAnalysis = await analyzeWithMockEngine(chess);
        }
        
        sendEvent('status', { message: 'Extracting critical moments...', progress: 40 });
        
        // Extract critical moments
        const colorToAnalysis = body.colorToAnalysis || 'White';
        const criticalMoments = await extractCriticalMoments(engineAnalysis, colorToAnalysis);
        
        sendEvent('critical_moments', { moments: criticalMoments });
        sendEvent('status', { message: 'Processing individual moments with streaming...', progress: 50 });
        
        // Process moments with streaming
        const processedMoments = await processStreamingMoments(criticalMoments, colorToAnalysis, sendEvent);
        
        // Send final result
        sendEvent('complete', { 
          criticalMoments: processedMoments,
          message: 'Analysis complete!'
        });
        
      } catch (error) {
        console.error('Streaming error:', error);
        sendEvent('error', { error: 'Failed to analyze critical moments' });
      } finally {
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
}

async function handleRegularRequest(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json();
    
    if (!body.pgn) {
      return NextResponse.json(
        { error: 'PGN is required' },
        { status: 400 }
      );
    }
    
    // Validate PGN format
    const chess = new Chess();
    try {
      chess.loadPgn(body.pgn);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid PGN format' },
        { status: 400 }
      );
    }
    
    console.log('Starting real chess engine analysis...');
    
    // Use real chess engine analysis instead of mock data
    let engineAnalysis: string;
    try {
      const analyzer = new ChessEngineAnalyzer();
      // Analyze ALL positions like Python version (no artificial limit)
      const analysisResults = await analyzer.analyzeGame(body.pgn);
      engineAnalysis = analyzer.formatAsTable(analysisResults);
      
      // Save to file like Python version creates engineTable.md
      await analyzer.saveTableToFile(analysisResults, 'EngineTable.md');
      
      console.log(`Real engine analysis completed: ${analysisResults.length} positions analyzed`);
    } catch (engineError) {
      console.error('Real engine analysis failed, falling back to mock data:', engineError);
      // Fallback to mock analysis if real engine fails
      engineAnalysis = await analyzeWithMockEngine(chess);
    }
    
    // Extract critical moments using OpenAI with structured outputs
    const colorToAnalysis = body.colorToAnalysis || 'White';
    const criticalMoments = await extractCriticalMoments(engineAnalysis, colorToAnalysis);
    
    // Process moments with individual prompts for detailed analysis
    const processedMoments = await processMomentsWithIndividualPrompts(criticalMoments, colorToAnalysis);
    
    const response: AnalysisResponse = {
      criticalMoments: processedMoments,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in critical moments analysis:', error);
    return NextResponse.json(
      { error: 'Failed to analyze critical moments' },
      { status: 500 }
    );
  }
}

// Fallback function for mock engine analysis (kept as backup)
async function analyzeWithMockEngine(chess: Chess) {
  console.log('Using mock engine analysis as fallback...');
  
  const history = chess.history({ verbose: true });
  const positions = [];
  
  // Reset the board and replay moves to get positions
  chess.reset();
  positions.push({ 
    fen: chess.fen(), 
    moveNumber: 'Start', 
    movePlayed: 'Starting Position',
    evaluation: '0.0',
    bestMove: '',
    continuation: ''
  });
  
  // Replay each move
  for (let i = 0; i < history.length; i++) {
    const move = history[i];
    chess.move(move);
    
    // Calculate move number and format
    const fullMoveNumber = Math.floor(i / 2) + 1;
    const isWhite = i % 2 === 0;
    const moveNumber = isWhite ? `${fullMoveNumber}.` : `${fullMoveNumber}...`;
    
    // Generate more realistic mock evaluations
    const baseEval = Math.sin(i * 0.3) * 2;
    const noise = (Math.random() - 0.5) * 0.5;
    const evaluation = (baseEval + noise).toFixed(2);
    
    // Generate more realistic best moves based on position
    const bestMove = generateRealisticBestMove(chess, move);
    const continuation = generateContinuation(chess);
    
    positions.push({
      fen: chess.fen(),
      moveNumber,
      movePlayed: `${moveNumber} ${move.san}`,
      evaluation,
      bestMove,
      continuation
    });
  }
  
  // Format as a markdown table for analysis
  let table = "# Chess Game Analysis (Mock Engine)\n\n";
  table += "**Note: This analysis uses mock engine data as fallback.**\n\n";
  table += "| Move Number | Move Played | Evaluation | Best Move | Opponents Best | FEN | Continuation |\n";
  table += "|-------------|-------------|------------|-----------|----------------|-----|-------------|\n";
  
  positions.forEach((pos, i) => {
    // Skip the starting position
    if (i === 0) return;
    
    // Generate opponent's best move
    const opponentsBest = generateOpponentsBest(pos.bestMove);
    
    table += `| ${pos.moveNumber} | ${pos.movePlayed} | ${pos.evaluation} | ${pos.bestMove} | ${opponentsBest} | ${pos.fen} | ${pos.continuation} |\n`;
  });
  
  return table;
}

// Helper function to generate more realistic best moves
function generateRealisticBestMove(chess: Chess, lastMove: any): string {
  const legalMoves = chess.moves();
  if (legalMoves.length === 0) return 'No legal moves';
  
  // Pick a random legal move for now
  // TODO: Replace with real engine evaluation
  return legalMoves[Math.floor(Math.random() * Math.min(3, legalMoves.length))];
}

// Helper function to generate continuation
function generateContinuation(chess: Chess): string {
  const moves = [];
  const tempChess = new Chess(chess.fen());
  
  // Generate 3-4 moves of continuation
  for (let i = 0; i < 4; i++) {
    const legalMoves = tempChess.moves();
    if (legalMoves.length === 0) break;
    
    const randomMove = legalMoves[Math.floor(Math.random() * Math.min(3, legalMoves.length))];
    moves.push(randomMove);
    try {
      tempChess.move(randomMove);
    } catch (e) {
      break;
    }
  }
  
  return moves.join(' ');
}

// Helper function to generate opponent's best move
function generateOpponentsBest(bestMove: string): string {
  // Simple logic to generate plausible opponent responses
  const responses = ['Nf6', 'e5', 'd6', 'Bc5', 'Qh5', 'O-O', 'h6', 'a6'];
  return responses[Math.floor(Math.random() * responses.length)];
}

// Function to extract critical moments using OpenAI with structured outputs
async function extractCriticalMoments(
  engineAnalysis: string,
  colorToAnalysis: string
): Promise<CriticalMoment[]> {
  const systemPrompt = extraction_system_prompt;
  const userPrompt = extraction_prompt
    .replace('{color_to_analysis}', colorToAnalysis)
    .replace('{analysis}', engineAnalysis);

  try {
    const response = await openai.beta.chat.completions.parse({
      model: "gpt-4o-2024-08-06",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: zodResponseFormat(CriticalMomentsExtractionSchema, "critical_moments"),
      temperature: 0.3,
    });
    
    const parsedData = response.choices[0].message.parsed;
    if (!parsedData) {
      throw new Error('No parsed data in OpenAI response');
    }
    
    // Convert to our CriticalMoment type
    const criticalMoments: CriticalMoment[] = parsedData.critical_moments.map((moment, index) => {
      return {
        id: index + 1,
        position: 0, // Will be calculated later
        moveNumber: moment.move_number,
        moveInfo: moment.move_info,
        evaluation: moment.evaluation.toString(),
        bestMove: moment.best_move,
        opponentsBestMove: moment.opponents_best_move || "",
        fen: moment.fen,
        continuation: moment.continuation,
        fullLine: moment.full_line,
        phase: moment.phase,
        reason: moment.reason,
        analysis: "", // Will be filled by individual prompts
        circle: "",
        summary: `Critical moment ${index + 1}: ${moment.reason}`
      };
    });
    
    return criticalMoments;
  } catch (error: any) {
    console.error('Error extracting critical moments with structured outputs:', error);
    
    // If structured output fails, fallback to the old method
    console.log('Falling back to manual JSON parsing...');
    return await extractCriticalMomentsLegacy(engineAnalysis, colorToAnalysis);
  }
}

// Legacy function for backward compatibility
async function extractCriticalMomentsLegacy(
  engineAnalysis: string,
  colorToAnalysis: string
): Promise<CriticalMoment[]> {
  const systemPrompt = extraction_system_prompt;
  const userPrompt = extraction_prompt
    .replace('{color_to_analysis}', colorToAnalysis)
    .replace('{analysis}', engineAnalysis);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.5,
    });
    
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }
    
    // Try to parse as JSON first
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(content);
    } catch (parseError) {
      // Try cleaning up +number format first
      try {
        const cleanedContent = content.replace(/:\s*\+(\d+\.\d+)/g, ': $1');
        jsonResponse = JSON.parse(cleanedContent);
      } catch (cleanupError) {
        // If not valid JSON, try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }
        
        // Clean up the JSON to handle +4.17 format (replace +number with just number)
        let cleanedJson = jsonMatch[0].replace(/:\s*\+(\d+\.\d+)/g, ': $1');
        
        try {
          jsonResponse = JSON.parse(cleanedJson);
        } catch (secondParseError) {
          // Try original without cleaning as fallback
          jsonResponse = JSON.parse(jsonMatch[0]);
        }
      }
    }
    
    // Convert to our CriticalMoment type
    const criticalMoments: CriticalMoment[] = jsonResponse.critical_moments.map((moment: any, index: number) => {
      return {
        id: index + 1,
        position: 0, // Will be calculated later
        moveNumber: moment.move_number,
        moveInfo: moment.move_info,
        evaluation: moment.evaluation.toString(),
        bestMove: moment.best_move,
        opponentsBestMove: moment.opponents_best_move || "",
        fen: moment.fen,
        continuation: moment.continuation,
        fullLine: moment.full_line,
        phase: moment.phase,
        reason: moment.reason,
        analysis: "", // Will be filled by individual prompts
        circle: "",
        summary: `Critical moment ${index + 1}: ${moment.reason}`
      };
    });
    
    return criticalMoments;
  } catch (error: any) {
    console.error('Error extracting critical moments with legacy method:', error);
    throw error;
  }
}

// Function to process moments with streaming (like Python version)
async function processStreamingMoments(
  moments: CriticalMoment[],
  colorToAnalysis: string,
  sendEvent: (event: string, data: any) => void
): Promise<CriticalMoment[]> {
  const momentPrompts = [moment_1_prompt, moment_2_prompt, moment_3_prompt, moment_4_prompt];
  
  // Process moments in parallel but with streaming updates
  const momentPromises = moments.slice(0, 4).map(async (moment, i) => {
    const promptTemplate = momentPrompts[i];
    const momentNum = i + 1;
    
    // Build context for this moment
    const previousAssessment = i > 0 ? 
      `Previous moment analysis: Analysis of moment ${i}` : 
      'This is the first critical moment in the game.';
    
    // Fill in the prompt template
    const filledPrompt = promptTemplate
      .replace(/{color_to_analysis}/g, colorToAnalysis)
      .replace(/{move_info}/g, moment.moveInfo)
      .replace(/{best_move}/g, moment.bestMove)
      .replace(/{opponents_best_move}/g, moment.opponentsBestMove || 'Not specified')
      .replace(/{position_info}/g, moment.fen)
      .replace(/{eval_info}/g, moment.evaluation)
      .replace(/{engine_line}/g, moment.continuation)
      .replace(/{game_phase}/g, moment.phase)
      .replace(/{critical_reason}/g, moment.reason)
      .replace(/{previous_assessment}/g, previousAssessment);
    
    try {
      // Add small random delay to avoid rate limiting
      const delay = 1000 + Math.random() * 2000; // 1-3 seconds
      await new Promise(resolve => setTimeout(resolve, delay));
      
      sendEvent('moment_start', { 
        momentNumber: momentNum, 
        message: `Starting analysis of moment ${momentNum}...`,
        progress: 50 + (momentNum * 10)
      });
      
      // Try structured output first for consistency
      try {
        const structuredResponse = await openai.beta.chat.completions.parse({
          model: "gpt-4o-2024-08-06",
          messages: [
            { role: "user", content: filledPrompt }
          ],
          response_format: zodResponseFormat(MomentAnalysisSchema, "moment_analysis"),
          temperature: 0.7,
        });
        
        const analysisData = structuredResponse.choices[0].message.parsed;
        if (analysisData) {
          const formattedAnalysis = formatMomentAnalysis(analysisData);
          
          sendEvent('moment_complete', { 
            momentNumber: momentNum, 
            message: `Moment ${momentNum} analysis complete!`,
            analysis: formattedAnalysis
          });
          
          return {
            ...moment,
            analysis: formattedAnalysis
          };
        }
      } catch (structuredError) {
        console.log(`Structured output failed for moment ${momentNum}, falling back to streaming...`);
      }
      
      // Fallback to streaming for real-time updates
      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "user", content: filledPrompt }
        ],
        temperature: 0.7,
        stream: true,
      });
      
      let fullAnalysis = "";
      
      // Stream the content in real-time using chat completions streaming
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullAnalysis += content;
          
          // Send streaming update to client
          sendEvent('moment_stream', {
            momentNumber: momentNum,
            content: content,
            fullContent: fullAnalysis
          });
        }
      }
      
      // Extract the critical moment section from the response
      const criticalMomentMatch = fullAnalysis.match(/<critical_moment>([\s\S]*?)<\/critical_moment>/);
      const finalAnalysis = criticalMomentMatch ? criticalMomentMatch[1].trim() : fullAnalysis;
      
      sendEvent('moment_complete', { 
        momentNumber: momentNum, 
        message: `Moment ${momentNum} analysis complete!`,
        analysis: finalAnalysis
      });
      
      return {
        ...moment,
        analysis: finalAnalysis
      };
      
    } catch (error) {
      console.error(`Error processing moment ${momentNum}:`, error);
      
      const errorAnalysis = `Analysis for moment ${momentNum} could not be generated due to an error.`;
      
      sendEvent('moment_error', { 
        momentNumber: momentNum, 
        error: `Failed to analyze moment ${momentNum}`,
        analysis: errorAnalysis
      });
      
      return {
        ...moment,
        analysis: errorAnalysis
      };
    }
  });
  
  // Wait for all moments to complete
  const results = await Promise.all(momentPromises);
  
  sendEvent('status', { 
    message: 'All moments processed!', 
    progress: 95 
  });
  
  return results;
}

// Function to process moments with individual prompts - PARALLEL VERSION
async function processMomentsWithIndividualPrompts(
  moments: CriticalMoment[],
  colorToAnalysis: string
): Promise<CriticalMoment[]> {
  const momentPrompts = [moment_1_prompt, moment_2_prompt, moment_3_prompt, moment_4_prompt];
  
  // Process all moments in parallel instead of sequentially
  const momentPromises = moments.slice(0, 4).map(async (moment, i) => {
    const promptTemplate = momentPrompts[i];
    
    // Build context for this moment
    const previousAssessment = i > 0 ? 
      `Previous moment analysis: Analysis of moment ${i}` : 
      'This is the first critical moment in the game.';
    
    // Fill in the prompt template
    const filledPrompt = promptTemplate
      .replace(/{color_to_analysis}/g, colorToAnalysis)
      .replace(/{move_info}/g, moment.moveInfo)
      .replace(/{best_move}/g, moment.bestMove)
      .replace(/{opponents_best_move}/g, moment.opponentsBestMove || 'Not specified')
      .replace(/{position_info}/g, moment.fen)
      .replace(/{eval_info}/g, moment.evaluation)
      .replace(/{engine_line}/g, moment.continuation)
      .replace(/{game_phase}/g, moment.phase)
      .replace(/{critical_reason}/g, moment.reason)
      .replace(/{previous_assessment}/g, previousAssessment);
    
    try {
      // Add small random delay to avoid rate limiting
      const delay = 1000 + Math.random() * 2000; // 1-3 seconds
      await new Promise(resolve => setTimeout(resolve, delay));
      
      const response = await openai.beta.chat.completions.parse({
        model: "gpt-4o-2024-08-06",
        messages: [
          { role: "user", content: filledPrompt }
        ],
        response_format: zodResponseFormat(MomentAnalysisSchema, "moment_analysis"),
        temperature: 0.7,
      });
      
      const analysisData = response.choices[0].message.parsed;
      if (!analysisData) {
        throw new Error(`No parsed analysis for moment ${i + 1}`);
      }
      
      // Format the structured analysis into readable text
      const formattedAnalysis = formatMomentAnalysis(analysisData);
      
      return {
        ...moment,
        analysis: formattedAnalysis
      };
      
    } catch (error) {
      console.error(`Error processing moment ${i + 1} with structured output:`, error);
      
      // Fallback to legacy method
      return await processMomentLegacy(moment, filledPrompt, i + 1);
    }
  });
  
  // Wait for all moments to complete in parallel
  console.log('Processing all 4 moments in parallel...');
  const processedMoments = await Promise.all(momentPromises);
  console.log('All moments processed in parallel!');
  
  return processedMoments;
}

// Helper function to format structured moment analysis
function formatMomentAnalysis(analysis: MomentAnalysis): string {
  return `## Critical Moment: ${analysis.title}

**Explanation:** ${analysis.explanation}

**Recommendation:** \`${analysis.recommendation}\`

**Why it's better:** ${analysis.why_better}

**Principle:** ${analysis.principle}`;
}

// Legacy fallback for individual moment processing
async function processMomentLegacy(
  moment: CriticalMoment,
  filledPrompt: string,
  momentNum: number
): Promise<CriticalMoment> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "user", content: filledPrompt }
      ],
      temperature: 0.7,
    });
    
    const analysis = response.choices[0].message.content || 
      `Analysis for moment ${momentNum} could not be generated.`;
    
    // Extract the critical moment section from the response
    const criticalMomentMatch = analysis.match(/<critical_moment>([\s\S]*?)<\/critical_moment>/);
    const finalAnalysis = criticalMomentMatch ? criticalMomentMatch[1].trim() : analysis;
    
    return {
      ...moment,
      analysis: finalAnalysis
    };
    
  } catch (error) {
    console.error(`Error processing moment ${momentNum} with legacy method:`, error);
    return {
      ...moment,
      analysis: `Analysis for moment ${momentNum} could not be generated due to an error.`
    };
  }
}