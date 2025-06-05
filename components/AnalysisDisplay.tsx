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
import { ChevronLeft, ChevronRight, Target, TrendingUp, Lightbulb, BookOpen } from 'lucide-react';

interface AnalysisDisplayProps {
  currentMoment: number;
  criticalMoments: CriticalMoment[];
  onMomentChange: (momentNumber: number) => void;
  isAnalyzing: boolean;
}

// Custom components for ReactMarkdown to style chess moves
const components = {
  code: ({ node, inline, className, children, ...props }: any) => {
    // Check if this looks like chess notation
    const content = String(children).replace(/\n$/, '');
    
    // Add some logging to debug what we're receiving
    console.log('Code component checking:', content, 'inline:', inline);
    
    // Comprehensive chess notation patterns
    const isChessMove = (
      // Standard piece moves: Nf3, Be3, Qd4, etc.
      /^[KQRBN][a-h][1-8][\+\#]?$/.test(content) ||
      // Pawn moves: e4, a6, h5, etc.
      /^[a-h][1-8][\+\#]?$/.test(content) ||
      // Captures: Nxf7, exd5, Bxc6, etc.
      /^[KQRBN]?[a-h]?x[a-h][1-8][\+\#]?$/.test(content) ||
      // Castling: O-O, O-O-O
      /^O-O(-O)?[\+\#]?$/.test(content) ||
      // Move numbers with moves: 5. c3, 10... Bg7
      /^\d+\.{1,3}\s*([KQRBN]?[a-h]?[1-8]?[x]?[a-h][1-8]|O-O(-O)?)[\+\#]?$/.test(content) ||
      // UCI notation: e2e4, g1f3
      /^[a-h][1-8][a-h][1-8]$/.test(content) ||
      // Pawn promotion: a8=Q, h1=N
      /^[a-h][18]=[QRBN][\+\#]?$/.test(content) ||
      // Pawn pushes like d4-d5
      /^[a-h][1-8]-[a-h][1-8]$/.test(content)
    );
    
    if (inline && isChessMove) {
      console.log('✅ Applying amber styling to chess move:', content);
      return (
        <code
          className="bg-amber-50 border border-amber-200 px-2 py-1 rounded-md shadow-sm font-mono text-amber-800 font-semibold"
          {...props}
        >
          {children}
        </code>
      );
    }
    
    // Default code styling
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
};

// Since the AI should already be adding backticks, we don't need complex preprocessing
const preprocessChessNotation = (text: string): string => {
  return text; // Pass through unchanged since AI should handle backticks
};

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({
  currentMoment,
  criticalMoments,
  onMomentChange,
  isAnalyzing
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
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <Target className="h-3 w-3 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-blue-900 mb-1">AI Analysis</div>
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
                  {parsedMoment.move || currentMomentData.moveInfo}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {getPhaseIcon(currentMomentData.phase)} {currentMomentData.phase}
                  </Badge>
                  <Badge className={getEvaluationColor(currentMomentData.evaluation)}>
                    Eval: {currentMomentData.evaluation}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Best Move</div>
                  <div className="font-medium font-mono bg-gray-50 px-2 py-1 rounded shadow-sm border">
                    {currentMomentData.moveNumber} {currentMomentData.bestMove}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Best Response</div>
                  <div className="font-medium font-mono bg-gray-50 px-2 py-1 rounded shadow-sm border">
                    {currentMomentData.moveNumber.includes('.') ? currentMomentData.moveNumber.replace('.', '...') : currentMomentData.moveNumber + '...'} {currentMomentData.opponentsBestMove}
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
            <CardContent className="space-y-6">
              {/* Explanation Section */}
              {parsedMoment.explanation && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    WHAT HAPPENED
                  </h4>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                      {preprocessChessNotation(parsedMoment.explanation)}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              <Separator />

              {/* Recommendation Section */}
              {parsedMoment.recommendation && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    RECOMMENDED MOVE
                  </h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                      {`\`${parsedMoment.recommendation}\``}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Why Better Section */}
              {parsedMoment.whyBetter && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                    WHY IT&apos;S BETTER
                  </h4>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                      {preprocessChessNotation(parsedMoment.whyBetter)}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              <Separator />

              {/* Principle Section */}
              {parsedMoment.principle && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    KEY PRINCIPLE
                  </h4>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="prose prose-sm max-w-none text-amber-800">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                        {preprocessChessNotation(parsedMoment.principle)}
                      </ReactMarkdown>
                    </div>
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