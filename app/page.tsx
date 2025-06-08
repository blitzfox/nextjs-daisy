'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import PlatformSelector from '@/components/PlatformSelector';
import GameSelector from '@/components/GameSelector';
import ChessBoard from '@/components/ChessBoard';
import AnalysisDisplay from '@/components/AnalysisDisplay';
import AudioPlayer from '@/components/AudioPlayer';
import SaveGameButton from '@/components/SaveGameButton';
import { useChessStore } from '@/lib/state/store';
import { analyzeCriticalMoments } from '@/lib/analysis/criticalMoments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Sparkles, 
  Target, 
  Search, 
  Gamepad2, 
  Zap,
  Crown,
  Gamepad,
  TrendingUp,
  PlayCircle,
  Eye,
  Brain,
  Star,
  Volume2,
  VolumeX
} from 'lucide-react';
import { AppLayout } from '@/components/app-layout';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  // Move useChessStore to top level - hooks must always be called in the same order
  const { 
    platform, 
    setUsername: storeSetUsername,
    fetchGames,
    games,
    selectedGame,
    criticalMoments,
    setCriticalMoments,
    currentGameMoves,
    startingPosition,
    setStartingPosition,
    circles,
    setCircles
  } = useChessStore();

  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentMoment, setCurrentMoment] = useState(1);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  // Define all functions before useEffect hooks
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    storeSetUsername(username);
    
    try {
      await fetchGames(username, platform);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Start analysis
  const handleAnalyze = async () => {
    if (!selectedGame || !currentGameMoves) return;
    
    setIsAnalyzing(true);
    
    try {
      // Analyze the game
      const moments = await analyzeCriticalMoments(currentGameMoves);
      setCriticalMoments(moments);
      
      // Set starting position for first moment
      if (moments.length > 0) {
        setStartingPosition(moments[0].position);
        
        // Set circles for board visualization
        const newCircles: Record<number, string> = {};
        moments.forEach((moment, index) => {
          newCircles[index + 1] = moment.circle || '';
        });
        setCircles(newCircles);
      }
    } catch (error) {
      console.error('Error analyzing game:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle moment navigation
  const handleMomentChange = (momentNumber: number) => {
    if (momentNumber < 1 || momentNumber > criticalMoments.length) return;
    
    setCurrentMoment(momentNumber);
    
    // Update board position
    if (criticalMoments[momentNumber - 1]) {
      setStartingPosition(criticalMoments[momentNumber - 1].position);
    }
  };

  // Toggle voice analysis
  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
  };
  
  // ALL useEffect hooks must be at the top level
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Use default username based on platform for demo purposes
  useEffect(() => {
    if (platform === 'lichess') {
      setUsername('nightfox');
    } else {
      setUsername('Hikaru');
    }
  }, [platform]);

  // Listen for sidebar events
  useEffect(() => {
    const handleAnalyzeEvent = () => {
      handleAnalyze();
    };
    
    const handleMomentChangeEvent = (event: CustomEvent) => {
      handleMomentChange(event.detail.moment);
    };

    window.addEventListener('chess-analyze', handleAnalyzeEvent);
    window.addEventListener('chess-moment-change', handleMomentChangeEvent as EventListener);

    return () => {
      window.removeEventListener('chess-analyze', handleAnalyzeEvent);
      window.removeEventListener('chess-moment-change', handleMomentChangeEvent as EventListener);
    };
  }, [selectedGame, currentGameMoves]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <AppLayout>
      <div className="min-h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Top Section - Platform, Username, and Game Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Platform & Username */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="p-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                    <Search className="h-3 w-3 text-white" />
                  </div>
                  Platform & Username
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <PlatformSelector />
                
                <form onSubmit={handleSubmit} className="space-y-2">
                  <div>
                    <label htmlFor="username" className="block text-xs font-medium text-gray-700 mb-1">
                      {platform === 'lichess' ? 'Lichess Username' : 'Chess.com Username'}
                    </label>
                    <Input
                      type="text"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username..."
                      className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 h-8 text-sm"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-8 text-sm"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-white mr-2"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-2 w-2 mr-2" />
                        Get Games
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Game Selection */}
            <Card className="lg:col-span-2 bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                    <Gamepad className="h-4 w-4 text-white" />
                  </div>
                  <span className="truncate">Game Selection</span>
                  {games.length > 0 && (
                    <Badge variant="secondary" className="ml-auto flex-shrink-0 text-xs">
                      {games.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="min-w-0">
                {games.length > 0 ? (
                  <div className="overflow-hidden">
                    <GameSelector games={games} />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Gamepad className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium mb-1 text-sm">No games loaded yet</p>
                    <p className="text-gray-400 text-xs">
                      Enter your username and click &quot;Get Games&quot; to see your recent games
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Analysis Controls Toolbar - Key Actions */}
          {selectedGame && (
            <Card className="bg-white border-gray-200 shadow-lg mb-8">
              <CardContent className="p-6">
                {/* Selected Game Info Section */}
                <div className="mb-6 pb-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-purple-500" />
                      <span className="font-medium text-gray-700 text-sm">Selected Game</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-gray-900">{selectedGame.white}</span>
                      <span className="text-gray-400 text-sm">vs</span>
                      <span className="font-semibold text-gray-900">{selectedGame.black}</span>
                      <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-medium">
                        {selectedGame.result}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Zap className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">AI Analysis Controls</h3>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Main Analysis Button */}
                    <Button 
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      size="lg"
                      className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Target className="h-4 w-4 mr-2" />
                          Find Critical Moments
                        </>
                      )}
                    </Button>
                    
                    {/* Voice Toggle Button */}
                    <Button
                      onClick={toggleVoice}
                      variant={voiceEnabled ? "default" : "outline"}
                      size="lg"
                      className={voiceEnabled 
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm hover:shadow-md transition-all duration-200"
                      }
                    >
                      {voiceEnabled ? (
                        <>
                          <Volume2 className="h-4 w-4 mr-2" />
                          Voice ON
                        </>
                      ) : (
                        <>
                          <VolumeX className="h-4 w-4 mr-2" />
                          Voice OFF
                        </>
                      )}
                    </Button>

                    {/* Save Game Button - only show after analysis */}
                    {criticalMoments.length > 0 && (
                      <SaveGameButton
                        platform={platform}
                        username={username}
                        voiceEnabled={voiceEnabled}
                        className="bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
                      />
                    )}
                  </div>
                </div>
                
                {/* Progress/Status Indicator */}
                {criticalMoments.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700 font-medium text-sm">
                        Analysis Complete: {criticalMoments.length} critical moments found
                      </span>
                      <Badge className="bg-green-50 text-green-700 border border-green-200 text-xs">
                        Ready for Review
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Main Content - AI Analysis and Chess Board */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* AI Analysis */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                    <Brain className="h-4 w-4 text-white" />
                  </div>
                  <span className="truncate">AI Analysis</span>
                  {isAnalyzing && (
                    <div className="ml-auto flex-shrink-0">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="min-w-0">
                <AnalysisDisplay 
                  currentMoment={currentMoment}
                  criticalMoments={criticalMoments}
                  onMomentChange={handleMomentChange}
                  isAnalyzing={isAnalyzing}
                  pgn={selectedGame?.pgn}
                />
                
                {/* Audio Player */}
                {voiceEnabled && criticalMoments.length > 0 && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2 text-sm">
                      <PlayCircle className="h-3 w-3 text-blue-500" />
                      Voice Analysis
                    </h4>
                    <AudioPlayer 
                      momentNumber={currentMoment}
                      criticalMoments={criticalMoments}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chess Board */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <span className="truncate">Chess Board</span>
                  {criticalMoments.length > 0 && (
                    <Badge className="ml-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white flex-shrink-0 text-xs">
                      {currentMoment}/4
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {selectedGame ? (
                  <div className="w-full">
                    <ChessBoard 
                      fen={selectedGame.fen || 'start'} 
                      position={startingPosition}
                      circle={circles[currentMoment] || ''}
                      pgn={selectedGame.pgn || ''}
                      whitePlayer={selectedGame.white || 'White'}
                      blackPlayer={selectedGame.black || 'Black'}
                      onMoveChange={(moveIndex) => setStartingPosition(moveIndex)}
                    />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border-2 border-dashed border-gray-200">
                      <Gamepad className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                      <p className="text-gray-600 font-medium mb-1 text-sm">Ready to analyze</p>
                      <p className="text-gray-500 text-xs">
                        Select a game from above to start analyzing critical positions
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}