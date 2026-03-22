"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Target, Users, BookOpen, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FileText, BarChart3, Building2, Settings, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const primaryNav = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/scenarios", label: "Scenarios", icon: Target },
  { href: "/app/casualties", label: "Casualties", icon: Users },
  { href: "/app/doctrine", label: "Doctrine", icon: BookOpen },
]

const moreNav = [
  { href: "/app/reports", label: "Reports", icon: FileText },
  { href: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/app/admin", label: "Organization", icon: Building2 },
  { href: "/app/settings", label: "Settings", icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [moreOpen, setMoreOpen] = useState(false)

  const isMoreActive = moreNav.some(
    (item) => pathname === item.href || pathname.startsWith(item.href)
  )

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/sign-in")
    router.refresh()
  }

  return (
    <>
      {/* More drawer overlay */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
              className="fixed bottom-16 left-0 right-0 z-50 md:hidden bg-[#0d0f14] border-t border-[#1e2330] rounded-t-2xl pb-2 pt-3 shadow-2xl"
            >
              <div className="w-10 h-1 bg-[#2d3347] rounded-full mx-auto mb-4" />
              <div className="px-4 space-y-1">
                {moreNav.map((item) => {
                  const Icon = item.icon
                  const active = pathname === item.href || pathname.startsWith(item.href)
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)}>
                      <div className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                        active
                          ? "bg-[#1a2444] text-blue-300"
                          : "text-[#6b7594] hover:text-[#b8c4d6] hover:bg-[#0f1117]"
                      )}>
                        <Icon className={cn("h-5 w-5 shrink-0", active ? "text-blue-400" : "text-[#4a5370]")} />
                        {item.label}
                      </div>
                    </Link>
                  )
                })}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[#6b7594] hover:text-red-400 hover:bg-red-950/20 transition-colors"
                >
                  <LogOut className="h-5 w-5 shrink-0 text-[#4a5370]" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#0a0c10] border-t border-[#1e2330] safe-area-pb">
        <div className="flex items-stretch">
          {primaryNav.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href || (item.href !== "/app/dashboard" && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} className="flex-1">
                <div className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 px-1 transition-colors",
                  active ? "text-blue-400" : "text-[#4a5370]"
                )}>
                  <Icon className="h-5 w-5" />
                  <span className="text-[9px] font-medium tracking-wide">{item.label}</span>
                </div>
              </Link>
            )
          })}

          {/* More button */}
          <button
            className="flex-1"
            onClick={() => setMoreOpen(!moreOpen)}
          >
            <div className={cn(
              "flex flex-col items-center justify-center gap-1 py-2.5 px-1 transition-colors",
              isMoreActive || moreOpen ? "text-blue-400" : "text-[#4a5370]"
            )}>
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-[9px] font-medium tracking-wide">More</span>
            </div>
          </button>
        </div>
      </nav>
    </>
  )
}
