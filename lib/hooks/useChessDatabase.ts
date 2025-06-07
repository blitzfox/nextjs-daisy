import { useState, useCallback } from 'react'
import { DatabaseService } from '@/lib/supabase/database'
import { useAuth } from '@/lib/auth/context'
import type { GameSessionInsert, GameMomentInsert } from '@/lib/types'

export function useChessDatabase() {
  const { user } = useAuth()
  const [db] = useState(() => new DatabaseService())
  const [isSaving, setIsSaving] = useState(false)

  // Save a complete game session with moments
  const saveGameSession = useCallback(async (
    gameData: {
      game_id: string
      game_name: string
      platform: 'lichess' | 'chessdotcom'
      pgn?: string
      username?: string
      voice_enabled?: boolean
    },
    moments?: Array<{
      position_number: number
      move_number: string
      move_played?: string
      fen: string
      evaluation?: number
      win_chance?: number
      best_move?: string
      opponents_best_move?: string
      continuation?: string
      full_line?: string
      phase?: 'opening' | 'middlegame' | 'endgame'
      moment_type?: 'blunder' | 'mistake' | 'inaccuracy' | 'good_move' | 'brilliant'
      reason?: string
      analysis_text?: string
      audio_url?: string
      circle_annotation?: string
      summary?: string
    }>
  ) => {
    if (!user) {
      console.error('User not authenticated')
      return null
    }

    setIsSaving(true)
    try {
      // Create a unique game ID with timestamp to avoid conflicts
      const uniqueGameId = `${gameData.game_id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Create the game session
      const sessionData: GameSessionInsert = {
        user_id: user.id,
        timestamp: new Date().toISOString(),
        username: gameData.username || '',
        game_id: uniqueGameId,
        game_name: gameData.game_name,
        voice_enabled: gameData.voice_enabled || false,
        platform: gameData.platform,
        pgn: gameData.pgn,
        analysis_completed: moments ? moments.length > 0 : false
      }

      console.log('Attempting to save game session:', {
        user_id: sessionData.user_id,
        game_id: sessionData.game_id,
        platform: sessionData.platform
      })

      const session = await db.createGameSession(sessionData)
      if (!session) {
        throw new Error('Failed to create game session - no session returned')
      }

      console.log('✅ Game session created:', session.id)

      // Save moments if provided
      if (moments && moments.length > 0) {
        console.log(`Saving ${moments.length} critical moments...`)
        
        const momentData: GameMomentInsert[] = moments.map(moment => ({
          game_session_id: session.id,
          user_id: user.id,
          ...moment
        }))

        const savedMoments = await db.createGameMoments(momentData)
        console.log(`✅ Saved ${savedMoments.length} critical moments`)
      }

      console.log('✅ Game session saved successfully:', session.id)
      return session
    } catch (error: any) {
      console.error('❌ Error saving game session:', error)
      
      // Provide more detailed error information
      if (error?.code) {
        console.error('Database error code:', error.code)
      }
      if (error?.message) {
        console.error('Error message:', error.message)
      }
      if (error?.details) {
        console.error('Error details:', error.details)
      }
      
      return null
    } finally {
      setIsSaving(false)
    }
  }, [user, db])

  // Save a moment to user's saved collection
  const saveGameMoment = useCallback(async (
    gameMomentId: string,
    saveData?: {
      user_notes?: string
      tags?: string[]
      difficulty_rating?: number
    }
  ) => {
    if (!user) return null

    try {
      return await db.saveGameMoment(user.id, gameMomentId, saveData)
    } catch (error: any) {
      console.error('❌ Error saving game moment:', error)
      console.error('Error details:', error?.message, error?.code, error?.details)
      return null
    }
  }, [user, db])

  // Get user's game sessions
  const getUserGameSessions = useCallback(async (limit = 50) => {
    if (!user) return []

    try {
      return await db.getGameSessions(user.id, limit)
    } catch (error: any) {
      console.error('❌ Error fetching game sessions:', error)
      console.error('Error details:', error?.message, error?.code, error?.details)
      return []
    }
  }, [user, db])

  // Get user's saved moments
  const getUserSavedMoments = useCallback(async (filters?: {
    tags?: string[]
    mastery_level?: 'learning' | 'practicing' | 'mastered'
    phase?: 'opening' | 'middlegame' | 'endgame'
  }) => {
    if (!user) return []

    try {
      return await db.getSavedMoments(user.id, filters)
    } catch (error: any) {
      console.error('❌ Error fetching saved moments:', error)
      console.error('Error details:', error?.message, error?.code, error?.details)
      return []
    }
  }, [user, db])

  // Get user stats
  const getUserStats = useCallback(async () => {
    if (!user) return null

    try {
      return await db.getGameSessionStats(user.id)
    } catch (error: any) {
      console.error('❌ Error fetching user stats:', error)
      console.error('Error details:', error?.message, error?.code, error?.details)
      return null
    }
  }, [user, db])

  return {
    db,
    isSaving,
    saveGameSession,
    saveGameMoment,
    getUserGameSessions,
    getUserSavedMoments,
    getUserStats,
    isAuthenticated: !!user
  }
} 