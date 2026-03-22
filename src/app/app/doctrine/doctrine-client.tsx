"use client"

import React, { useState, useTransition } from "react"
import { motion } from "framer-motion"
import {
  BookOpen, Plus, Upload, CheckCircle2, Clock, AlertCircle,
  Archive, FileText, ChevronRight, Search, Shield, Layers,
  Eye, Edit2, MoreHorizontal, Trash2, CheckSquare, XSquare,
  Download, Tag, Users
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Header } from "@/components/layout/header"
import { formatRelativeTime } from "@/lib/utils"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

interface DoctrinePack {
  id: string
  name: string
  version: string
  audience: string
  status: string
  description?: string | null
  document_count: number
  rule_count: number
  approved_at?: string | null
  created_at: string
  updated_at: string
}

interface DoctrineClientProps {
  packs: DoctrinePack[]
  canManage: boolean
}

const statusConfig: Record<string, { label: string; icon: React.FC<{ className?: string }>; color: string; variant: "default" | "secondary" | "stable" | "warning" | "critical" }> = {
  draft: { label: "Draft", icon: Clock, color: "text-[#6b7594]", variant: "secondary" },
  pending_approval: { label: "Pending Approval", icon: AlertCircle, color: "text-amber-400", variant: "warning" },
  approved: { label: "Approved", icon: CheckCircle2, color: "text-green-400", variant: "stable" },
  archived: { label: "Archived", icon: Archive, color: "text-[#4a5370]", variant: "secondary" },
}

const audienceColors: Record<string, string> = {
  military: "text-blue-400",
  law_enforcement: "text-amber-400",
  ems: "text-green-400",
  universal: "text-cyan-400",
}

export function DoctrineClient({ packs, canManage }: DoctrineClientProps) {
  const [search, setSearch] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [isPending, startTransition] = useTransition()

  const filtered = packs.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.audience.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Doctrine Packs"
        subtitle="Approved guidance, extracted rules, and audit trail"
        actions={
          canManage ? (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" leftIcon={<Upload className="h-3.5 w-3.5" />}>
                Upload Documents
              </Button>
              <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>
                New Pack
              </Button>
            </div>
          ) : undefined
        }
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Info banner */}
        <div className="flex items-start gap-3 rounded-xl border border-blue-800/40 bg-blue-950/20 px-4 py-3.5">
          <Shield className="h-4.5 w-4.5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-blue-300">Doctrine-Grounded Generation</p>
            <p className="text-xs text-blue-200/70 mt-0.5">
              Approved packs ground AI scenario generation, casualty creation, and grading rubrics in reviewed guidance.
              Only <strong>approved</strong> packs are used for generation. Doctrine SMEs must approve extracted rules before they become active.
            </p>
          </div>
        </div>

        {/* Search */}
        <Input
          placeholder="Search doctrine packs..."
          leftElement={<Search className="h-3.5 w-3.5" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />

        {/* Packs grid */}
        {filtered.length === 0 ? (
          <EmptyState canManage={canManage} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 stagger">
            {filtered.map((pack, i) => (
              <DoctrinePackCard key={pack.id} pack={pack} index={i} canManage={canManage} />
            ))}
          </div>
        )}

        {/* Upload drop zone */}
        {canManage && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div
              className={`rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                isDragging ? "border-blue-500 bg-blue-950/20" : "border-[#2d3347] hover:border-[#4a5370] hover:bg-[#0f1117]"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                toast.info("Document upload processing initiated", { description: "Documents will be chunked and indexed automatically" })
              }}
            >
              <Upload className="h-8 w-8 text-[#4a5370] mx-auto mb-3" />
              <p className="text-sm font-medium text-[#9daabf]">Drop doctrine documents here</p>
              <p className="text-xs text-[#4a5370] mt-1">PDF, DOCX, TXT, MD — Auto-chunks, indexes, and extracts rules for SME approval</p>
              <Button variant="secondary" size="sm" className="mt-4">
                Browse Files
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

function DoctrinePackCard({ pack, index, canManage }: { pack: DoctrinePack; index: number; canManage: boolean }) {
  const status = statusConfig[pack.status] ?? statusConfig.draft
  const StatusIcon = status.icon
  const approvalProgress = pack.rule_count > 0
    ? Math.round((pack.rule_count * 0.8) / pack.rule_count * 100) // placeholder
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.05, ease: [0.25, 1, 0.5, 1] }}
    >
      <Card hoverable className="group overflow-hidden">
        {/* Status stripe */}
        <div className={`h-0.5 w-full ${
          pack.status === "approved" ? "bg-green-600" :
          pack.status === "pending_approval" ? "bg-amber-500" :
          pack.status === "archived" ? "bg-[#353c52]" : "bg-[#2d3347]"
        }`} />

        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-[#1a2444] border border-blue-800/40 flex items-center justify-center shrink-0">
                <BookOpen className="h-4 w-4 text-blue-400" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-sm leading-tight truncate">{pack.name}</CardTitle>
                <p className="text-[11px] text-[#6b7594] mt-0.5">v{pack.version} · <span className={audienceColors[pack.audience]}>{pack.audience}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge variant={status.variant}>
                <StatusIcon className="h-3 w-3 mr-0.5" />
                {status.label}
              </Badge>
              {canManage && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="h-4 w-4" /> View details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit2 className="h-4 w-4" /> Edit pack
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Upload className="h-4 w-4" /> Add documents
                    </DropdownMenuItem>
                    {pack.status === "pending_approval" && (
                      <DropdownMenuItem className="text-green-400">
                        <CheckSquare className="h-4 w-4" /> Approve pack
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Download className="h-4 w-4" /> Export rules
                    </DropdownMenuItem>
                    {pack.status !== "archived" && (
                      <DropdownMenuItem variant="destructive">
                        <Archive className="h-4 w-4" /> Archive
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          {pack.description && (
            <CardDescription className="text-xs mt-1.5 line-clamp-2">{pack.description}</CardDescription>
          )}
        </CardHeader>

        <CardContent>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="rounded-lg bg-[#0a0c10] border border-[#1e2330] px-3 py-2">
              <p className="text-[10px] text-[#4a5370]">Documents</p>
              <p className="text-lg font-bold text-[#f0f4ff]">{pack.document_count}</p>
            </div>
            <div className="rounded-lg bg-[#0a0c10] border border-[#1e2330] px-3 py-2">
              <p className="text-[10px] text-[#4a5370]">Extracted Rules</p>
              <p className="text-lg font-bold text-[#f0f4ff]">{pack.rule_count}</p>
            </div>
          </div>

          {/* Approval progress */}
          {pack.status === "pending_approval" && pack.rule_count > 0 && (
            <div className="mb-3">
              <div className="flex justify-between text-[10px] text-[#4a5370] mb-1">
                <span>Rules approved</span>
                <span>{approvalProgress}%</span>
              </div>
              <Progress value={approvalProgress} size="sm" variant="stable" />
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between text-[11px] text-[#3e465e]">
            <span>{formatRelativeTime(pack.updated_at)}</span>
            {pack.approved_at && (
              <span className="text-green-600">Approved {formatRelativeTime(pack.approved_at)}</span>
            )}
          </div>
        </CardContent>

        {/* Footer */}
        <div className="border-t border-[#1e2330] px-5 py-3 flex items-center justify-between">
          <div className="flex gap-1.5">
            <Tag className="h-3 w-3 text-[#353c52]" />
            <span className="text-[10px] text-[#353c52] uppercase tracking-wider">{pack.audience}</span>
          </div>
          <Button variant="ghost" size="xs" rightIcon={<ChevronRight className="h-3 w-3" />}>
            View rules
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}

function EmptyState({ canManage }: { canManage: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="h-14 w-14 rounded-2xl bg-[#1e2330] border border-[#2d3347] flex items-center justify-center mb-4">
        <BookOpen className="h-6 w-6 text-[#4a5370]" />
      </div>
      <h3 className="text-base font-semibold text-[#f0f4ff] mb-2">No doctrine packs</h3>
      <p className="text-sm text-[#6b7594] max-w-xs mb-6">
        {canManage
          ? "Upload doctrine documents to create a pack. AI will extract rules for SME review."
          : "Contact your organization admin to set up doctrine packs."}
      </p>
      {canManage && (
        <Button leftIcon={<Upload className="h-4 w-4" />}>Upload First Document</Button>
      )}
    </div>
  )
}
