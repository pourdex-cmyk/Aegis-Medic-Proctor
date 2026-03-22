"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, Target, Users, BookOpen, FileText, BarChart3,
  Building2, UserCog, ScrollText, Settings, ChevronLeft, ChevronRight,
  Shield, LogOut, Activity
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SimpleTooltip } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"

const mainNavItems = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard, shortcut: "D" },
  { href: "/app/scenarios", label: "Scenarios", icon: Target, shortcut: "S" },
  { href: "/app/casualties", label: "Casualties", icon: Users, shortcut: "C" },
  { href: "/app/doctrine", label: "Doctrine", icon: BookOpen, shortcut: "K" },
  { href: "/app/reports", label: "Reports", icon: FileText, shortcut: "R" },
  { href: "/app/analytics", label: "Analytics", icon: BarChart3, shortcut: "A" },
]

const adminNavItems = [
  { href: "/app/admin", label: "Organization", icon: Building2 },
  { href: "/app/admin/users", label: "Users", icon: UserCog },
  { href: "/app/admin/audit", label: "Audit Log", icon: ScrollText },
  { href: "/app/settings", label: "Settings", icon: Settings },
]

interface SidebarProps {
  user?: {
    display_name: string
    email: string
    avatar_url?: string
    role?: string
  }
  orgName?: string
  activeRunId?: string
}

export function Sidebar({ user, orgName, activeRunId }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/sign-in")
    router.refresh()
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
      className="relative hidden md:flex flex-col h-screen bg-[#0a0c10] border-r border-[#1e2330] flex-shrink-0 z-20"
    >
      {/* Header */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-5 border-b border-[#1e2330]",
        collapsed && "px-3 justify-center"
      )}>
        <div className="flex-shrink-0 relative">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-900/40">
            <Shield className="h-4 w-4 text-white" />
          </div>
          {activeRunId && (
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-[#0a0c10] animate-pulse" />
          )}
        </div>
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <p className="text-sm font-bold text-[#f0f4ff] tracking-tight leading-tight">Aegis Medic</p>
              <p className="text-[10px] text-[#4a5370] font-medium uppercase tracking-widest leading-tight mt-0.5">Proctor</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Active run indicator */}
      {activeRunId && !collapsed && (
        <div className="mx-3 mt-3">
          <Link href={`/app/scenarios/${activeRunId}/run`}>
            <div className="flex items-center gap-2 rounded-lg bg-red-950/40 border border-red-800/50 px-3 py-2 hover:bg-red-950/60 transition-colors">
              <Activity className="h-3.5 w-3.5 text-red-400 shrink-0 animate-pulse" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-red-300">Live Run Active</p>
                <p className="text-[10px] text-red-400/70 truncate">Tap to return</p>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Org indicator */}
      {orgName && !collapsed && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-[#0f1117] border border-[#1e2330]">
          <p className="text-[10px] text-[#4a5370] font-medium uppercase tracking-wider mb-0.5">Organization</p>
          <p className="text-xs font-semibold text-[#9daabf] truncate">{orgName}</p>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto scrollable">
        {!collapsed && (
          <p className="px-3 py-1.5 text-[10px] font-semibold text-[#4a5370] uppercase tracking-widest">
            Platform
          </p>
        )}
        {mainNavItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/app/dashboard" && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <SimpleTooltip key={item.href} content={collapsed ? item.label : undefined} side="right">
              <Link href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 cursor-pointer group",
                    collapsed && "justify-center px-2",
                    active
                      ? "bg-[#1a2444] text-blue-300 border border-blue-800/50"
                      : "text-[#6b7594] hover:text-[#b8c4d6] hover:bg-[#0f1117]"
                  )}
                >
                  <Icon className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    active ? "text-blue-400" : "text-[#4a5370] group-hover:text-[#6b7594]"
                  )} />
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        className="truncate"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </Link>
            </SimpleTooltip>
          )
        })}

        <Separator className="my-2" />

        {!collapsed && (
          <p className="px-3 py-1.5 text-[10px] font-semibold text-[#4a5370] uppercase tracking-widest">
            Admin
          </p>
        )}
        {adminNavItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/app/admin" && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <SimpleTooltip key={item.href} content={collapsed ? item.label : undefined} side="right">
              <Link href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 cursor-pointer group",
                    collapsed && "justify-center px-2",
                    active
                      ? "bg-[#1a2444] text-blue-300 border border-blue-800/50"
                      : "text-[#6b7594] hover:text-[#b8c4d6] hover:bg-[#0f1117]"
                  )}
                >
                  <Icon className={cn(
                    "h-4 w-4 shrink-0",
                    active ? "text-blue-400" : "text-[#4a5370] group-hover:text-[#6b7594]"
                  )} />
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        className="truncate"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </Link>
            </SimpleTooltip>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[#1e2330] p-3 space-y-1">
        {user && (
          <div className={cn("flex items-center gap-2.5 rounded-lg p-2", collapsed && "justify-center")}>
            <Avatar size="sm">
              {user.avatar_url && <AvatarImage src={user.avatar_url} />}
              <AvatarFallback>
                {user.display_name?.slice(0, 2).toUpperCase() ?? "??"}
              </AvatarFallback>
            </Avatar>
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-xs font-semibold text-[#d3dce8] truncate leading-tight">{user.display_name}</p>
                  <p className="text-[10px] text-[#4a5370] truncate leading-tight">{user.role ?? "Proctor"}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        <SimpleTooltip content={collapsed ? "Sign Out" : undefined} side="right">
          <button
            onClick={handleSignOut}
            className={cn(
              "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#6b7594] hover:text-red-400 hover:bg-red-950/20 transition-all duration-150 cursor-pointer",
              collapsed && "justify-center px-2"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                >
                  Sign Out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </SimpleTooltip>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "absolute -right-3 top-[4.5rem] z-10 flex h-6 w-6 items-center justify-center rounded-full border border-[#2d3347] bg-[#0a0c10] text-[#6b7594] hover:text-[#b8c4d6] hover:bg-[#1e2330] transition-all shadow-lg"
        )}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </motion.aside>
  )
}
