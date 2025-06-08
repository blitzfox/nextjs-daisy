'use client';

import React from 'react';
import { CriticalMoment } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, ChevronRight, Target, TrendingUp, Lightbulb, BookOpen, FileText } from 'lucide-react';
import MiniChessBoard from './MiniChessBoard';
import { Chess } from 'chess.js';

interface AnalysisDisplayProps {
  currentMoment: number;
  criticalMoments: CriticalMoment[];
  onMomentChange: (momentNumber: number) => void;
  isAnalyzing: boolean;
  pgn?: string;
}

// Custom components for ReactMarkdown to style chess moves
const components = {
  code: ({ node, inline, className, children, ...props }: any) => {
    // Check if this looks like chess notation
    const content = String(children).replace(/\n$/, '');
    
    // Add detailed logging to debug what we're receiving
    console.log('🔍 Code component received:', {
      content,
      inline,
      className,
      length: content.length
    });
    
    // Simplified and more comprehensive chess notation patterns
    const isChessMove = (
      // Standard piece moves: Nf3, Be3, Qd4, Bb5, etc.
      /^[KQRBN][a-h][1-8][\+\#]?$/.test(content) ||
      // Pawn moves: e4, a6, h5, c4, etc.
      /^[a-h][1-8][\+\#]?$/.test(content) ||
      // Captures: Nxf7, exd5, Bxc6, etc.
      /^[KQRBN]?[a-h]?x[a-h][1-8][\+\#]?$/.test(content) ||
      // Castling: O-O, O-O-O
      /^O-O(-O)?[\+\#]?$/.test(content) ||
      // Move numbers with pieces: 10. Bb5, 5. c3, etc.
      /^\d+\.\s*[KQRBN][a-h][1-8][\+\#]?$/.test(content) ||
      // Move numbers with pawns: 10. c4, 5. e4, etc.
      /^\d+\.\s*[a-h][1-8][\+\#]?$/.test(content) ||
      // Move numbers with captures: 10. Bxc6, etc.
      /^\d+\.\s*[KQRBN]?[a-h]?x[a-h][1-8][\+\#]?$/.test(content) ||
      // Black moves with dots: 10... Bg7, etc.
      /^\d+\.\.\.\s*[KQRBN]?[a-h]?[1-8]?[x]?[a-h][1-8][\+\#]?$/.test(content)
    );
    
    // Check if this is a chess evaluation
    const isEvaluation = /^[+\-]?\d*\.?\d+$/.test(content);
    
    // Add detailed evaluation logging
    if (isEvaluation) {
      const evalValue = parseFloat(content);
      console.log('🎯 EVALUATION DETECTED:', {
        content,
        evalValue,
        isPositive: evalValue > 0,
        isNegative: evalValue < 0,
        isNeutral: evalValue === 0,
        inline: inline
      });
    }
    
    console.log('🎯 Chess move detection result:', {
      content,
      isChessMove,
      isEvaluation,
      patterns: {
        piece: /^[KQRBN][a-h][1-8][\+\#]?$/.test(content),
        pawn: /^[a-h][1-8][\+\#]?$/.test(content),
        numberedPiece: /^\d+\.\s*[KQRBN][a-h][1-8][\+\#]?$/.test(content),
        numberedPawn: /^\d+\.\s*[a-h][1-8][\+\#]?$/.test(content),
        evaluation: isEvaluation
      }
    });
    
    // Handle chess evaluations
    if (isEvaluation && (inline !== false)) {
      const evalValue = parseFloat(content);
      let evalClass = '';
      let evalStyle = {};
      let colorType = '';
      
      if (evalValue > 0) {
        // Positive evaluation (good for white) - darker green for better contrast
        colorType = 'GREEN (White advantage)';
        evalClass = '!bg-green-200 !border !border-green-500 !text-green-900 !font-bold';
        evalStyle = {
          backgroundColor: '#bbf7d0 !important',
          borderColor: '#22c55e !important',
          color: '#14532d !important'
        };
      } else if (evalValue < 0) {
        // Negative evaluation (good for black) - darker red for better contrast
        colorType = 'RED (Black advantage)';
        evalClass = '!bg-red-200 !border !border-red-500 !text-red-900 !font-bold';
        evalStyle = {
          backgroundColor: '#fecaca !important',
          borderColor: '#ef4444 !important',
          color: '#7f1d1d !important'
        };
      } else {
        // Neutral evaluation - darker gray for better contrast
        colorType = 'GRAY (Neutral)';
        evalClass = '!bg-gray-200 !border !border-gray-500 !text-gray-900 !font-bold';
        evalStyle = {
          backgroundColor: '#e5e7eb !important',
          borderColor: '#6b7280 !important',
          color: '#111827 !important'
        };
      }
      
      console.log('✅ APPLYING EVALUATION STYLING:', {
        content,
        evalValue,
        colorType,
        evalClass,
        evalStyle
      });
      
      return (
        <code
          className={`!px-2 !py-1 !rounded-md !shadow-sm !font-mono !text-sm !no-underline ${evalClass}`}
          style={evalStyle}
          {...props}
        >
          {children}
        </code>
      );
    }
    
    if (isChessMove && (inline !== false)) {
      console.log('✅ Applying amber styling to chess move:', content);
      return (
        <code
          className="!bg-amber-100 !border !border-amber-300 !px-2 !py-1 !rounded-md !shadow-sm !font-mono !text-amber-900 !font-bold !text-sm !no-underline"
          style={{
            backgroundColor: '#fef3c7 !important',
            borderColor: '#f59e0b !important',
            color: '#78350f !important'
          }}
          {...props}
        >
          {children}
        </code>
      );
    }
    
    // Default code styling
    console.log('❌ Not a chess move, using default styling:', content);
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
};

// Since the AI should already be adding backticks, we don't need complex preprocessing
const preprocessChessNotation = (text: string): string => {
  console.log('🔄 Preprocessing text:', text.substring(0, 200) + '...');
  
  // First, wrap chess moves in backticks if they're not already wrapped
  let processed = text.replace(/(?<!`)\b([KQRBN]?[a-h]?[x]?[a-h][1-8][\+\#]?|O-O(-O)?[\+\#]?)\b(?!`)/g, (match, move) => {
    // More comprehensive chess move patterns
    const isChessMove = (
      // Standard piece moves: Nf3, Be3, Qd4, Bb5, etc.
      /^[KQRBN][a-h][1-8][\+\#]?$/.test(move) ||
      // Pawn moves: e4, a6, h5, c4, etc.
      /^[a-h][1-8][\+\#]?$/.test(move) ||
      // Captures: Nxf7, exd5, Bxc6, axb4, dxc3, etc.
      /^[KQRBN]?[a-h]?x[a-h][1-8][\+\#]?$/.test(move) ||
      // Castling: O-O, O-O-O
      /^O-O(-O)?[\+\#]?$/.test(move)
    );
    
    // Don't wrap if it's part of a word or already in backticks
    if (isChessMove && move.length >= 2 && move.length <= 7) {
      console.log('🎯 WRAPPING CHESS MOVE IN BACKTICKS:', move);
      return `\`${move}\``;
    }
    return match;
  });
  
  // Then wrap evaluations in backticks if they're not already wrapped
  // Updated regex to properly capture + and - signs
  processed = processed.replace(/(?<!`)\b([+\-]?\d*\.?\d+)(?=\s|$|[^\d\.])(?!`)/g, (match, evaluation) => {
    // Check if it's a valid evaluation (not just any number)
    const isEvaluation = /^[+\-]?\d*\.?\d+$/.test(evaluation);
    const evalValue = parseFloat(evaluation);
    
    // Only wrap if it looks like a chess evaluation (reasonable range)
    if (isEvaluation && evalValue >= -10 && evalValue <= 10 && evaluation.length >= 2) {
      console.log('🎯 WRAPPING EVALUATION IN BACKTICKS:', evaluation);
      return `\`${evaluation}\``;
    }
    return match;
  });
  
  console.log('✅ Preprocessed result preview:', processed.substring(0, 200) + '...');
  return processed;
};

// Utility function to get the position before the move was played using the main game's move history
const getPositionBeforeMove = (position: number, pgn?: string): string => {
  if (!pgn) {
    console.warn('No PGN provided, cannot determine position before move');
    return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'; // Starting position
  }

  try {
    const chess = new Chess();
    chess.loadPgn(pgn);
    const moveHistory = chess.history();
    
    // Reset to starting position
    chess.reset();
    
    // The position field in CriticalMoment represents the move number (1-based)
    // We need to play moves up to position - 1 to get the position before that move
    const targetMoveIndex = position - 1; // Convert to 0-based index
    
    // Play moves up to (but not including) the critical move
    for (let i = 0; i < targetMoveIndex && i < moveHistory.length; i++) {
      try {
        chess.move(moveHistory[i]);
      } catch (error) {
        console.error('Error replaying move:', moveHistory[i], error);
        break;
      }
    }
    
    return chess.fen();
  } catch (error) {
    console.warn('Error getting position before move:', error);
    return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'; // Starting position
  }
};

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({
  currentMoment,
  criticalMoments,
  onMomentChange,
  isAnalyzing,
  pgn
}) => {
  // Parse the critical moment content from the analysis
  const parseCriticalMoment = (analysis: string) => {
    // Check if this is a structured analysis format (starts with ##)
    if (analysis.startsWith('## Critical Moment:')) {
      // Parse structured format
      const titleMatch = analysis.match(/##\s*Critical Moment:\s*(.+?)(?:\n|$)/);
      const explanationMatch = analysis.match(/\*\*Explanation:\*\*\s*([\s\S]*?)(?=\*\*Recommendation:|$)/);
      const recommendationMatch = analysis.match(/\*\*Recommendation:\*\*\s*`([^`]+)`/);
      const whyBetterMatch = analysis.match(/\*\*Why it's better:\*\*\s*([\s\S]*?)(?=\*\*Principle:|$)/);
      const principleMatch = analysis.match(/\*\*Principle:\*\*\s*([\s\S]*?)$/);
      
      return {
        title: titleMatch ? titleMatch[1].trim() : 'Critical Moment',
        move: '', // Will be filled from moveInfo
        explanation: explanationMatch ? explanationMatch[1].trim() : '',
        recommendation: recommendationMatch ? recommendationMatch[1].trim() : '',
        whyBetter: whyBetterMatch ? whyBetterMatch[1].trim() : '',
        principle: principleMatch ? principleMatch[1].trim() : '',
        fullContent: analysis
      };
    }
    
    // Legacy parsing for old markdown format with <critical_moment> tags
    const criticalMomentMatch = analysis.match(/<critical_moment>([\s\S]*?)<\/critical_moment>/);
    const content = criticalMomentMatch ? criticalMomentMatch[1].trim() : analysis;
    
    // Parse different sections from legacy format
    const titleMatch = content.match(/##\s*Critical Moment \d+:\s*(.+?)(?:\n|$)/);
    const moveMatch = content.match(/###\s*\*\*(.+?)\*\*/);
    const explanationMatch = content.match(/\*\*Explanation:\*\*\s*([\s\S]*?)(?=\*\*Recommendation:|$)/);
    const recommendationMatch = content.match(/\*\*Recommendation:\*\*\s*`([^`]+)`/);
    const whyBetterMatch = content.match(/\*\*Why it's better:\*\*\s*([\s\S]*?)(?=\*\*Principle:|$)/);
    const principleMatch = content.match(/\*\*Principle:\*\*\s*([\s\S]*?)$/);
    
    return {
      title: titleMatch ? titleMatch[1].trim() : 'Critical Moment',
      move: moveMatch ? moveMatch[1].trim() : '',
      explanation: explanationMatch ? explanationMatch[1].trim() : '',
      recommendation: recommendationMatch ? recommendationMatch[1].trim() : '',
      whyBetter: whyBetterMatch ? whyBetterMatch[1].trim() : '',
      principle: principleMatch ? principleMatch[1].trim() : '',
      fullContent: content
    };
  };

  const getEvaluationColor = (evaluation: string) => {
    const eval_num = parseFloat(evaluation);
    if (eval_num > 2) return 'bg-green-100 text-green-800';
    if (eval_num > 0.5) return 'bg-green-50 text-green-700';
    if (eval_num > -0.5) return 'bg-gray-100 text-gray-700';
    if (eval_num > -2) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase.toLowerCase()) {
      case 'opening': case 'early': return '🏃';
      case 'middlegame': case 'middle': return '⚔️';
      case 'endgame': case 'late': return '🏁';
      default: return '♟️';
    }
  };

  if (isAnalyzing) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <CardTitle className="text-lg mb-2">Analyzing Your Game</CardTitle>
          <CardDescription>
            Our AI is examining critical moments and generating detailed analysis...
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  if (criticalMoments.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Target className="h-16 w-16 text-gray-400 mb-4" />
          <CardTitle className="text-lg mb-2">No Analysis Yet</CardTitle>
          <CardDescription>
            Click the &quot;Analyze Game&quot; button to start analyzing critical moments in your game.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  const currentMomentData = criticalMoments[currentMoment - 1];
  const parsedMoment = parseCriticalMoment(currentMomentData?.analysis || '');

  return (
    <div className="w-full space-y-6">
      {/* Navigation Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMomentChange(currentMoment - 1)}
              disabled={currentMoment <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <div className="text-center flex-1">
              <CardTitle className="text-lg">
                Critical Moment {currentMoment} of {criticalMoments.length}
              </CardTitle>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMomentChange(currentMoment + 1)}
              disabled={currentMoment >= criticalMoments.length}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* AI Generated Insight - Moved to top for cleaner title area */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-blue-900 mb-1">Summary</div>
              <div className="text-sm text-blue-800 leading-relaxed">
                {currentMomentData.reason}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Moment Tabs */}
      <Tabs value={currentMoment.toString()} onValueChange={(value) => onMomentChange(parseInt(value))}>
        <TabsList className="grid w-full grid-cols-4">
          {criticalMoments.map((moment, index) => (
            <TabsTrigger key={index} value={(index + 1).toString()} className="text-sm">
              Moment {index + 1}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={currentMoment.toString()} className="space-y-6">
          {/* Move Details Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Critical Moment Analysis
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                    {getPhaseIcon(currentMomentData.phase)} {currentMomentData.phase}
                  </Badge>
                  <Badge className={`${getEvaluationColor(currentMomentData.evaluation)} border font-mono`}>
                    {parseFloat(currentMomentData.evaluation) > 0 ? '+' : ''}{currentMomentData.evaluation}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Move vs Best Move Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Move Actually Played
                  </div>
                  <div className="font-mono text-xl font-bold text-red-800 mb-1">
                    {currentMomentData.moveInfo}
                  </div>
                  <div className="text-xs text-red-600">
                    What happened in the game
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Recommended Best Move
                  </div>
                  <div className="font-mono text-xl font-bold text-green-800 mb-1">
                    {currentMomentData.moveNumber} {currentMomentData.bestMove}
                  </div>
                  <div className="text-xs text-green-600">
                    What the engine suggests
                  </div>
                </div>
              </div>

              {/* Mini Chess Board - Now below the move comparison */}
              <div className="flex justify-center">
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-800 mb-2 px-3">Position After Best Move</div>
                  <MiniChessBoard 
                    fen={getPositionBeforeMove(currentMomentData.position, pgn)}
                    bestMove={currentMomentData.bestMove}
                    size={250}
                    showCoordinates={true}
                    theme="blue"
                    className="shadow-sm"
                    showMoveLabel={false}
                    playBestMove={true}
                  />
                  <div className="text-xs text-gray-600 mt-3 px-3 leading-relaxed">
                    What the position would look like
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Explanation Section */}
              {parsedMoment.explanation && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-sm text-slate-700 mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    WHAT HAPPENED
                  </h4>
                  <div className="prose prose-sm max-w-none text-slate-800">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                      {preprocessChessNotation(parsedMoment.explanation)}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Why Better Section */}
              {parsedMoment.whyBetter && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <h4 className="font-semibold text-sm text-emerald-700 mb-3">
                    WHY IT&apos;S BETTER
                  </h4>
                  <div className="prose prose-sm max-w-none text-emerald-800">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                      {preprocessChessNotation(parsedMoment.whyBetter)}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Principle Section */}
              {parsedMoment.principle && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold text-sm text-amber-700 mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    KEY PRINCIPLE
                  </h4>
                  <div className="prose prose-sm max-w-none text-amber-800">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                      {preprocessChessNotation(parsedMoment.principle)}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Full Analysis Fallback */}
              {!parsedMoment.explanation && !parsedMoment.recommendation && (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                    {preprocessChessNotation(parsedMoment.fullContent || currentMomentData.analysis)}
                  </ReactMarkdown>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalysisDisplay;