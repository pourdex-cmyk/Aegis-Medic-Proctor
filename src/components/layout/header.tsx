"use client"

import React from "react"
import { Bell, Search, HelpCircle, Zap, Activity, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SimpleTooltip } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface HeaderProps {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  user?: {
    display_name: string
    email: string
    avatar_url?: string
    role?: string
  }
  orgName?: string
  activeRunId?: string
  notificationCount?: number
  onSignOut?: () => void
}

export function Header({
  title,
  subtitle,
  actions,
  user,
  orgName,
  activeRunId,
  notificationCount = 0,
  onSignOut,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-[#1e2330] bg-[#0a0c10]/90 backdrop-blur-sm px-6">
      {/* Left: Title */}
      <div className="flex items-center gap-3 min-w-0">
        {title && (
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-[#f0f4ff] truncate leading-tight">{title}</h1>
            {subtitle && <p className="text-xs text-[#4a5370] truncate">{subtitle}</p>}
          </div>
        )}
      </div>

      {/* Center: Actions */}
      {actions && <div className="flex-1 flex items-center justify-center">{actions}</div>}

      {/* Right: Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Active run pulse */}
        {activeRunId && (
          <Badge variant="critical" dot className="animate-pulse text-[10px]">
            Live Run
          </Badge>
        )}

        {/* Search */}
        <SimpleTooltip content="Search (⌘K)">
          <Button variant="ghost" size="icon-sm" className="text-[#4a5370] hover:text-[#9daabf]">
            <Search className="h-4 w-4" />
          </Button>
        </SimpleTooltip>

        {/* Notifications */}
        <SimpleTooltip content="Notifications">
          <div className="relative">
            <Button variant="ghost" size="icon-sm" className="text-[#4a5370] hover:text-[#9daabf]">
              <Bell className="h-4 w-4" />
            </Button>
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </div>
        </SimpleTooltip>

        {/* User menu */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#0f1117] transition-colors focus:outline-none focus:ring-1 focus:ring-blue-600/40">
                <Avatar size="sm">
                  {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                  <AvatarFallback>
                    {user.display_name?.slice(0, 2).toUpperCase() ?? "??"}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-3 w-3 text-[#4a5370]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>
                <div>
                  <p className="font-semibold text-sm text-[#f0f4ff]">{user.display_name}</p>
                  <p className="text-xs text-[#6b7594] font-normal">{user.email}</p>
                  {orgName && <p className="text-[10px] text-[#4a5370] font-normal mt-0.5">{orgName}</p>}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <HelpCircle className="h-4 w-4" />
                Help & Documentation
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onSignOut}>
                <Zap className="h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
