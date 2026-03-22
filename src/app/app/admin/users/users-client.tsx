"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import {
  UserPlus, Search, MoreHorizontal, Shield, UserX,
  Mail, Clock, CheckCircle2, XCircle, Copy, RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Header } from "@/components/layout/header"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn, formatRelativeTime } from "@/lib/utils"
import { USER_ROLES } from "@/lib/constants"
import { toast } from "sonner"

interface Member {
  id: string
  role: string
  is_active: boolean
  joined_at: string
  profiles?: {
    id: string
    display_name: string
    email: string
    avatar_url?: string | null
  } | null
}

interface Invite {
  id: string
  email: string
  role: string
  expires_at: string
  created_at: string
  accepted_at?: string | null
}

interface UsersClientProps {
  members: Member[]
  invites: Invite[]
  currentRole: string
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  org_admin: { label: "Org Admin", color: "text-amber-400" },
  lead_proctor: { label: "Lead Proctor", color: "text-blue-400" },
  proctor: { label: "Proctor", color: "text-cyan-400" },
  doctrine_sme: { label: "Doctrine SME", color: "text-purple-400" },
  analyst: { label: "Analyst", color: "text-green-400" },
  observer: { label: "Observer", color: "text-[#9daabf]" },
}

export function UsersClient({ members: initialMembers, invites: initialInvites, currentRole }: UsersClientProps) {
  const [search, setSearch] = useState("")
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("proctor")
  const [isInviting, setIsInviting] = useState(false)
  const [members, setMembers] = useState(initialMembers)
  const [invites, setInvites] = useState(initialInvites)

  const isAdmin = ["org_admin", "super_admin"].includes(currentRole)

  const handleChangeMemberRole = async (memberId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to change role")
      setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role: newRole } : m))
      toast.success("Role updated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change role")
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    try {
      const res = await fetch(`/api/admin/members/${memberId}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to remove member")
      setMembers((prev) => prev.filter((m) => m.id !== memberId))
      toast.success("Member removed")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove member")
    }
  }

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      const res = await fetch(`/api/admin/invites/${inviteId}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to revoke invite")
      setInvites((prev) => prev.filter((i) => i.id !== inviteId))
      toast.success("Invite revoked")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke invite")
    }
  }

  const filteredMembers = members.filter((m) => {
    const name = m.profiles?.display_name?.toLowerCase() ?? ""
    const email = m.profiles?.email?.toLowerCase() ?? ""
    return !search || name.includes(search.toLowerCase()) || email.includes(search.toLowerCase())
  })

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setIsInviting(true)
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to send invite")
      toast.success("Invite sent", { description: `${inviteEmail} will receive an invitation email` })
      setInviteEmail("")
      setInviteOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invite")
    } finally {
      setIsInviting(false)
    }
  }

  const handleCopyInviteLink = (inviteId: string) => {
    const link = `${window.location.origin}/invite/${inviteId}`
    navigator.clipboard.writeText(link)
    toast.success("Invite link copied")
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="User Management"
        subtitle={`${members.filter((m) => m.is_active).length} active members`}
        actions={
          isAdmin ? (
            <Button
              size="sm"
              leftIcon={<UserPlus className="h-3.5 w-3.5" />}
              onClick={() => setInviteOpen(true)}
            >
              Invite Member
            </Button>
          ) : undefined
        }
      />

      <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
        <Input
          placeholder="Search members..."
          leftElement={<Search className="h-3.5 w-3.5" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />

        {/* Members table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Members ({filteredMembers.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredMembers.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#4a5370]">No members found</div>
            ) : (
              <div className="divide-y divide-[#1e2330]">
                {filteredMembers.map((member, i) => {
                  const roleConfig = ROLE_LABELS[member.role] ?? ROLE_LABELS.observer
                  const initials = member.profiles?.display_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) ?? "??"

                  return (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-4 px-5 py-3"
                    >
                      <Avatar size="sm">
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#d3dce8] truncate">
                          {member.profiles?.display_name ?? "Unknown"}
                        </p>
                        <p className="text-[11px] text-[#4a5370] truncate">
                          {member.profiles?.email ?? "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={cn("text-xs font-medium", roleConfig.color)}>
                          {roleConfig.label}
                        </span>
                        <Badge
                          variant={member.is_active ? "stable" : "secondary"}
                          size="sm"
                          dot
                        >
                          {member.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <span className="text-[10px] text-[#3e465e] hidden sm:block">
                          {formatRelativeTime(member.joined_at)}
                        </span>
                        {isAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {Object.entries(ROLE_LABELS)
                                .filter(([v]) => v !== member.role)
                                .map(([value, { label }]) => (
                                  <DropdownMenuItem
                                    key={value}
                                    onClick={() => handleChangeMemberRole(member.id, value)}
                                  >
                                    <Shield className="h-4 w-4" /> Set: {label}
                                  </DropdownMenuItem>
                                ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => handleRemoveMember(member.id)}
                              >
                                <UserX className="h-4 w-4" /> Remove member
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
          </CardContent>
        </Card>

        {/* Pending invites */}
        {invites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Pending Invites ({invites.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-[#1e2330]">
                {invites.map((invite) => {
                  const isExpired = new Date(invite.expires_at) < new Date()
                  const roleConfig = ROLE_LABELS[invite.role] ?? ROLE_LABELS.observer
                  return (
                    <div key={invite.id} className="flex items-center gap-4 px-5 py-3">
                      <div className="h-8 w-8 rounded-full bg-[#1e2330] border border-[#2d3347] flex items-center justify-center">
                        <Mail className="h-3.5 w-3.5 text-[#4a5370]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#d3dce8] truncate">{invite.email}</p>
                        <p className="text-[11px] text-[#4a5370]">
                          Invited {formatRelativeTime(invite.created_at)} as{" "}
                          <span className={roleConfig.color}>{roleConfig.label}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isExpired ? (
                          <Badge variant="critical" size="sm" dot>Expired</Badge>
                        ) : (
                          <Badge variant="warning" size="sm" dot>Pending</Badge>
                        )}
                        {isAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleCopyInviteLink(invite.id)}>
                                <Copy className="h-4 w-4" /> Copy invite link
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <RefreshCw className="h-4 w-4" /> Resend email
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => handleRevokeInvite(invite.id)}
                              >
                                <XCircle className="h-4 w-4" /> Revoke invite
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="invite-email" required>Email address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="name@unit.mil"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="mt-1.5"
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              />
            </div>
            <div>
              <Label htmlFor="invite-role" required>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger id="invite-role" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([value, { label }]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleInvite}
              loading={isInviting}
              leftIcon={<Mail className="h-3.5 w-3.5" />}
              disabled={!inviteEmail.trim()}
            >
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
