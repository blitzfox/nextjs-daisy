'use client'

import * as React from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { ChessSidebar } from "@/components/chess-sidebar"
import { useChessStore } from '@/lib/state/store'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { 
    platform, 
    username,
    games,
    selectedGame,
    criticalMoments,
    isLoading,
    voiceAnalysisEnabled,
    setVoiceAnalysisEnabled,
  } = useChessStore()

  // Local state for UI-specific properties
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [currentMoment, setCurrentMoment] = React.useState(1)

  const handleAnalyze = React.useCallback(async () => {
    setIsAnalyzing(true)
    // This will be handled by the main page component
    // We'll emit an event or use a callback prop
    const event = new CustomEvent('chess-analyze')
    window.dispatchEvent(event)
    
    // Reset analyzing state after a delay (will be managed by actual analysis)
    setTimeout(() => setIsAnalyzing(false), 1000)
  }, [])

  const handleMomentChange = React.useCallback((moment: number) => {
    setCurrentMoment(moment)
    // Emit event for position change
    const event = new CustomEvent('chess-moment-change', { detail: { moment } })
    window.dispatchEvent(event)
  }, [])

  const handleToggleVoice = React.useCallback(() => {
    setVoiceAnalysisEnabled(!voiceAnalysisEnabled)
  }, [voiceAnalysisEnabled, setVoiceAnalysisEnabled])

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <ChessSidebar
          username={username}
          platform={platform}
          gamesCount={games.length}
          selectedGame={selectedGame}
          isAnalyzing={isAnalyzing}
          criticalMoments={criticalMoments}
          currentMoment={currentMoment}
          voiceEnabled={voiceAnalysisEnabled}
          onAnalyze={handleAnalyze}
          onMomentChange={handleMomentChange}
          onToggleVoice={handleToggleVoice}
        />
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar with trigger */}
          <header className="flex h-14 items-center border-b px-4 lg:px-6">
            <SidebarTrigger className="mr-4" />
            <div className="flex-1">
              <h1 className="text-lg font-semibold">Chess Analysis</h1>
            </div>
          </header>
          
          {/* Main content area */}
          <div className="flex-1 overflow-auto p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
} 