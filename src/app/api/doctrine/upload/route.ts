import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

const MAX_SIZE_MB = Number(process.env.MAX_UPLOAD_SIZE_MB ?? 50)
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: member } = await supabase
      .from("organization_members")
      .select("org_id, role")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    if (!member) {
      return NextResponse.json({ error: "Not a member of any organization" }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const packId = formData.get("pack_id") as string | null
    const title = formData.get("title") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }
    if (!packId) {
      return NextResponse.json({ error: "pack_id is required" }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type not allowed. Accepted: PDF, TXT, MD, DOC, DOCX` },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_SIZE_MB}MB` },
        { status: 400 }
      )
    }

    // Verify the pack belongs to this org
    const { data: pack } = await supabase
      .from("doctrine_packs")
      .select("id, org_id")
      .eq("id", packId)
      .eq("org_id", member.org_id)
      .single()

    if (!pack) {
      return NextResponse.json({ error: "Doctrine pack not found" }, { status: 404 })
    }

    // Upload to Supabase Storage
    const serviceSupabase = createServiceClient()
    const ext = file.name.split(".").pop() ?? "bin"
    const storagePath = `doctrine/${member.org_id}/${packId}/${Date.now()}-${encodeURIComponent(file.name)}`

    const bytes = await file.arrayBuffer()
    const { data: storageData, error: storageError } = await serviceSupabase.storage
      .from("doctrine-documents")
      .upload(storagePath, bytes, {
        contentType: file.type,
        upsert: false,
      })

    if (storageError) throw storageError

    // Get the public URL
    const { data: { publicUrl } } = serviceSupabase.storage
      .from("doctrine-documents")
      .getPublicUrl(storagePath)

    // Map file extension to allowed enum values: pdf | docx | txt | md
    const extNormalized = ["pdf", "docx", "txt", "md"].includes(ext) ? ext : "pdf"

    // Create doctrine_document record using actual schema columns
    const { data: doc, error: docError } = await supabase
      .from("doctrine_documents")
      .insert({
        pack_id: packId,
        org_id: member.org_id,
        title: title ?? file.name.replace(/\.[^.]+$/, ""),
        file_url: publicUrl,
        file_type: extNormalized,
        status: "processing",
        chunk_count: 0,
      })
      .select()
      .single()

    if (docError) throw docError

    await supabase.from("audit_logs").insert({
      org_id: member.org_id,
      actor_id: user.id,
      action: "doctrine.document.uploaded",
      resource_type: "doctrine_document",
      resource_id: doc.id,
      description: `Document uploaded: ${file.name}`,
      metadata: {
        pack_id: packId,
        file_name: file.name,
        file_size: file.size,
        storage_path: storagePath,
      },
    })

    return NextResponse.json({ document: doc, storageUrl: publicUrl })
  } catch (err) {
    console.error("[doctrine/upload]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    )
  }
}
