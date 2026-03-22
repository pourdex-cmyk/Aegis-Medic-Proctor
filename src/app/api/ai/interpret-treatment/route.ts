import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateObject } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { buildTreatmentInterpretationPrompt } from "@/lib/ai/prompts"

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const interpretationSchema = z.object({
  action_type: z.string(),
  body_location: z.string().nullable(),
  laterality: z.enum(["left", "right", "bilateral"]).nullable(),
  quality: z.string().nullable(),
  performer: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  ambiguity_flags: z.array(z.string()),
  effect_description: z.string().nullable(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { raw_text, casualty_context, elapsed_seconds, intervention_id } = await request.json()

    if (!raw_text?.trim()) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 })
    }

    const prompt = buildTreatmentInterpretationPrompt({
      raw_text,
      casualty_context: casualty_context ?? "Unknown casualty",
      elapsed_seconds: elapsed_seconds ?? 0,
    })

    const { object } = await generateObject({
      model: anthropic("claude-haiku-4-5-20251001"),
      system: prompt.system,
      prompt: prompt.user,
      schema: interpretationSchema,
      temperature: 0.1,
    })

    // Save interpretation if intervention_id provided
    if (intervention_id) {
      await supabase.from("intervention_interpretations").insert({
        intervention_id,
        action_type: object.action_type,
        body_location: object.body_location,
        laterality: object.laterality,
        quality: object.quality,
        confidence: object.confidence,
        ambiguity_flags: object.ambiguity_flags,
        effect_description: object.effect_description,
      })

      // Update intervention status
      await supabase
        .from("interventions")
        .update({ status: "interpreted", action_type: object.action_type })
        .eq("id", intervention_id)
    }

    return NextResponse.json(object)
  } catch (err) {
    console.error("Treatment interpretation error:", err)
    return NextResponse.json(
      { error: "Interpretation failed" },
      { status: 500 }
    )
  }
}
