'use client'

import * as React from "react"
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import {
  Target,
  User,
  LogOut,
  Sparkles,
  BarChart3,
  Mic,
  MicOff,
  Home,
  UserCircle,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ChessSidebarProps {
  username?: string
  platform?: string
  gamesCount?: number
  selectedGame?: any
  isAnalyzing?: boolean
  criticalMoments?: any[]
  currentMoment?: number
  voiceEnabled?: boolean
  onAnalyze?: () => void
  onMomentChange?: (moment: number) => void
  onToggleVoice?: () => void
  children?: React.ReactNode
}

export function ChessSidebar({
  username,
  platform,
  gamesCount = 0,
  selectedGame,
  isAnalyzing = false,
  criticalMoments = [],
  currentMoment = 1,
  voiceEnabled = false,
  onAnalyze,
  onMomentChange,
  onToggleVoice,
  children,
}: ChessSidebarProps) {
  const router = useRouter()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
  }

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">AI Chess Coach</span>
            <span className="truncate text-xs text-muted-foreground">Grandmaster Analysis</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* User & Platform Info */}
        {username && (
          <div className="py-2">
            <Card className="mx-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <User className="size-3" />
                    Player Profile
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {platform}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{username}</span>
                  <span className="text-muted-foreground">{gamesCount} games</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Critical Moments Navigation */}
        {criticalMoments.length > 0 && (
          <div className="py-2">
            <Card className="mx-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="size-3" />
                  Critical Moments
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 space-y-2">
                <div className="flex flex-wrap gap-1">
                  {criticalMoments.map((_, index) => (
                    <Button
                      key={index + 1}
                      size="sm"
                      variant={currentMoment === index + 1 ? "default" : "outline"}
                      className="h-6 w-6 p-0 text-xs"
                      onClick={() => onMomentChange?.(index + 1)}
                    >
                      {index + 1}
                    </Button>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  Moment {currentMoment} of {criticalMoments.length}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation Menu */}
        <div className="flex-1 py-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => router.push('/')}>
                <Home className="size-4" />
                <span>Game Analysis</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => onAnalyze?.()}
                disabled={!selectedGame}
                className={!selectedGame ? "opacity-50 cursor-not-allowed" : ""}
              >
                <Target className="size-4" />
                <span>Critical Moments</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => onToggleVoice?.()}>
                {voiceEnabled ? <Mic className="size-4" /> : <MicOff className="size-4" />}
                <span>Voice Analysis</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => router.push('/dashboard')}>
                <UserCircle className="size-4" />
                <span>Profile</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        <div className="space-y-2">
          {/* User Info */}
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50">
            <div className="flex aspect-square size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <User className="size-3" />
            </div>
            <div className="grid flex-1 text-left text-xs leading-tight">
              <span className="truncate font-medium">
                {user?.email?.split('@')[0] || 'User'}
              </span>
              <span className="truncate text-muted-foreground">
                {user?.email || 'Not signed in'}
              </span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 justify-start gap-2 h-8"
              onClick={() => router.push('/dashboard')}
            >
              <BarChart3 className="size-3" />
              Dashboard
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={handleSignOut}
            >
              <LogOut className="size-3" />
            </Button>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
} 