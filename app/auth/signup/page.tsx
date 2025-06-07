'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth/context'
import { Mail, ArrowLeft, Sparkles, CheckCircle, UserPlus } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const { signUpWithEmail, user, loading: authLoading } = useAuth()
  const router = useRouter()

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await signUpWithEmail(email)
      if (error) {
        setError(error.message)
      } else {
        setSent(true)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Don't render if authenticated (will redirect)
  if (!authLoading && user) {
    return null
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-violet-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Minimal Header */}
        <header className="relative z-10 bg-white/60 backdrop-blur-xl border-b border-white/20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  AI Chess Coach
                </span>
              </Link>
            </div>
          </div>
        </header>

        <div className="relative z-10 flex items-center justify-center px-6 py-12 min-h-[calc(100vh-4rem)]">
          <div className="w-full max-w-md">
            {/* Success Card */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl flex items-center justify-center shadow-lg">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-gray-900">Check your email</h1>
                <p className="text-gray-600">
                  We've sent a magic link to <span className="font-medium text-gray-900">{email}</span>
                </p>
              </div>

              <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100/50">
                <p className="text-sm text-purple-700">
                  Click the link to create your account and sign in. The link expires in 1 hour.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <Button
                  onClick={() => setSent(false)}
                  variant="outline"
                  className="w-full h-12 rounded-xl border-gray-200 hover:bg-gray-50 transition-all duration-200"
                >
                  Send another link
                </Button>
                <Link href="/auth/login">
                  <Button 
                    variant="ghost" 
                    className="w-full h-12 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 transition-all duration-200"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to sign in
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-violet-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Minimal Header */}
      <header className="relative z-10 bg-white/60 backdrop-blur-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                AI Chess Coach
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:block">Already have an account?</span>
              <Link href="/auth/login">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="rounded-xl border-gray-200 hover:bg-white/80 transition-all duration-200"
                >
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex items-center justify-center px-6 py-12 min-h-[calc(100vh-4rem)]">
        <div className="w-full max-w-md">
          {/* Main Card */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                <UserPlus className="h-8 w-8 text-white" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold text-gray-900">Join AI Chess Coach</h1>
                <p className="text-gray-600">Start your chess mastery journey today</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="h-12 rounded-xl bg-white/50 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200"
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50/50 border border-red-200/50 rounded-xl">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="p-4 bg-gradient-to-r from-purple-50/50 to-pink-50/50 rounded-xl border border-purple-100/50">
                <p className="text-sm text-purple-700 text-center">
                  <span className="font-medium">✨ No password needed!</span><br />
                  We'll send you a secure magic link to get started.
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading || !email}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-3"></div>
                    Creating account...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-3" />
                    Create account
                  </>
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="text-center pt-4 border-t border-gray-200/50">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link 
                  href="/auth/login" 
                  className="font-medium text-purple-600 hover:text-purple-700 transition-colors duration-200"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Bottom text */}
          <div className="text-center mt-8 space-y-4">
            <p className="text-xs text-gray-500">
              Secure passwordless authentication powered by magic links
            </p>
            <p className="text-xs text-gray-400">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 