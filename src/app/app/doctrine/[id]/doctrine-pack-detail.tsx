"use client"

import React, { useState, useTransition, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  BookOpen, FileText, CheckSquare, XSquare, Upload, Plus,
  CheckCircle2, Clock, AlertCircle, Archive, ChevronLeft,
  Loader2, Shield, Search, Filter, Star, MoreHorizontal,
  Download, Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Header } from "@/components/layout/header"
import { cn, formatRelativeTime } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface DoctrineDocument {
  id: string
  filename: string
  file_type: string
  status: string
  chunk_count: number
  created_at: string
  processing_error?: string | null
}

interface DoctrineRule {
  id: string
  rule_text: string
  category: string
  confidence_score: number
  is_approved: boolean
  reviewed_at?: string | null
  source_chunk_id?: string | null
}

interface Pack {
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

interface DoctrinePackDetailProps {
  pack: Pack
  documents: DoctrineDocument[]
  rules: DoctrineRule[]
  canApprove: boolean
}

const DOC_STATUS_CONFIG: Record<string, { label: string; color: string; variant: "stable" | "warning" | "critical" | "secondary" }> = {
  pending: { label: "Pending", color: "text-amber-400", variant: "warning" },
  processing: { label: "Processing", color: "text-blue-400", variant: "secondary" },
  processed: { label: "Processed", color: "text-green-400", variant: "stable" },
  failed: { label: "Failed", color: "text-red-400", variant: "critical" },
}

const FILE_TYPE_ICONS: Record<string, string> = {
  pdf: "📄",
  docx: "📝",
  txt: "📃",
  md: "📋",
}

const CATEGORY_COLORS: Record<string, string> = {
  hemorrhage_control: "text-red-400",
  airway_management: "text-blue-400",
  circulation: "text-purple-400",
  triage: "text-amber-400",
  evacuation: "text-cyan-400",
  medication: "text-green-400",
  documentation: "text-[#9daabf]",
}

export function DoctrinePackDetail({ pack, documents, rules, canApprove }: DoctrinePackDetailProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [isDragging, setIsDragging] = useState(false)
  const [ruleSearch, setRuleSearch] = useState("")
  const [ruleFilter, setRuleFilter] = useState<"all" | "pending" | "approved" | "rejected">("all")
  const [localRules, setLocalRules] = useState<DoctrineRule[]>(rules)

  const pendingRules = localRules.filter((r) => !r.is_approved && r.reviewed_at === null)
  const approvedRules = localRules.filter((r) => r.is_approved)
  const rejectedRules = localRules.filter((r) => !r.is_approved && r.reviewed_at !== null)

  const approvalProgress = localRules.length > 0
    ? Math.round((approvedRules.length / localRules.length) * 100)
    : 0

  const filteredRules = localRules.filter((r) => {
    const matchesSearch = !ruleSearch || r.rule_text.toLowerCase().includes(ruleSearch.toLowerCase())
    const matchesFilter =
      ruleFilter === "all" ||
      (ruleFilter === "pending" && !r.is_approved && !r.reviewed_at) ||
      (ruleFilter === "approved" && r.is_approved) ||
      (ruleFilter === "rejected" && !r.is_approved && !!r.reviewed_at)
    return matchesSearch && matchesFilter
  })

  const handleApproveRule = async (ruleId: string, approved: boolean) => {
    const { error } = await supabase
      .from("doctrine_rules")
      .update({ is_approved: approved, reviewed_at: new Date().toISOString() })
      .eq("id", ruleId)

    if (error) {
      toast.error("Failed to update rule")
      return
    }
    setLocalRules((prev) =>
      prev.map((r) =>
        r.id === ruleId
          ? { ...r, is_approved: approved, reviewed_at: new Date().toISOString() }
          : r
      )
    )
    toast.success(approved ? "Rule approved" : "Rule rejected")
  }

  const handleApproveAll = async () => {
    startTransition(async () => {
      const pendingIds = pendingRules.map((r) => r.id)
      const { error } = await supabase
        .from("doctrine_rules")
        .update({ is_approved: true, reviewed_at: new Date().toISOString() })
        .in("id", pendingIds)

      if (error) {
        toast.error("Failed to approve rules")
        return
      }
      setLocalRules((prev) =>
        prev.map((r) =>
          pendingIds.includes(r.id)
            ? { ...r, is_approved: true, reviewed_at: new Date().toISOString() }
            : r
        )
      )
      toast.success(`${pendingIds.length} rules approved`)
    })
  }

  const handleApprovePack = async () => {
    startTransition(async () => {
      const { error } = await supabase
        .from("doctrine_packs")
        .update({ status: "approved", approved_at: new Date().toISOString() })
        .eq("id", pack.id)

      if (error) {
        toast.error("Failed to approve pack")
        return
      }
      toast.success("Pack approved — it will now ground AI generation")
      router.refresh()
    })
  }

  const handleFileDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    const toastId = toast.loading(`Uploading ${files.length} document${files.length > 1 ? "s" : ""}…`)

    let uploaded = 0
    for (const file of files) {
      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("pack_id", pack.id)
        formData.append("title", file.name.replace(/\.[^.]+$/, ""))

        const res = await fetch("/api/doctrine/upload", { method: "POST", body: formData })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? "Upload failed")
        uploaded++
      } catch (err) {
        toast.error(`Failed to upload ${file.name}`, {
          description: err instanceof Error ? err.message : undefined,
        })
      }
    }

    toast.dismiss(toastId)
    if (uploaded > 0) {
      toast.success(`${uploaded} document${uploaded > 1 ? "s" : ""} uploaded`, {
        description: "Documents are queued for chunking and rule extraction",
      })
      router.refresh()
    }
  }, [pack.id, router])

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title={pack.name}
        subtitle={`v${pack.version} · ${pack.audience}`}
        actions={
          <div className="flex items-center gap-2">
            {canApprove && pack.status === "pending_approval" && approvalProgress === 100 && (
              <Button
                size="sm"
                variant="success" // fall back to default if variant not in your badge
                leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                onClick={handleApprovePack}
                loading={isPending}
              >
                Approve Pack
              </Button>
            )}
            {canApprove && (
              <Button
                size="sm"
                variant="secondary"
                leftIcon={<Upload className="h-3.5 w-3.5" />}
              >
                Upload Documents
              </Button>
            )}
          </div>
        }
      />

      <div className="flex-1 p-6 space-y-5">
        {/* Pack status banner */}
        {pack.status === "pending_approval" && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-800/40 bg-amber-950/10 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-amber-300">Awaiting SME Approval</p>
              <p className="text-xs text-amber-200/70 mt-0.5">
                {approvedRules.length} of {localRules.length} extracted rules have been reviewed.
                All rules must be approved before the pack can be activated.
              </p>
            </div>
            {canApprove && pendingRules.length > 0 && (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleApproveAll}
                loading={isPending}
              >
                Approve all pending
              </Button>
            )}
          </div>
        )}

        {pack.status === "approved" && (
          <div className="flex items-center gap-3 rounded-xl border border-green-800/40 bg-green-950/10 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-green-300">Active — Grounding AI generation</p>
              <p className="text-xs text-green-200/70 mt-0.5">
                Approved {pack.approved_at ? formatRelativeTime(pack.approved_at) : ""} · {approvedRules.length} active rules
              </p>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Documents", value: pack.document_count, color: "text-blue-400" },
            { label: "Extracted Rules", value: pack.rule_count, color: "text-[#f0f4ff]" },
            { label: "Approved", value: approvedRules.length, color: "text-green-400" },
            { label: "Pending Review", value: pendingRules.length, color: pendingRules.length > 0 ? "text-amber-400" : "text-[#4a5370]" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <p className="text-[10px] text-[#4a5370] uppercase tracking-wider mb-1">{stat.label}</p>
                <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Rule approval progress */}
        {localRules.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#4a5370]">Rule approval progress</span>
              <span className="text-[#9daabf] font-semibold">{approvalProgress}%</span>
            </div>
            <Progress
              value={approvalProgress}
              variant={approvalProgress === 100 ? "stable" : "default"}
              size="sm"
            />
          </div>
        )}

        <Tabs defaultValue="rules">
          <TabsList>
            <TabsTrigger value="rules">
              <Shield className="h-3.5 w-3.5 mr-1.5" />
              Rules ({localRules.length})
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              Documents ({documents.length})
            </TabsTrigger>
          </TabsList>

          {/* Rules tab */}
          <TabsContent value="rules" className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <Input
                placeholder="Search rules..."
                leftElement={<Search className="h-3.5 w-3.5" />}
                value={ruleSearch}
                onChange={(e) => setRuleSearch(e.target.value)}
                className="max-w-xs"
              />
              <div className="flex gap-1.5">
                {["all", "pending", "approved", "rejected"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setRuleFilter(f as typeof ruleFilter)}
                    className={cn(
                      "px-2.5 py-1 rounded text-[11px] font-medium capitalize transition-colors",
                      ruleFilter === f
                        ? "bg-blue-600 text-white"
                        : "text-[#6b7594] hover:text-[#9daabf] hover:bg-[#1e2330]"
                    )}
                  >
                    {f} {f !== "all" && (
                      <span className="ml-1 opacity-60">
                        {f === "pending" ? pendingRules.length :
                         f === "approved" ? approvedRules.length :
                         rejectedRules.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {filteredRules.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#4a5370]">No rules found</div>
            ) : (
              <div className="space-y-2">
                {filteredRules.map((rule, i) => {
                  const isPending = !rule.is_approved && !rule.reviewed_at
                  const isApproved = rule.is_approved
                  const isRejected = !rule.is_approved && !!rule.reviewed_at

                  return (
                    <motion.div
                      key={rule.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                    >
                      <div className={cn(
                        "rounded-lg border px-4 py-3 transition-all",
                        isApproved ? "border-green-800/30 bg-green-950/5" :
                        isRejected ? "border-[#2d3347] bg-[#0a0c10] opacity-50" :
                        "border-[#1e2330] bg-[#0d0f14]"
                      )}>
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <Badge variant="secondary" size="sm" className={CATEGORY_COLORS[rule.category] ?? ""}>
                                {rule.category?.replace(/_/g, " ") ?? "general"}
                              </Badge>
                              <span className="text-[10px] text-[#3e465e]">
                                Confidence: {Math.round(rule.confidence_score * 100)}%
                              </span>
                              {isApproved && (
                                <Badge variant="stable" size="sm">
                                  <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                                  Approved
                                </Badge>
                              )}
                              {isRejected && (
                                <Badge variant="secondary" size="sm">Rejected</Badge>
                              )}
                            </div>
                            <p className="text-sm text-[#d3dce8] leading-relaxed">{rule.rule_text}</p>
                          </div>

                          {canApprove && isPending && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleApproveRule(rule.id, true)}
                                className="h-7 w-7 rounded-md bg-green-950/40 border border-green-800/40 flex items-center justify-center hover:bg-green-900/50 transition-colors"
                                title="Approve rule"
                              >
                                <CheckSquare className="h-3.5 w-3.5 text-green-400" />
                              </button>
                              <button
                                onClick={() => handleApproveRule(rule.id, false)}
                                className="h-7 w-7 rounded-md bg-[#1e2330] border border-[#2d3347] flex items-center justify-center hover:bg-red-950/30 hover:border-red-800/40 transition-colors"
                                title="Reject rule"
                              >
                                <XSquare className="h-3.5 w-3.5 text-[#4a5370] hover:text-red-400" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Documents tab */}
          <TabsContent value="documents" className="mt-4 space-y-3">
            {/* Upload dropzone */}
            {canApprove && (
              <div
                className={cn(
                  "rounded-xl border-2 border-dashed p-6 text-center transition-all",
                  isDragging ? "border-blue-500 bg-blue-950/20" : "border-[#2d3347] hover:border-[#4a5370]"
                )}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
              >
                <Upload className="h-6 w-6 text-[#4a5370] mx-auto mb-2" />
                <p className="text-xs text-[#9daabf]">Drop documents here to add to this pack</p>
                <p className="text-[10px] text-[#4a5370] mt-0.5">PDF, DOCX, TXT, MD — auto-chunked and extracted</p>
              </div>
            )}

            {documents.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#4a5370]">No documents uploaded yet</div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc, i) => {
                  const status = DOC_STATUS_CONFIG[doc.status] ?? DOC_STATUS_CONFIG.pending
                  const ext = doc.filename.split(".").pop()?.toLowerCase() ?? "txt"
                  return (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <div className="flex items-center gap-4 rounded-lg border border-[#1e2330] bg-[#0d0f14] px-4 py-3">
                        <span className="text-xl shrink-0">{FILE_TYPE_ICONS[ext] ?? "📄"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#d3dce8] truncate">{doc.filename}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant={status.variant} size="sm">
                              {doc.status === "processing" && <Loader2 className="h-2.5 w-2.5 mr-0.5 animate-spin" />}
                              {status.label}
                            </Badge>
                            {doc.chunk_count > 0 && (
                              <span className="text-[10px] text-[#4a5370]">{doc.chunk_count} chunks</span>
                            )}
                            <span className="text-[10px] text-[#3e465e]">{formatRelativeTime(doc.created_at)}</span>
                          </div>
                          {doc.processing_error && (
                            <p className="text-[10px] text-red-400 mt-0.5 truncate">{doc.processing_error}</p>
                          )}
                        </div>
                        {canApprove && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Download className="h-4 w-4" /> Download
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive">
                                <Trash2 className="h-4 w-4" /> Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
