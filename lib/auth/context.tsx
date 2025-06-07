'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithEmail: (email: string) => Promise<{ error: any }>
  signUpWithEmail: (email: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signInWithEmail = async (email: string) => {
    // For sign in, try with shouldCreateUser: false first
    // If user doesn't exist, we'll get a "Signups not allowed for otp" error
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: false, // Don't create new users on sign in
      },
    })
    
    // If we get the "signups not allowed" error, it means user doesn't exist
    if (error && error.message.toLowerCase().includes('signups not allowed')) {
      return { error: { message: 'No account found with this email address. Please sign up first.' } }
    }
    
    return { error }
  }

  const signUpWithEmail = async (email: string) => {
    // For sign up, we'll use a different approach
    // First try to sign in with shouldCreateUser: false to check if user exists
    const { error: checkError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: false,
      },
    })
    
    // If no error, user already exists
    if (!checkError) {
      return { error: { message: 'An account with this email already exists. Please sign in instead.' } }
    }
    
    // If we get "signups not allowed" error, user doesn't exist - proceed with signup
    if (checkError && checkError.message.toLowerCase().includes('signups not allowed')) {
      // Now send the actual signup magic link
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: true, // Allow creation for new users
        },
      })
      return { error }
    }
    
    // Some other error occurred
    return { error: checkError }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const value = {
    user,
    session,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 