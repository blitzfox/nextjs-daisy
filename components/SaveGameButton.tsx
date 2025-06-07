import { useState } from 'react'
import { useChessDatabase } from '@/lib/hooks/useChessDatabase'
import { Button } from '@/components/ui/button'
import { Save, Check, Loader2, AlertTriangle } from 'lucide-react'
import { useChessStore } from '@/lib/state/store'

interface SaveGameButtonProps {
  gameId?: string
  gameName?: string
  pgn?: string
  platform?: 'lichess' | 'chessdotcom'
  username?: string
  voiceEnabled?: boolean
  className?: string
}

// Helper function to normalize phase values to match database constraint
function normalizePhase(phase: string | undefined): 'opening' | 'middlegame' | 'endgame' | undefined {
  if (!phase) return undefined
  
  const lowerPhase = phase.toLowerCase()
  
  // Map all possible phase values to database-allowed values
  switch (lowerPhase) {
    case 'opening':
    case 'early':
      return 'opening'
    case 'middlegame':
    case 'middle':
      return 'middlegame'
    case 'endgame':
    case 'late':
      return 'endgame'
    default:
      // If it's an unknown phase, default to middlegame
      console.warn(`Unknown phase value: ${phase}, defaulting to middlegame`)
      return 'middlegame'
  }
}

export default function SaveGameButton({
  gameId,
  gameName,
  pgn,
  platform = 'lichess',
  username,
  voiceEnabled = false,
  className
}: SaveGameButtonProps) {
  const { saveGameSession, isSaving, isAuthenticated } = useChessDatabase()
  const { selectedGame, criticalMoments } = useChessStore()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSaveGame = async () => {
    if (!isAuthenticated) {
      alert('Please log in to save games')
      return
    }

    setError(null) // Clear previous errors

    // Use props or fall back to store data
    const gameToSave = {
      game_id: gameId || selectedGame?.id || `game-${Date.now()}`,
      game_name: gameName || selectedGame?.white + ' vs ' + selectedGame?.black || 'Chess Game',
      platform,
      pgn: pgn || selectedGame?.pgn,
      username: username || '',
      voice_enabled: voiceEnabled
    }

    console.log('SaveGameButton: Attempting to save game:', gameToSave)

    // Convert critical moments to database format
    const momentsToSave = criticalMoments.map((moment, index) => ({
      position_number: moment.position || index + 1,
      move_number: moment.moveNumber || `${index + 1}`,
      move_played: moment.moveInfo,
      fen: moment.fen,
      evaluation: parseFloat(moment.evaluation) || undefined,
      win_chance: undefined, // Not available in current format
      best_move: moment.bestMove,
      opponents_best_move: moment.opponentsBestMove,
      continuation: moment.continuation,
      full_line: moment.fullLine,
      phase: normalizePhase(moment.phase), // Use the normalize function
      moment_type: undefined, // Would need to determine from evaluation
      reason: moment.reason,
      analysis_text: moment.analysis,
      audio_url: moment.audioUrl,
      circle_annotation: moment.circle,
      summary: moment.summary
    }))

    console.log(`SaveGameButton: Saving ${momentsToSave.length} moments`)

    const result = await saveGameSession(gameToSave, momentsToSave)
    
    if (result) {
      setSaved(true)
      setError(null)
      setTimeout(() => setSaved(false), 3000) // Reset after 3 seconds
    } else {
      setError('Failed to save game. Check console for details.')
      setTimeout(() => setError(null), 5000) // Clear error after 5 seconds
    }
  }

  if (!isAuthenticated) {
    return null // Don't show button if not logged in
  }

  return (
    <Button
      onClick={handleSaveGame}
      disabled={isSaving || saved}
      className={className}
      variant={saved ? "default" : error ? "destructive" : "outline"}
    >
      {isSaving ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Saving...
        </>
      ) : saved ? (
        <>
          <Check className="mr-2 h-4 w-4" />
          Saved!
        </>
      ) : error ? (
        <>
          <AlertTriangle className="mr-2 h-4 w-4" />
          Error
        </>
      ) : (
        <>
          <Save className="mr-2 h-4 w-4" />
          Save Game
        </>
      )}
    </Button>
  )
} 