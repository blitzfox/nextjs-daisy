'use client'

import * as React from "react"
import {
  BookOpen,
  Bot,
  Command,
  LifeBuoy,
  Send,
  Settings2,
  SquareTerminal,
  Triangle,
  Users2,
  ChevronUp,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Eye,
  Target,
  Trophy,
  Clock,
  Activity,
  Gamepad2,
  Zap,
  ChevronDown,
  ChevronRight,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

// This is sample data.
const data = {
  navMain: [
    {
      title: "Game Analysis",
      url: "#",
      icon: Activity,
      isActive: true,
      items: [
        {
          title: "Critical Moments",
          url: "#",
          icon: Target,
          isActive: true,
        },
        {
          title: "Opening Analysis",
          url: "#",
          icon: Play,
        },
        {
          title: "Endgame Study",
          url: "#",
          icon: Trophy,
        },
      ],
    },
    {
      title: "Game Library",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Recent Games",
          url: "#",
          icon: Clock,
        },
        {
          title: "Favorites",
          url: "#",
          icon: Trophy,
        },
        {
          title: "Import PGN",
          url: "#",
          icon: Send,
        },
      ],
    },
    {
      title: "AI Coach",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Analysis Settings",
          url: "#",
          icon: Settings2,
        },
        {
          title: "Voice Settings",
          url: "#",
          icon: Volume2,
        },
      ],
    },
  ],
}

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
  const [openSections, setOpenSections] = React.useState<string[]>(["Game Analysis"])

  const toggleSection = (title: string) => {
    setOpenSections(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title)
        : [...prev, title]
    )
  }

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="gap-3 border-b p-4">
        <div className="flex items-center gap-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Command className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Grandmaster AI</span>
            <span className="truncate text-xs text-muted-foreground">Chess Coach</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* User & Platform Info */}
        {username && (
          <div className="p-4 space-y-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Player Profile</span>
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

        <ScrollArea className="flex-1">
          <SidebarMenu className="px-2">
            {data.navMain.map((item) => (
              <Collapsible
                key={item.title}
                open={openSections.includes(item.title)}
                onOpenChange={() => toggleSection(item.title)}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title} className="w-full justify-between">
                      <div className="flex items-center gap-2">
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </div>
                      {openSections.includes(item.title) ? (
                        <ChevronDown className="size-4" />
                      ) : (
                        <ChevronRight className="size-4" />
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <button className="flex items-center gap-2 w-full">
                              <subItem.icon className="size-3" />
                              <span>{subItem.title}</span>
                            </button>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </ScrollArea>

        {/* Analysis Controls */}
        {selectedGame && (
          <div className="p-4 space-y-3 border-t">
            <div className="space-y-2">
              <h3 className="font-medium text-sm flex items-center gap-2">
                <Zap className="size-4" />
                Analysis Controls
              </h3>
              <Button 
                onClick={onAnalyze}
                disabled={isAnalyzing}
                className="w-full"
                size="sm"
              >
                {isAnalyzing ? (
                  <>
                    <Activity className="size-3 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Target className="size-3 mr-2" />
                    Find Critical Moments
                  </>
                )}
              </Button>
              
              <Button
                onClick={onToggleVoice}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {voiceEnabled ? (
                  <>
                    <Volume2 className="size-3 mr-2" />
                    Voice: ON
                  </>
                ) : (
                  <>
                    <VolumeX className="size-3 mr-2" />
                    Voice: OFF
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Critical Moments Navigation */}
        {criticalMoments.length > 0 && (
          <div className="p-4 space-y-3 border-t">
            <h3 className="font-medium text-sm flex items-center gap-2">
              <Eye className="size-4" />
              Critical Moments
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {criticalMoments.slice(0, 4).map((moment, index) => (
                <Button
                  key={index}
                  onClick={() => onMomentChange?.(index + 1)}
                  variant={currentMoment === index + 1 ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-8"
                >
                  Moment {index + 1}
                </Button>
              ))}
            </div>
            
            {/* Moment Navigation Controls */}
            <div className="flex justify-center gap-1">
              <Button
                onClick={() => onMomentChange?.(Math.max(1, currentMoment - 1))}
                disabled={currentMoment <= 1}
                variant="outline"
                size="sm"
                className="px-2"
              >
                <SkipBack className="size-3" />
              </Button>
              <Button
                onClick={() => onMomentChange?.(Math.min(criticalMoments.length, currentMoment + 1))}
                disabled={currentMoment >= criticalMoments.length}
                variant="outline"
                size="sm"
                className="px-2"
              >
                <SkipForward className="size-3" />
              </Button>
            </div>
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Users2 className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Support</span>
                <span className="truncate text-xs">Help & Feedback</span>
              </div>
              <ChevronUp className="ml-auto size-4" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
} 