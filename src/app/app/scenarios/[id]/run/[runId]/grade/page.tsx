import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { GradeClient } from "./grade-client"

interface Props {
  params: Promise<{ id: string; runId: string }>
}

export const metadata: Metadata = { title: "Grade Run" }

export default async function GradePage({ params }: Props) {
  const { id: scenarioId, runId } = await params
  const supabase = await createClient()

  const [
    { data: run },
    { data: scenario },
    { data: rubric },
    { data: interventions },
    { data: existingScore },
  ] = await Promise.all([
    supabase
      .from("scenario_runs")
      .select("id, status, clock_seconds, started_at, completed_at, lead_proctor_id")
      .eq("id", runId)
      .single(),
    supabase
      .from("scenarios")
      .select("id, title, complexity, audience, casualty_count")
      .eq("id", scenarioId)
      .single(),
    supabase
      .from("rubrics")
      .select("id, rubric_items(id, dimension, criterion, max_points, is_critical, order_index)")
      .eq("scenario_id", scenarioId)
      .single(),
    supabase
      .from("interventions")
      .select("id, action_type, elapsed_seconds, raw_text, confidence_score, created_at, casualty_id")
      .eq("run_id", runId)
      .order("elapsed_seconds", { ascending: true }),
    supabase
      .from("scores")
      .select("id, percentage, dimension_scores, evaluator_notes, created_at")
      .eq("run_id", runId)
      .single(),
  ])

  if (!run || !scenario) notFound()

  return (
    <GradeClient
      run={run}
      scenario={scenario}
      rubric={rubric}
      interventions={interventions ?? []}
      existingScore={existingScore ?? null}
    />
  )
}
