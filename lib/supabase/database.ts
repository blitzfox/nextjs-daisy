import { createClient } from './client'
import { 
  Profile, 
  GameSession, 
  GameMoment, 
  SavedMoment, 
  CriticalMomentsView,
  GameSessionInsert,
  GameMomentInsert,
  SavedMomentInsert 
} from '../types'

export class DatabaseService {
  private supabase = createClient()

  // Profile operations
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }

    return data
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      return null
    }

    return data
  }

  // Game Session operations
  async createGameSession(session: GameSessionInsert): Promise<GameSession | null> {
    try {
      console.log('DatabaseService: Creating game session with data:', {
        user_id: session.user_id,
        game_id: session.game_id,
        platform: session.platform,
        timestamp: session.timestamp
      })

      const { data, error } = await this.supabase
        .from('game_sessions')
        .insert(session)
        .select()
        .single()

      if (error) {
        console.error('DatabaseService: Supabase error creating game session:', error)
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        console.error('Error details:', error.details)
        console.error('Error hint:', error.hint)
        throw error
      }

      console.log('DatabaseService: Game session created successfully:', data?.id)
      return data
    } catch (error: any) {
      console.error('DatabaseService: Exception creating game session:', error)
      throw error
    }
  }

  async getGameSessions(userId: string, limit = 50): Promise<GameSession[]> {
    const { data, error } = await this.supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching game sessions:', error)
      return []
    }

    return data || []
  }

  async getGameSessionById(sessionId: string): Promise<GameSession | null> {
    const { data, error } = await this.supabase
      .from('game_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (error) {
      console.error('Error fetching game session:', error)
      return null
    }

    return data
  }

  async updateGameSession(sessionId: string, updates: Partial<GameSession>): Promise<GameSession | null> {
    const { data, error } = await this.supabase
      .from('game_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single()

    if (error) {
      console.error('Error updating game session:', error)
      return null
    }

    return data
  }

  // Game Moment operations
  async createGameMoment(moment: GameMomentInsert): Promise<GameMoment | null> {
    const { data, error } = await this.supabase
      .from('game_moments')
      .insert(moment)
      .select()
      .single()

    if (error) {
      console.error('Error creating game moment:', error)
      return null
    }

    return data
  }

  async createGameMoments(moments: GameMomentInsert[]): Promise<GameMoment[]> {
    const { data, error } = await this.supabase
      .from('game_moments')
      .insert(moments)
      .select()

    if (error) {
      console.error('Error creating game moments:', error)
      return []
    }

    return data || []
  }

  async getGameMoments(gameSessionId: string): Promise<GameMoment[]> {
    const { data, error } = await this.supabase
      .from('game_moments')
      .select('*')
      .eq('game_session_id', gameSessionId)
      .order('position_number', { ascending: true })

    if (error) {
      console.error('Error fetching game moments:', error)
      return []
    }

    return data || []
  }

  // Saved Moment operations
  async saveGameMoment(userId: string, gameMomentId: string, saveData: Partial<SavedMomentInsert> = {}): Promise<SavedMoment | null> {
    const savedMoment: SavedMomentInsert = {
      user_id: userId,
      game_moment_id: gameMomentId,
      practice_count: 0,
      ...saveData
    }

    const { data, error } = await this.supabase
      .from('saved_moments')
      .insert(savedMoment)
      .select()
      .single()

    if (error) {
      console.error('Error saving game moment:', error)
      return null
    }

    return data
  }

  async unsaveGameMoment(userId: string, gameMomentId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('saved_moments')
      .delete()
      .eq('user_id', userId)
      .eq('game_moment_id', gameMomentId)

    if (error) {
      console.error('Error unsaving game moment:', error)
      return false
    }

    return true
  }

  async getSavedMoments(userId: string, filters?: {
    tags?: string[]
    masteryLevel?: string
    difficultyRating?: number
  }): Promise<SavedMoment[]> {
    let query = this.supabase
      .from('saved_moments')
      .select(`
        *,
        game_moments(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (filters?.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags)
    }

    if (filters?.masteryLevel) {
      query = query.eq('mastery_level', filters.masteryLevel)
    }

    if (filters?.difficultyRating) {
      query = query.eq('difficulty_rating', filters.difficultyRating)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching saved moments:', error)
      return []
    }

    return data || []
  }

  async updateSavedMoment(userId: string, gameMomentId: string, updates: Partial<SavedMoment>): Promise<SavedMoment | null> {
    const { data, error } = await this.supabase
      .from('saved_moments')
      .update(updates)
      .eq('user_id', userId)
      .eq('game_moment_id', gameMomentId)
      .select()
      .single()

    if (error) {
      console.error('Error updating saved moment:', error)
      return null
    }

    return data
  }

  // Critical Moments View operations
  async getCriticalMoments(userId: string, filters?: {
    gameSessionId?: string
    phase?: string
    momentType?: string
    isOnlySaved?: boolean
    limit?: number
  }): Promise<CriticalMomentsView[]> {
    let query = this.supabase
      .from('critical_moments_view')
      .select('*')
      .eq('user_id', userId)
      .order('game_timestamp', { ascending: false })

    if (filters?.gameSessionId) {
      query = query.eq('game_session_id', filters.gameSessionId)
    }

    if (filters?.phase) {
      query = query.eq('phase', filters.phase)
    }

    if (filters?.momentType) {
      query = query.eq('moment_type', filters.momentType)
    }

    if (filters?.isOnlySaved) {
      query = query.eq('is_saved', true)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching critical moments:', error)
      return []
    }

    return data || []
  }

  // Analytics and stats
  async getGameSessionStats(userId: string): Promise<{
    totalSessions: number
    totalMoments: number
    savedMoments: number
    platforms: Record<string, number>
    momentTypes: Record<string, number>
  }> {
    // Get total sessions
    const { count: totalSessions } = await this.supabase
      .from('game_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Get total moments
    const { count: totalMoments } = await this.supabase
      .from('game_moments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Get saved moments count
    const { count: savedMoments } = await this.supabase
      .from('saved_moments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Get platform distribution
    const { data: platformData } = await this.supabase
      .from('game_sessions')
      .select('platform')
      .eq('user_id', userId)

    const platforms: Record<string, number> = {}
    platformData?.forEach(row => {
      if (row.platform) {
        platforms[row.platform] = (platforms[row.platform] || 0) + 1
      }
    })

    // Get moment types distribution
    const { data: momentData } = await this.supabase
      .from('game_moments')
      .select('moment_type')
      .eq('user_id', userId)

    const momentTypes: Record<string, number> = {}
    momentData?.forEach(row => {
      if (row.moment_type) {
        momentTypes[row.moment_type] = (momentTypes[row.moment_type] || 0) + 1
      }
    })

    return {
      totalSessions: totalSessions || 0,
      totalMoments: totalMoments || 0,
      savedMoments: savedMoments || 0,
      platforms,
      momentTypes
    }
  }

  // Practice operations
  async incrementPracticeCount(userId: string, gameMomentId: string): Promise<SavedMoment | null> {
    const { data, error } = await this.supabase
      .rpc('increment_practice_count', {
        p_user_id: userId,
        p_game_moment_id: gameMomentId
      })

    if (error) {
      console.error('Error incrementing practice count:', error)
      return null
    }

    return data
  }

  // Search operations
  async searchGameSessions(userId: string, searchTerm: string): Promise<GameSession[]> {
    const { data, error } = await this.supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', userId)
      .or(`game_name.ilike.%${searchTerm}%,white_player.ilike.%${searchTerm}%,black_player.ilike.%${searchTerm}%,opening_name.ilike.%${searchTerm}%`)
      .order('timestamp', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error searching game sessions:', error)
      return []
    }

    return data || []
  }
} 