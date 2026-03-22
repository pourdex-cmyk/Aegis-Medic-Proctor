"use client"

import React, { useState, useMemo } from "react"
import {
  Search, Filter, Download, Shield, Activity, FileText,
  Users, BookOpen, Star, Brain, Terminal
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Header } from "@/components/layout/header"
import { cn, formatRelativeTime } from "@/lib/utils"
import { toast } from "sonner"

interface AuditLog {
  id: string
  action: string
  resource_type: string
  resource_id?: string | null
  metadata?: unknown
  created_at: string
  ip_address?: string | null
  profiles?: { display_name: string; email: string } | null
}

interface AuditClientProps {
  logs: AuditLog[]
}

// Action category → icon + color mapping
const ACTION_CONFIG: Record<string, { icon: React.FC<{ className?: string }>; color: string; bg: string }> = {
  "scenario": { icon: FileText, color: "text-blue-400", bg: "bg-blue-950/30" },
  "run": { icon: Activity, color: "text-green-400", bg: "bg-green-950/30" },
  "score": { icon: Star, color: "text-amber-400", bg: "bg-amber-950/30" },
  "member": { icon: Users, color: "text-cyan-400", bg: "bg-cyan-950/30" },
  "doctrine": { icon: BookOpen, color: "text-purple-400", bg: "bg-purple-950/30" },
  "copilot": { icon: Brain, color: "text-indigo-400", bg: "bg-indigo-950/30" },
  "auth": { icon: Shield, color: "text-[#9daabf]", bg: "bg-[#1e2330]" },
  "default": { icon: Terminal, color: "text-[#6b7594]", bg: "bg-[#1e2330]" },
}

function getActionConfig(action: string) {
  const category = action.split(".")[0]
  return ACTION_CONFIG[category] ?? ACTION_CONFIG.default
}

function ActionBadgeVariant(action: string): "stable" | "critical" | "warning" | "secondary" {
  if (action.includes("delete") || action.includes("remove") || action.includes("revoke")) return "critical"
  if (action.includes("approve") || action.includes("complete")) return "stable"
  if (action.includes("update") || action.includes("edit")) return "warning"
  return "secondary"
}

export function AuditClient({ logs }: AuditClientProps) {
  const [search, setSearch] = useState("")
  const [filterAction, setFilterAction] = useState("all")

  const actionCategories = useMemo(() => {
    const cats = new Set(logs.map((l) => l.action.split(".")[0]))
    return ["all", ...Array.from(cats).sort()]
  }, [logs])

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        !search ||
        log.action.includes(search.toLowerCase()) ||
        log.profiles?.display_name?.toLowerCase().includes(search.toLowerCase()) ||
        log.profiles?.email?.toLowerCase().includes(search.toLowerCase()) ||
        log.resource_type?.toLowerCase().includes(search.toLowerCase())
      const matchesFilter =
        filterAction === "all" || log.action.startsWith(filterAction)
      return matchesSearch && matchesFilter
    })
  }, [logs, search, filterAction])

  const handleExport = () => {
    const csv = [
      "timestamp,actor,action,resource_type,resource_id,ip",
      ...filtered.map((l) =>
        [
          l.created_at,
          l.profiles?.email ?? "system",
          l.action,
          l.resource_type,
          l.resource_id ?? "",
          l.ip_address ?? "",
        ].join(",")
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Audit log exported")
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Audit Log"
        subtitle={`${logs.length} events · last 200 shown`}
        actions={
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Download className="h-3.5 w-3.5" />}
            onClick={handleExport}
          >
            Export CSV
          </Button>
        }
      />

      <div className="flex-1 p-4 md:p-6 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <Input
            placeholder="Search events..."
            leftElement={<Search className="h-3.5 w-3.5" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <div className="flex gap-1.5 flex-wrap">
            {actionCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterAction(cat)}
                className={cn(
                  "px-2.5 py-1 rounded text-[11px] font-medium capitalize transition-colors",
                  filterAction === cat
                    ? "bg-blue-600 text-white"
                    : "text-[#6b7594] hover:text-[#9daabf] hover:bg-[#1e2330]"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Log entries */}
        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#4a5370]">No audit events found</div>
            ) : (
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="divide-y divide-[#1e2330]">
                  {filtered.map((log) => {
                    const config = getActionConfig(log.action)
                    const Icon = config.icon
                    return (
                      <div key={log.id} className="flex items-start gap-4 px-5 py-3 hover:bg-[#0d0f14] transition-colors">
                        <div className={cn(
                          "h-7 w-7 rounded-md flex items-center justify-center shrink-0 mt-0.5",
                          config.bg
                        )}>
                          <Icon className={cn("h-3.5 w-3.5", config.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="text-xs font-mono text-[#d3dce8]">{log.action}</span>
                            <Badge variant={ActionBadgeVariant(log.action)} size="sm">
                              {log.resource_type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-[#4a5370]">
                            <span>{log.profiles?.display_name ?? log.profiles?.email ?? "system"}</span>
                            {log.ip_address && <span className="font-mono">{log.ip_address}</span>}
                            {log.resource_id && (
                              <span className="font-mono truncate max-w-[120px]" title={log.resource_id}>
                                {log.resource_id.slice(0, 8)}…
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-[#3e465e] shrink-0 font-mono">
                          {formatRelativeTime(log.created_at)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
