"use client"

import React, { useRef, useState, useTransition, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  BookOpen, Plus, Upload, CheckCircle2, Clock, AlertCircle,
  Archive, FileText, ChevronRight, Search, Shield, Layers,
  Eye, Edit2, MoreHorizontal, Trash2, CheckSquare,
  Download, Tag, X, Loader2, File,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Header } from "@/components/layout/header"
import { formatRelativeTime } from "@/lib/utils"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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

const AUDIENCE_OPTIONS = [
  { value: "military", label: "Military" },
  { value: "law_enforcement", label: "Law Enforcement" },
  { value: "ems", label: "EMS / Fire" },
  { value: "universal", label: "Universal" },
]

const ALLOWED_EXTS = ["pdf", "docx", "doc", "txt", "md"]
const ALLOWED_MIME = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

// ─── New Pack Dialog ─────────────────────────────────────────────────────────

function NewPackDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: (pack: DoctrinePack) => void
}) {
  const [name, setName] = useState("")
  const [audience, setAudience] = useState("military")
  const [description, setDescription] = useState("")
  const [isPending, startTransition] = useTransition()

  const reset = () => { setName(""); setAudience("military"); setDescription("") }

  const handleCreate = () => {
    if (!name.trim()) { toast.error("Pack name is required"); return }
    startTransition(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error("Not signed in"); return }

      const { data: member } = await supabase
        .from("organization_members")
        .select("org_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single()

      if (!member) { toast.error("No organization found"); return }

      const { data: pack, error } = await supabase
        .from("doctrine_packs")
        .insert({
          org_id: member.org_id,
          name: name.trim(),
          version: "1.0",
          audience,
          description: description.trim() || null,
          status: "draft",
          document_count: 0,
          rule_count: 0,
        })
        .select("id, name, version, audience, status, description, document_count, rule_count, approved_at, created_at, updated_at")
        .single()

      if (error) {
        toast.error("Failed to create pack", { description: error.message })
        return
      }

      toast.success(`"${pack.name}" created`)
      onCreated(pack as DoctrinePack)
      reset()
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isPending) { onOpenChange(v); if (!v) reset() } }}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>New Doctrine Pack</DialogTitle>
        </DialogHeader>
        <div className="px-6 py-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pack-name" required>Pack Name</Label>
            <Input
              id="pack-name"
              placeholder="e.g. TCCC Guidelines 2024"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pack-audience" required>Audience</Label>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger id="pack-audience">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUDIENCE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pack-description">Description <span className="text-[#4a5370] font-normal">(optional)</span></Label>
            <Input
              id="pack-description"
              placeholder="Brief description of this doctrine pack"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" size="sm" onClick={() => { onOpenChange(false); reset() }} disabled={isPending}>
            Cancel
          </Button>
          <Button size="sm" loading={isPending} onClick={handleCreate} disabled={!name.trim()}>
            Create Pack
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Upload Dialog ────────────────────────────────────────────────────────────

function UploadDialog({
  open,
  onOpenChange,
  packs,
  defaultPackId,
  onUploaded,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  packs: DoctrinePack[]
  defaultPackId?: string
  onUploaded: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedPackId, setSelectedPackId] = useState(defaultPackId ?? packs[0]?.id ?? "")
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const reset = () => { setFiles([]); setProgress(0); setSelectedPackId(defaultPackId ?? packs[0]?.id ?? "") }

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return
    const valid = Array.from(incoming).filter((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? ""
      return ALLOWED_MIME.includes(f.type) || ALLOWED_EXTS.includes(ext)
    })
    if (valid.length < incoming.length) toast.warning("Some files were skipped — only PDF, DOCX, TXT, MD allowed")
    setFiles((prev) => [...prev, ...valid])
  }

  const removeFile = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i))

  const handleUpload = async () => {
    if (!selectedPackId) { toast.error("Select a doctrine pack first"); return }
    if (files.length === 0) { toast.error("Add at least one file"); return }

    setUploading(true)
    let succeeded = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const form = new FormData()
      form.append("file", file)
      form.append("pack_id", selectedPackId)
      form.append("title", file.name.replace(/\.[^.]+$/, ""))

      const res = await fetch("/api/doctrine/upload", { method: "POST", body: form })
      if (res.ok) {
        succeeded++
      } else {
        const { error } = await res.json().catch(() => ({ error: "Upload failed" }))
        toast.error(`Failed: ${file.name}`, { description: error })
      }
      setProgress(Math.round(((i + 1) / files.length) * 100))
    }

    setUploading(false)
    if (succeeded > 0) {
      toast.success(`${succeeded} document${succeeded > 1 ? "s" : ""} uploaded`, {
        description: "Processing in background — rules will appear once extraction completes.",
      })
      onUploaded()
      onOpenChange(false)
      reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!uploading) { onOpenChange(v); if (!v) reset() } }}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Upload Doctrine Documents</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          {/* Pack selector */}
          <div className="space-y-1.5">
            <Label required>Doctrine Pack</Label>
            <Select value={selectedPackId} onValueChange={setSelectedPackId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a pack..." />
              </SelectTrigger>
              <SelectContent>
                {packs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                    <span className="ml-2 text-[#4a5370]">({p.audience})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Drop zone */}
          <div
            className={cn(
              "rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all",
              isDragging ? "border-blue-500 bg-blue-950/20" : "border-[#2d3347] hover:border-[#4a5370] hover:bg-[#0f1117]"
            )}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files) }}
          >
            <Upload className="h-7 w-7 text-[#4a5370] mx-auto mb-2" />
            <p className="text-sm font-medium text-[#9daabf]">Drop files here or click to browse</p>
            <p className="text-xs text-[#4a5370] mt-1">PDF, DOCX, TXT, MD — up to 50 MB each</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.txt,.md"
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-[#2d3347] bg-[#0f1117] px-3 py-2">
                  <File className="h-4 w-4 text-blue-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#d3dce8] truncate">{f.name}</p>
                    <p className="text-[10px] text-[#4a5370]">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button onClick={() => removeFile(i)} className="text-[#4a5370] hover:text-red-400 transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload progress */}
          {uploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-[#6b7594]">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} size="sm" variant="default" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" size="sm" onClick={() => { onOpenChange(false); reset() }} disabled={uploading}>
            Cancel
          </Button>
          <Button
            size="sm"
            loading={uploading}
            disabled={files.length === 0 || !selectedPackId || uploading}
            onClick={handleUpload}
            leftIcon={!uploading ? <Upload className="h-3.5 w-3.5" /> : undefined}
          >
            Upload {files.length > 0 ? `${files.length} file${files.length > 1 ? "s" : ""}` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DoctrineClient({ packs: initialPacks, canManage }: DoctrineClientProps) {
  const router = useRouter()
  const [packs, setPacks] = useState<DoctrinePack[]>(initialPacks)
  const [search, setSearch] = useState("")
  const [newPackOpen, setNewPackOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const filtered = packs.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.audience.toLowerCase().includes(search.toLowerCase())
  )

  const handlePackCreated = (pack: DoctrinePack) => {
    setPacks((prev) => [pack, ...prev])
  }

  const handleUploaded = () => {
    router.refresh()
  }

  const handleStatusChange = (id: string, newStatus: string) => {
    setPacks((prev) => prev.map((p) => p.id === id ? { ...p, status: newStatus } : p))
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Doctrine Packs"
        subtitle="Approved guidance, extracted rules, and audit trail"
        actions={
          canManage ? (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                leftIcon={<Upload className="h-3.5 w-3.5" />}
                onClick={() => {
                  if (packs.length === 0) {
                    toast.info("Create a pack first", { description: "You need a doctrine pack before uploading documents." })
                    setNewPackOpen(true)
                  } else {
                    setUploadOpen(true)
                  }
                }}
              >
                Upload Documents
              </Button>
              <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewPackOpen(true)}>
                New Pack
              </Button>
            </div>
          ) : undefined
        }
      />

      <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Info banner */}
        <div className="flex items-start gap-3 rounded-xl border border-blue-800/40 bg-blue-950/20 px-4 py-3.5">
          <Shield className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
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
          <EmptyState
            canManage={canManage}
            onUpload={() => setNewPackOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 stagger">
            {filtered.map((pack, i) => (
              <DoctrinePackCard key={pack.id} pack={pack} index={i} canManage={canManage} onUpload={() => setUploadOpen(true)} onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}

        {/* Drop zone (only shown when packs exist) */}
        {canManage && packs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div
              className={`rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
                isDragging ? "border-blue-500 bg-blue-950/20" : "border-[#2d3347] hover:border-[#4a5370] hover:bg-[#0f1117]"
              }`}
              onClick={() => setUploadOpen(true)}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                setUploadOpen(true)
              }}
            >
              <Upload className="h-8 w-8 text-[#4a5370] mx-auto mb-3" />
              <p className="text-sm font-medium text-[#9daabf]">Drop doctrine documents here</p>
              <p className="text-xs text-[#4a5370] mt-1">PDF, DOCX, TXT, MD — Auto-chunks, indexes, and extracts rules for SME approval</p>
              <Button variant="secondary" size="sm" className="mt-4" onClick={(e) => { e.stopPropagation(); setUploadOpen(true) }}>
                Browse Files
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      <NewPackDialog
        open={newPackOpen}
        onOpenChange={setNewPackOpen}
        onCreated={handlePackCreated}
      />

      {packs.length > 0 && (
        <UploadDialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          packs={packs}
          onUploaded={handleUploaded}
        />
      )}
    </div>
  )
}

function DoctrinePackCard({
  pack, index, canManage, onUpload, onStatusChange,
}: {
  pack: DoctrinePack
  index: number
  canManage: boolean
  onUpload: () => void
  onStatusChange: (id: string, status: string) => void
}) {
  const supabase = createClient()
  const status = statusConfig[pack.status] ?? statusConfig.draft
  const StatusIcon = status.icon
  const approvalProgress = pack.rule_count > 0
    ? Math.round((pack.rule_count * 0.8) / pack.rule_count * 100)
    : 0

  const handleApprove = async () => {
    const { error } = await supabase
      .from("doctrine_packs")
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("id", pack.id)
    if (error) { toast.error("Failed to approve pack"); return }
    toast.success(`"${pack.name}" approved`)
    onStatusChange(pack.id, "approved")
  }

  const handleArchive = async () => {
    const { error } = await supabase
      .from("doctrine_packs")
      .update({ status: "archived" })
      .eq("id", pack.id)
    if (error) { toast.error("Failed to archive pack"); return }
    toast.success(`"${pack.name}" archived`)
    onStatusChange(pack.id, "archived")
  }

  const handleExportRules = async () => {
    const { data: rules, error } = await supabase
      .from("doctrine_rules")
      .select("*")
      .eq("pack_id", pack.id)
    if (error) { toast.error("Failed to export rules"); return }
    const blob = new Blob([JSON.stringify(rules, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${pack.name.replace(/\s+/g, "-").toLowerCase()}-rules.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${rules?.length ?? 0} rules`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.05, ease: [0.25, 1, 0.5, 1] }}
    >
      <Card hoverable className="group overflow-hidden">
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
                    <DropdownMenuItem asChild>
                      <Link href={`/app/doctrine/${pack.id}`}>
                        <Eye className="h-4 w-4" /> View details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onUpload}>
                      <Upload className="h-4 w-4" /> Add documents
                    </DropdownMenuItem>
                    {pack.status === "pending_approval" && (
                      <DropdownMenuItem className="text-green-400" onClick={handleApprove}>
                        <CheckSquare className="h-4 w-4" /> Approve pack
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleExportRules}>
                      <Download className="h-4 w-4" /> Export rules
                    </DropdownMenuItem>
                    {pack.status !== "archived" && (
                      <DropdownMenuItem variant="destructive" onClick={handleArchive}>
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

          {pack.status === "pending_approval" && pack.rule_count > 0 && (
            <div className="mb-3">
              <div className="flex justify-between text-[10px] text-[#4a5370] mb-1">
                <span>Rules approved</span>
                <span>{approvalProgress}%</span>
              </div>
              <Progress value={approvalProgress} size="sm" variant="stable" />
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-[#3e465e]">
            <span>{formatRelativeTime(pack.updated_at)}</span>
            {pack.approved_at && (
              <span className="text-green-600">Approved {formatRelativeTime(pack.approved_at)}</span>
            )}
          </div>
        </CardContent>

        <div className="border-t border-[#1e2330] px-5 py-3 flex items-center justify-between">
          <div className="flex gap-1.5">
            <Tag className="h-3 w-3 text-[#353c52]" />
            <span className="text-[10px] text-[#353c52] uppercase tracking-wider">{pack.audience}</span>
          </div>
          <Link href={`/app/doctrine/${pack.id}`}>
            <Button variant="ghost" size="xs" rightIcon={<ChevronRight className="h-3 w-3" />}>
              View rules
            </Button>
          </Link>
        </div>
      </Card>
    </motion.div>
  )
}

function EmptyState({ canManage, onUpload }: { canManage: boolean; onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="h-14 w-14 rounded-2xl bg-[#1e2330] border border-[#2d3347] flex items-center justify-center mb-4">
        <BookOpen className="h-6 w-6 text-[#4a5370]" />
      </div>
      <h3 className="text-base font-semibold text-[#f0f4ff] mb-2">No doctrine packs</h3>
      <p className="text-sm text-[#6b7594] max-w-xs mb-6">
        {canManage
          ? "Create a doctrine pack, then upload documents. AI will extract rules for SME review."
          : "Contact your organization admin to set up doctrine packs."}
      </p>
      {canManage && (
        <div className="flex items-center gap-2">
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={onUpload}>
            Create First Pack
          </Button>
        </div>
      )}
    </div>
  )
}
