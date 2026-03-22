// Auto-generated from schema. Run: npx supabase gen types typescript --local > src/lib/supabase/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          type: string
          logo_url: string | null
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          type: string
          logo_url?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>
        Relationships: []
      }
      organization_members: {
        Row: {
          id: string
          org_id: string
          user_id: string
          role: string
          display_name: string
          is_active: boolean
          joined_at: string
        }
        Insert: {
          id?: string
          org_id: string
          user_id: string
          role: string
          display_name: string
          is_active?: boolean
          joined_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["organization_members"]["Insert"]>
        Relationships: []
      }
      organization_invites: {
        Row: {
          id: string
          org_id: string
          email: string
          role: string
          token: string
          invited_by: string | null
          accepted_at: string | null
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          email: string
          role: string
          token: string
          invited_by?: string | null
          accepted_at?: string | null
          expires_at: string
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["organization_invites"]["Insert"]>
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string
          avatar_url: string | null
          current_org_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name: string
          avatar_url?: string | null
          current_org_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>
        Relationships: []
      }
      doctrine_packs: {
        Row: {
          id: string
          org_id: string
          name: string
          version: string
          audience: string
          status: string
          description: string | null
          source_reference: string | null
          approved_by: string | null
          approved_at: string | null
          document_count: number
          rule_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          version?: string
          audience: string
          status?: string
          description?: string | null
          source_reference?: string | null
          approved_by?: string | null
          approved_at?: string | null
          document_count?: number
          rule_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["doctrine_packs"]["Insert"]>
        Relationships: []
      }
      doctrine_documents: {
        Row: {
          id: string
          pack_id: string
          org_id: string
          title: string
          file_url: string | null
          content_text: string | null
          file_type: string
          status: string
          chunk_count: number
          created_at: string
        }
        Insert: {
          id?: string
          pack_id: string
          org_id: string
          title: string
          file_url?: string | null
          content_text?: string | null
          file_type: string
          status?: string
          chunk_count?: number
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["doctrine_documents"]["Insert"]>
        Relationships: []
      }
      doctrine_chunks: {
        Row: {
          id: string
          document_id: string
          pack_id: string
          content: string
          page_number: number | null
          section_title: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          pack_id: string
          content: string
          page_number?: number | null
          section_title?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["doctrine_chunks"]["Insert"]>
        Relationships: []
      }
      doctrine_rules: {
        Row: {
          id: string
          pack_id: string
          chunk_id: string | null
          category: string
          title: string
          description: string
          critical_action: boolean
          timing_expectation: string | null
          failure_condition: string | null
          priority: number | null
          source_citation: string | null
          approval_status: string
          approved_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          pack_id: string
          chunk_id?: string | null
          category: string
          title: string
          description: string
          critical_action?: boolean
          timing_expectation?: string | null
          failure_condition?: string | null
          priority?: number | null
          source_citation?: string | null
          approval_status?: string
          approved_by?: string | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["doctrine_rules"]["Insert"]>
        Relationships: []
      }
      scenarios: {
        Row: {
          id: string
          org_id: string
          doctrine_pack_id: string | null
          created_by: string
          title: string
          description: string | null
          audience: string
          environment: string
          scenario_type: string
          complexity: string
          casualty_count: number
          evac_delay_minutes: number
          status: string
          ai_generated: boolean
          settings: Json
          objectives: Json
          overview_narrative: string | null
          instructor_notes: string | null
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          doctrine_pack_id?: string | null
          created_by: string
          title: string
          description?: string | null
          audience: string
          environment: string
          scenario_type: string
          complexity: string
          casualty_count?: number
          evac_delay_minutes?: number
          status?: string
          ai_generated?: boolean
          settings?: Json
          objectives?: Json
          overview_narrative?: string | null
          instructor_notes?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["scenarios"]["Insert"]>
        Relationships: []
      }
      scenario_injects: {
        Row: {
          id: string
          scenario_id: string
          title: string
          description: string
          trigger_type: string
          trigger_time_seconds: number | null
          trigger_condition: string | null
          effect_description: string | null
          affects_casualty_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          scenario_id: string
          title: string
          description: string
          trigger_type: string
          trigger_time_seconds?: number | null
          trigger_condition?: string | null
          effect_description?: string | null
          affects_casualty_id?: string | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["scenario_injects"]["Insert"]>
        Relationships: []
      }
      casualty_profiles: {
        Row: {
          id: string
          scenario_id: string
          org_id: string
          callsign: string
          display_label: string
          age: number | null
          sex: string | null
          weight_kg: number | null
          mechanism_of_injury: string
          visible_injuries: Json
          suspected_internal_injuries: Json
          hidden_complications: Json
          airway_status: string
          breathing_status: string
          circulation_state: string
          neurologic_status: string
          pain_level: number
          mental_status: string
          baseline_vitals: Json
          deterioration_profile: Json
          triage_category: string
          audio_profile: Json
          ai_generated: boolean
          proctor_notes: string | null
          reveal_hidden_to_proctor: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          scenario_id: string
          org_id: string
          callsign: string
          display_label: string
          age?: number | null
          sex?: string | null
          weight_kg?: number | null
          mechanism_of_injury: string
          visible_injuries?: Json
          suspected_internal_injuries?: Json
          hidden_complications?: Json
          airway_status?: string
          breathing_status?: string
          circulation_state?: string
          neurologic_status?: string
          pain_level?: number
          mental_status?: string
          baseline_vitals?: Json
          deterioration_profile?: Json
          triage_category?: string
          audio_profile?: Json
          ai_generated?: boolean
          proctor_notes?: string | null
          reveal_hidden_to_proctor?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["casualty_profiles"]["Insert"]>
        Relationships: []
      }
      scenario_runs: {
        Row: {
          id: string
          scenario_id: string
          org_id: string
          lead_proctor_id: string
          title: string | null
          status: string
          started_at: string | null
          paused_at: string | null
          completed_at: string | null
          clock_seconds: number
          speed_multiplier: number
          created_at: string
        }
        Insert: {
          id?: string
          scenario_id: string
          org_id: string
          lead_proctor_id: string
          title?: string | null
          status?: string
          started_at?: string | null
          paused_at?: string | null
          completed_at?: string | null
          clock_seconds?: number
          speed_multiplier?: number
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["scenario_runs"]["Insert"]>
        Relationships: []
      }
      casualty_states: {
        Row: {
          id: string
          run_id: string
          casualty_id: string
          current_vitals: Json
          airway_status: string
          breathing_status: string
          circulation_state: string
          neurologic_status: string
          triage_category: string
          outcome: string
          estimated_blood_loss_ml: number
          shock_index: number
          interventions_applied: string[]
          last_reassessed_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          run_id: string
          casualty_id: string
          current_vitals?: Json
          airway_status?: string
          breathing_status?: string
          circulation_state?: string
          neurologic_status?: string
          triage_category?: string
          outcome?: string
          estimated_blood_loss_ml?: number
          shock_index?: number
          interventions_applied?: string[]
          last_reassessed_at?: string | null
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["casualty_states"]["Insert"]>
        Relationships: []
      }
      interventions: {
        Row: {
          id: string
          run_id: string
          casualty_id: string
          proctor_id: string
          raw_text: string | null
          action_type: string
          body_location: string | null
          laterality: string | null
          quality: string | null
          performer: string | null
          confidence_score: number
          status: string
          elapsed_seconds: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          run_id: string
          casualty_id: string
          proctor_id: string
          raw_text?: string | null
          action_type: string
          body_location?: string | null
          laterality?: string | null
          quality?: string | null
          performer?: string | null
          confidence_score?: number
          status?: string
          elapsed_seconds?: number
          notes?: string | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["interventions"]["Insert"]>
        Relationships: []
      }
      audio_cues: {
        Row: {
          id: string
          org_id: string | null
          pack_id: string | null
          category: string
          title: string
          script_text: string
          intensity: string
          voice_style: string | null
          duration_seconds: number | null
          tags: string[]
          is_system: boolean
          created_at: string
        }
        Insert: {
          id?: string
          org_id?: string | null
          pack_id?: string | null
          category: string
          title: string
          script_text: string
          intensity?: string
          voice_style?: string | null
          duration_seconds?: number | null
          tags?: string[]
          is_system?: boolean
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["audio_cues"]["Insert"]>
        Relationships: []
      }
      audio_events: {
        Row: {
          id: string
          run_id: string
          casualty_id: string | null
          cue_id: string | null
          triggered_by: string
          actor_id: string | null
          script_text: string
          played_at: string | null
          elapsed_seconds: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          run_id: string
          casualty_id?: string | null
          cue_id?: string | null
          triggered_by: string
          actor_id?: string | null
          script_text: string
          played_at?: string | null
          elapsed_seconds?: number
          status?: string
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["audio_events"]["Insert"]>
        Relationships: []
      }
      rubrics: {
        Row: {
          id: string
          org_id: string
          doctrine_pack_id: string | null
          name: string
          description: string | null
          scenario_type: string
          is_default: boolean
          dimension_weights: Json
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          doctrine_pack_id?: string | null
          name: string
          description?: string | null
          scenario_type?: string
          is_default?: boolean
          dimension_weights?: Json
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["rubrics"]["Insert"]>
        Relationships: []
      }
      rubric_items: {
        Row: {
          id: string
          rubric_id: string
          rule_id: string | null
          label: string
          description: string | null
          dimension: string
          max_points: number
          critical: boolean
          created_at: string
        }
        Insert: {
          id?: string
          rubric_id: string
          rule_id?: string | null
          label: string
          description?: string | null
          dimension: string
          max_points?: number
          critical?: boolean
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["rubric_items"]["Insert"]>
        Relationships: []
      }
      scores: {
        Row: {
          id: string
          run_id: string
          casualty_id: string | null
          rubric_id: string
          evaluator_id: string
          total_score: number
          max_possible: number
          percentage: number
          dimension_scores: Json
          passed: boolean
          ai_narrative: string | null
          evaluator_notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          run_id: string
          casualty_id?: string | null
          rubric_id: string
          evaluator_id: string
          total_score: number
          max_possible: number
          percentage: number
          dimension_scores?: Json
          passed?: boolean
          ai_narrative?: string | null
          evaluator_notes?: string | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["scores"]["Insert"]>
        Relationships: []
      }
      reports: {
        Row: {
          id: string
          run_id: string
          org_id: string
          generated_by: string
          title: string
          status: string
          summary: string | null
          ai_narrative: string | null
          remediation_plan: Json | null
          strengths: string[]
          failures: string[]
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          run_id: string
          org_id: string
          generated_by: string
          title: string
          status?: string
          summary?: string | null
          ai_narrative?: string | null
          remediation_plan?: Json | null
          strengths?: string[]
          failures?: string[]
          metadata?: Json
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["reports"]["Insert"]>
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          org_id: string
          actor_id: string | null
          actor_display_name: string | null
          action: string
          resource_type: string
          resource_id: string | null
          description: string
          metadata: Json
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          actor_id?: string | null
          actor_display_name?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          description: string
          metadata?: Json
          ip_address?: string | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>
        Relationships: []
      }
      run_participants: {
        Row: {
          id: string
          run_id: string
          user_id: string
          role: string
          joined_at: string
        }
        Insert: {
          id?: string
          run_id: string
          user_id: string
          role: string
          joined_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["run_participants"]["Insert"]>
        Relationships: []
      }
      intervention_interpretations: {
        Row: {
          id: string
          intervention_id: string
          action_type: string
          body_location: string | null
          laterality: string | null
          quality: string | null
          confidence: number
          ambiguity_flags: string[]
          effect_description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          intervention_id: string
          action_type: string
          body_location?: string | null
          laterality?: string | null
          quality?: string | null
          confidence?: number
          ambiguity_flags?: string[]
          effect_description?: string | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["intervention_interpretations"]["Insert"]>
        Relationships: []
      }
      feature_flags: {
        Row: {
          id: string
          key: string
          enabled: boolean
          org_id: string | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          key: string
          enabled?: boolean
          org_id?: string | null
          description?: string | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["feature_flags"]["Insert"]>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
