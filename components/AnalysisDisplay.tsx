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
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMomentChange(currentMoment - 1)}
                disabled={currentMoment <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <div className="text-center">
                <CardTitle className="text-lg">
                  Critical Moment {currentMoment} of {criticalMoments.length}
                </CardTitle>
                <CardDescription>{parsedMoment.title}</CardDescription>
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
          </div>
        </CardHeader>
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
                    {currentMomentData.evaluation}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Move Number</div>
                  <div className="font-medium">{currentMomentData.moveNumber}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Best Move</div>
                  <div className="font-medium font-mono">{currentMomentData.bestMove}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Opponent&apos;s Best</div>
                  <div className="font-medium font-mono">{currentMomentData.opponentsBestMove}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Game Phase</div>
                  <div className="font-medium">{currentMomentData.phase}</div>
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
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {parsedMoment.explanation}
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
                    <code className="text-lg font-mono text-blue-800 font-semibold">
                      {parsedMoment.recommendation}
                    </code>
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
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {parsedMoment.whyBetter}
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
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {parsedMoment.principle}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}

              {/* Full Analysis Fallback */}
              {!parsedMoment.explanation && !parsedMoment.recommendation && (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {parsedMoment.fullContent || currentMomentData.analysis}
                  </ReactMarkdown>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card className="bg-gradient-to-r from-slate-50 to-slate-100">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">
                <strong>Summary:</strong> {currentMomentData.reason}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalysisDisplay;