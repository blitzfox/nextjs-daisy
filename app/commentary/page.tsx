'use client';

import { useState, useEffect } from 'react';
import { useChessStore } from '@/lib/state/store';
import { AICommentary, CommentaryLevel, CommentaryRequest, MoveCommentary } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  MessageSquare, 
  BookOpen, 
  Trophy, 
  Clock, 
  TrendingUp,
  Users,
  Sparkles,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Target,
  Star,
  Search,
  PlayCircle
} from 'lucide-react';
import PlatformSelector from '@/components/PlatformSelector';
import GameSelector from '@/components/GameSelector';
import ChessBoard from '@/components/ChessBoard';

export default function CommentaryPage() {
  const [username, setUsername] = useState('');
  const [isLoadingGames, setIsLoadingGames] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<CommentaryLevel>('beginner');
  const [commentary, setCommentary] = useState<AICommentary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState('');
  const [partialCommentary, setPartialCommentary] = useState<MoveCommentary[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const [selectedTab, setSelectedTab] = useState('summary');
  
  const { 
    platform,
    games,
    selectedGame,
    fetchGames,
    setUsername: storeSetUsername
  } = useChessStore();

  // Use default username based on platform for demo purposes
  useEffect(() => {
    if (platform === 'lichess') {
      setUsername('nightfox');
    } else {
      setUsername('Hikaru');
    }
  }, [platform]);

  const handleFetchGames = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingGames(true);
    storeSetUsername(username);
    
    try {
      await fetchGames(username, platform);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setIsLoadingGames(false);
    }
  };

  // Auto-advance moves when autoplay is enabled
  useEffect(() => {
    if (!autoplay || !commentary) return;
    
    const interval = setInterval(() => {
      setCurrentMoveIndex(prev => {
        const next = prev + 1;
        if (next >= commentary.moveCommentary.length) {
          setAutoplay(false);
          return prev;
        }
        return next;
      });
    }, 3000); // 3 seconds per move
    
    return () => clearInterval(interval);
  }, [autoplay, commentary]);

  const generateCommentary = async () => {
    if (!selectedGame) return;
    
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationMessage('Starting commentary generation...');
    setPartialCommentary([]);
    setCommentary(null);

    try {
      const request: CommentaryRequest = {
        pgn: selectedGame.pgn,
        level: selectedLevel,
        gameInfo: {
          white: selectedGame.white,
          black: selectedGame.black,
          result: selectedGame.result,
          date: selectedGame.date,
          tournament: selectedGame.opening // Using opening field for tournament info
        }
      };

      const response = await fetch('/api/commentary/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error('Failed to generate commentary');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));
                
                switch (data.type) {
                  case 'progress':
                    setGenerationProgress(data.progress);
                    setGenerationMessage(data.message);
                    
                    // Add batch data to partial commentary if available
                    if (data.batchData) {
                      setPartialCommentary(prev => [...prev, ...data.batchData]);
                    }
                    break;
                    
                  case 'complete':
                    setCommentary(data.commentary);
                    setCurrentMoveIndex(0);
                    setSelectedTab('moves');
                    setGenerationProgress(100);
                    setGenerationMessage(data.message || 'Commentary generation complete!');
                    break;
                    
                  case 'error':
                    throw new Error(data.error);
                }
              } catch (parseError) {
                console.error('Error parsing streaming data:', parseError);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating commentary:', error);
      setGenerationMessage('Error generating commentary');
    } finally {
      setIsGenerating(false);
    }
  };

  const currentMove = commentary?.moveCommentary[currentMoveIndex];
  const progress = commentary ? ((currentMoveIndex + 1) / commentary.moveCommentary.length) * 100 : 0;

  const getMomentumIcon = (shift?: string) => {
    switch (shift) {
      case 'white': return '↗️';
      case 'black': return '↘️';
      default: return '➡️';
    }
  };

  const getMomentumColor = (shift?: string) => {
    switch (shift) {
      case 'white': return 'text-blue-600';
      case 'black': return 'text-gray-800';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Chess Coach
          </h1>
          <p className="text-lg text-gray-600">
            Get chess commentary in the style of Take Take Take
          </p>
        </div>

        {/* Game Selection & Level Choice */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Game Selection */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
                Select Game
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <PlatformSelector />
              
              <form onSubmit={handleFetchGames} className="space-y-3">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    {platform === 'lichess' ? 'Lichess Username' : 'Chess.com Username'}
                  </label>
                  <Input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username..."
                    className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 h-9"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoadingGames}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-9"
                >
                  {isLoadingGames ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-3 w-3 mr-2" />
                      Get Games
                    </>
                  )}
                </Button>
              </form>
              
              {games.length > 0 && <GameSelector games={games} />}
            </CardContent>
          </Card>

          {/* Commentary Settings */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg">
                  <Users className="h-4 w-4 text-white" />
                </div>
                Commentary Level
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={selectedLevel === 'beginner' ? 'default' : 'outline'}
                  onClick={() => setSelectedLevel('beginner')}
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                >
                  <Target className="h-5 w-5" />
                  <div className="text-center">
                    <div className="font-medium">Beginner</div>
                    <div className="text-xs opacity-75">~600 Rating</div>
                  </div>
                </Button>
                <Button
                  variant={selectedLevel === 'intermediate' ? 'default' : 'outline'}
                  onClick={() => setSelectedLevel('intermediate')}
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                >
                  <Star className="h-5 w-5" />
                  <div className="text-center">
                    <div className="font-medium">Intermediate</div>
                    <div className="text-xs opacity-75">~1500 Rating</div>
                  </div>
                </Button>
              </div>
              
              <Button
                onClick={generateCommentary}
                disabled={!selectedGame || isGenerating}
                className={`w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 ${isGenerating ? 'h-auto py-4' : ''}`}
              >
                {isGenerating ? (
                  <div className="w-full space-y-3">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      <span className="text-sm">{generationMessage || 'Generating Commentary...'}</span>
                    </div>
                    <Progress value={generationProgress} className="h-2 bg-white/20" />
                  </div>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Commentary
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview During Generation */}
        {isGenerating && partialCommentary.length > 0 && (
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                Live Commentary Preview ({partialCommentary.length} moves generated)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {partialCommentary.slice(-5).map((move, index) => (
                  <div key={index} className="border-l-2 border-blue-200 pl-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="font-mono text-xs">
                        {move.movePlayed}
                      </Badge>
                      {move.isHighlight && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Star className="h-3 w-3 mr-1" />
                          Key
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {move.commentary}
                    </p>
                  </div>
                ))}
                {partialCommentary.length > 5 && (
                  <p className="text-xs text-gray-500 text-center">
                    ... and {partialCommentary.length - 5} more moves
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Commentary Display */}
        {commentary && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chess Board */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                      <Trophy className="h-4 w-4 text-white" />
                    </div>
                    Game Position
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {(() => {
                        const fullMoveNumber = Math.floor(currentMoveIndex / 2) + 1;
                        const isWhiteMove = currentMoveIndex % 2 === 0;
                        const totalFullMoves = Math.ceil(commentary.moveCommentary.length / 2);
                        return `${isWhiteMove ? 'White' : 'Black'} Move ${fullMoveNumber} / ${totalFullMoves}`;
                      })()}
                    </Badge>
                    {currentMove?.isHighlight && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Star className="h-3 w-3 mr-1" />
                        Key Moment
                      </Badge>
                    )}
                  </div>
                </div>
                <Progress value={progress} className="h-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <ChessBoard
                    fen={currentMove?.fen || 'start'}
                    position={currentMoveIndex}
                    pgn={selectedGame?.pgn || ''}
                    whitePlayer={selectedGame?.white || 'White'}
                    blackPlayer={selectedGame?.black || 'Black'}
                    onMoveChange={setCurrentMoveIndex}
                  />
                  
                  {/* Move Controls */}
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentMoveIndex(Math.max(0, currentMoveIndex - 1))}
                      disabled={currentMoveIndex === 0}
                    >
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAutoplay(!autoplay)}
                    >
                      {autoplay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentMoveIndex(Math.min(commentary.moveCommentary.length - 1, currentMoveIndex + 1))}
                      disabled={currentMoveIndex >= commentary.moveCommentary.length - 1}
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Commentary Content */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                    <MessageSquare className="h-4 w-4 text-white" />
                  </div>
                  Commentary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="summary">Game Summary</TabsTrigger>
                    <TabsTrigger value="moves">Live Commentary</TabsTrigger>
                    <TabsTrigger value="highlights">Key Moments</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="summary" className="space-y-4 mt-4">
                    <div className="prose prose-sm max-w-none">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {commentary.gameSummary.title}
                      </h3>
                      <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {commentary.gameSummary.content}
                      </div>
                    </div>
                    
                    {commentary.progressiveSummaries.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Progressive Summaries</h4>
                        {commentary.progressiveSummaries.map((summary, index) => (
                          <Card key={index} className="border border-gray-200">
                            <CardContent className="p-4">
                              <h5 className="font-medium text-sm text-gray-900 mb-2">
                                {summary.title}
                              </h5>
                              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                                {summary.content}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="moves" className="space-y-4 mt-4">
                    {currentMove && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-mono">
                            {currentMove.movePlayed}
                          </Badge>
                          <span className={`text-lg ${getMomentumColor(currentMove.momentumShift)}`}>
                            {getMomentumIcon(currentMove.momentumShift)}
                          </span>
                          {currentMove.isHighlight && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Star className="h-3 w-3 mr-1" />
                              Highlight
                            </Badge>
                          )}
                        </div>
                        
                        <div className="prose prose-sm max-w-none">
                          <p className="text-gray-700 leading-relaxed">
                            {currentMove.commentary}
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <h5 className="font-medium text-sm text-gray-900">Key Ideas:</h5>
                          <div className="flex flex-wrap gap-2">
                            {currentMove.keyIdeas.map((idea, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {idea}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="highlights" className="space-y-3 mt-4">
                    {commentary.keyHighlights.map((highlight, index) => (
                      <Card 
                        key={index} 
                        className="border border-yellow-200 bg-yellow-50 cursor-pointer hover:bg-yellow-100 transition-colors"
                        onClick={() => {
                          const moveIndex = commentary.moveCommentary.findIndex(
                            m => m.moveNumber === highlight.moveNumber
                          );
                          if (moveIndex !== -1) {
                            setCurrentMoveIndex(moveIndex);
                            setSelectedTab('moves');
                          }
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Star className="h-5 w-5 text-yellow-600 mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="font-mono text-xs">
                                  {highlight.moveNumber}
                                </Badge>
                                <h5 className="font-medium text-sm text-gray-900">
                                  {highlight.title}
                                </h5>
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {highlight.description}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!commentary && !isGenerating && (
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="text-center py-12">
              <div className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border-2 border-dashed border-gray-200">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p className="text-gray-600 font-medium mb-1">Ready for Commentary</p>
                <p className="text-gray-500 text-sm">
                  Select a game above and choose your skill level to generate AI commentary
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 