"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Plus, Search, Filter, Target, Play, Edit2, Copy,
  MoreHorizontal, Users, Clock, MapPin, ChevronRight,
  List, Grid3X3, ArrowUpDown, SlidersHorizontal, BookOpen,
  Layers, AlertCircle, CheckCircle, Archive, Trash2, Eye
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatRelativeTime } from "@/lib/utils"
import { toast } from "sonner"

const complexityColors: Record<string, { text: string; bg: string; border: string }> = {
  basic: { text: "text-green-400", bg: "bg-green-950/30", border: "border-green-800/40" },
  intermediate: { text: "text-amber-400", bg: "bg-amber-950/30", border: "border-amber-800/40" },
  advanced: { text: "text-orange-400", bg: "bg-orange-950/30", border: "border-orange-800/40" },
  expert: { text: "text-red-400", bg: "bg-red-950/30", border: "border-red-800/40" },
}

const audienceIcons: Record<string, string> = {
  military: "⚔️",
  law_enforcement: "🛡️",
  ems: "🚑",
}

interface Scenario {
  id: string
  title: string
  description?: string | null
  audience: string
  environment: string
  scenario_type: string
  complexity: string
  casualty_count: number
  evac_delay_minutes: number
  status: string
  ai_generated: boolean
  tags: string[]
  created_at: string
  updated_at: string
}

interface ScenariosClientProps {
  scenarios: Scenario[]
  doctrinePacks: Array<{ id: string; name: string; status: string }>
}

export function ScenariosClient({ scenarios, doctrinePacks }: ScenariosClientProps) {
  const [search, setSearch] = useState("")
  const [audienceFilter, setAudienceFilter] = useState("all")
  const [complexityFilter, setComplexityFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("updated")

  const filtered = useMemo(() => {
    return scenarios
      .filter((s) => {
        if (search && !s.title.toLowerCase().includes(search.toLowerCase()) &&
          !s.environment.toLowerCase().includes(search.toLowerCase()) &&
          !(s.tags ?? []).some((t) => t.toLowerCase().includes(search.toLowerCase()))
        ) return false
        if (audienceFilter !== "all" && s.audience !== audienceFilter) return false
        if (complexityFilter !== "all" && s.complexity !== complexityFilter) return false
        if (statusFilter !== "all" && s.status !== statusFilter) return false
        return true
      })
      .sort((a, b) => {
        if (sortBy === "updated") return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        if (sortBy === "created") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        if (sortBy === "title") return a.title.localeCompare(b.title)
        if (sortBy === "casualties") return b.casualty_count - a.casualty_count
        return 0
      })
  }, [scenarios, search, audienceFilter, complexityFilter, statusFilter, sortBy])

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Scenario Library"
        subtitle={`${scenarios.length} scenarios`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/app/scenarios/new">
              <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>
                New Scenario
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex-1 p-6 space-y-5">
        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] max-w-xs">
            <Input
              placeholder="Search scenarios, environments, tags..."
              leftElement={<Search className="h-3.5 w-3.5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={audienceFilter} onValueChange={setAudienceFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Audience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All audiences</SelectItem>
              <SelectItem value="military">Military</SelectItem>
              <SelectItem value="law_enforcement">Law Enforcement</SelectItem>
              <SelectItem value="ems">EMS</SelectItem>
            </SelectContent>
          </Select>

          <Select value={complexityFilter} onValueChange={setComplexityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Complexity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
              <SelectItem value="expert">Expert</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">Last updated</SelectItem>
                <SelectItem value="created">Date created</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
                <SelectItem value="casualties">Casualty count</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center rounded-md border border-[#2d3347] bg-[#0f1117] p-0.5 gap-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded transition-colors ${viewMode === "grid" ? "bg-[#252b3b] text-[#f0f4ff]" : "text-[#4a5370] hover:text-[#6b7594]"}`}
              >
                <Grid3X3 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded transition-colors ${viewMode === "list" ? "bg-[#252b3b] text-[#f0f4ff]" : "text-[#4a5370] hover:text-[#6b7594]"}`}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Count */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#6b7594]">
            {filtered.length} scenario{filtered.length !== 1 ? "s" : ""}
            {search || audienceFilter !== "all" || complexityFilter !== "all" ? " (filtered)" : ""}
          </p>
        </div>

        {/* Content */}
        {filtered.length === 0 ? (
          <EmptyState search={search} hasFilters={audienceFilter !== "all" || complexityFilter !== "all"} />
        ) : viewMode === "grid" ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger"
          >
            {filtered.map((s, i) => (
              <ScenarioCard key={s.id} scenario={s} index={i} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2 stagger"
          >
            {filtered.map((s, i) => (
              <ScenarioListItem key={s.id} scenario={s} index={i} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}

function ScenarioCard({ scenario: s, index }: { scenario: Scenario; index: number }) {
  const c = complexityColors[s.complexity] ?? complexityColors.basic
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.05, ease: [0.25, 1, 0.5, 1] }}
    >
      <Card hoverable className="group overflow-hidden">
        {/* Status stripe */}
        <div className={`h-0.5 w-full ${s.status === "ready" ? "bg-blue-600" : s.status === "archived" ? "bg-[#353c52]" : "bg-[#2d3347]"}`} />

        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={s.status === "ready" ? "default" : "secondary"} size="sm">
                {s.status}
              </Badge>
              {s.ai_generated && (
                <Badge variant="intel" size="sm">AI</Badge>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/app/scenarios/${s.id}`}>
                    <Eye className="h-4 w-4" /> View details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/app/scenarios/${s.id}/edit`}>
                    <Edit2 className="h-4 w-4" /> Edit scenario
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy className="h-4 w-4" /> Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Archive className="h-4 w-4" /> Archive
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive">
                  <Trash2 className="h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-[#f0f4ff] text-sm leading-snug mb-1 line-clamp-2">
            {s.title}
          </h3>

          {/* Meta */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 mb-3">
            <span className="flex items-center gap-1 text-[11px] text-[#6b7594]">
              <MapPin className="h-3 w-3" />
              {s.environment}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-[#6b7594]">
              <Users className="h-3 w-3" />
              {s.casualty_count} cas.
            </span>
            <span className="flex items-center gap-1 text-[11px] text-[#6b7594]">
              <Clock className="h-3 w-3" />
              {s.evac_delay_minutes}m evac
            </span>
            <span className="text-[11px]">
              {audienceIcons[s.audience] ?? ""}
            </span>
          </div>

          {/* Complexity */}
          <div className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 ${c.bg} border ${c.border}`}>
            <Layers className={`h-3 w-3 ${c.text}`} />
            <span className={`text-[11px] font-medium ${c.text}`}>{s.complexity}</span>
          </div>

          {/* Tags */}
          {s.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {s.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[10px] text-[#6b7594] bg-[#1e2330] border border-[#2d3347] rounded px-1.5 py-0.5">
                  {tag}
                </span>
              ))}
              {s.tags.length > 3 && (
                <span className="text-[10px] text-[#4a5370]">+{s.tags.length - 3}</span>
              )}
            </div>
          )}
        </CardContent>

        {/* Footer */}
        <div className="border-t border-[#1e2330] px-5 py-3 flex items-center justify-between">
          <span className="text-[11px] text-[#3e465e]">{formatRelativeTime(s.updated_at)}</span>
          <div className="flex items-center gap-1.5">
            <Link href={`/app/scenarios/${s.id}/run`}>
              <Button size="xs" variant="secondary" leftIcon={<Play className="h-3 w-3 text-green-400" />}>
                Launch
              </Button>
            </Link>
            <Link href={`/app/scenarios/${s.id}`}>
              <Button size="xs" variant="ghost">
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

function ScenarioListItem({ scenario: s, index }: { scenario: Scenario; index: number }) {
  const c = complexityColors[s.complexity] ?? complexityColors.basic
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, delay: index * 0.04, ease: [0.25, 1, 0.5, 1] }}
    >
      <div className="flex items-center gap-4 rounded-xl border border-[#2d3347] bg-[#0f1117] px-5 py-3.5 hover:border-[#353c52] hover:bg-[#1a1e2a] transition-all group cursor-pointer">
        <div className="h-8 w-8 rounded-lg bg-[#1a2444] border border-blue-800/40 flex items-center justify-center shrink-0">
          <Target className="h-3.5 w-3.5 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-[#d3dce8] truncate">{s.title}</p>
            {s.ai_generated && <Badge variant="intel" size="sm">AI</Badge>}
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-[11px] text-[#4a5370]">{s.environment}</span>
            <span className="text-[#2d3347]">·</span>
            <span className={`text-[11px] font-medium ${c.text}`}>{s.complexity}</span>
            <span className="text-[#2d3347]">·</span>
            <span className="text-[11px] text-[#4a5370]">{s.casualty_count} casualties</span>
            <span className="text-[#2d3347]">·</span>
            <span className="text-[11px] text-[#4a5370]">{s.evac_delay_minutes}m evac</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={s.status === "ready" ? "default" : "secondary"} size="sm">
            {s.status}
          </Badge>
          <span className="text-[11px] text-[#3e465e]">{formatRelativeTime(s.updated_at)}</span>
          <Link href={`/app/scenarios/${s.id}/run`}>
            <Button size="xs" variant="secondary" leftIcon={<Play className="h-3 w-3 text-green-400" />}>
              Launch
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/app/scenarios/${s.id}`}>
                  <Eye className="h-4 w-4" /> View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/app/scenarios/${s.id}/edit`}>
                  <Edit2 className="h-4 w-4" /> Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="h-4 w-4" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                <Trash2 className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  )
}

function EmptyState({ search, hasFilters }: { search: string; hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="h-14 w-14 rounded-2xl bg-[#1e2330] border border-[#2d3347] flex items-center justify-center mb-4">
        <Target className="h-6 w-6 text-[#4a5370]" />
      </div>
      {search || hasFilters ? (
        <>
          <h3 className="text-base font-semibold text-[#6b7594] mb-2">No matching scenarios</h3>
          <p className="text-sm text-[#3e465e] max-w-xs">
            Try adjusting your search or filters to find what you&apos;re looking for.
          </p>
        </>
      ) : (
        <>
          <h3 className="text-base font-semibold text-[#f0f4ff] mb-2">No scenarios yet</h3>
          <p className="text-sm text-[#6b7594] max-w-xs mb-6">
            Create your first training scenario using the AI generation wizard or build one manually.
          </p>
          <Link href="/app/scenarios/new">
            <Button leftIcon={<Plus className="h-4 w-4" />}>Create First Scenario</Button>
          </Link>
        </>
      )}
    </div>
  )
}
