import Link from "next/link"
import { Shield, Activity, Brain, BarChart2, Users, BookOpen, ChevronRight, CheckCircle2, Zap, Lock, Target } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#d3dce8] font-sans">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1e2330]/60 bg-[#0a0c10]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/40">
              <Shield className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold text-[#f0f4ff] tracking-tight">Aegis Medic Proctor</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-[#6b7594]">
            <a href="#features" className="hover:text-[#d3dce8] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#d3dce8] transition-colors">How It Works</a>
            <a href="#security" className="hover:text-[#d3dce8] transition-colors">Security</a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/sign-in"
              className="text-sm text-[#9daabf] hover:text-[#f0f4ff] transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/auth/sign-up"
              className="inline-flex items-center gap-1.5 h-8 px-4 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/30"
            >
              Get started
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-24 px-6 max-w-7xl mx-auto text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/6 rounded-full blur-3xl" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/8 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
          AI-First Tactical Medicine Training
        </div>

        <h1 className="text-5xl md:text-6xl font-black text-[#f0f4ff] tracking-tight leading-tight mb-6 max-w-4xl mx-auto">
          Train harder.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            Grade smarter.
          </span>
          <br />Save more lives.
        </h1>

        <p className="text-lg text-[#6b7594] max-w-2xl mx-auto leading-relaxed mb-10">
          Aegis Medic Proctor is a production-grade tactical medicine simulation platform for military,
          law enforcement, and EMS training organizations. AI-generated scenarios, deterministic physiology,
          and doctrine-grounded AAR reports — all in one secure platform.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth/sign-up"
            className="inline-flex items-center gap-2 h-12 px-8 rounded-lg bg-blue-600 text-white text-base font-semibold hover:bg-blue-500 transition-all shadow-2xl shadow-blue-900/40 hover:shadow-blue-900/60 hover:scale-[1.02] active:scale-[0.98]"
          >
            Start free trial
            <ChevronRight className="h-4 w-4" />
          </Link>
          <Link
            href="/auth/sign-in"
            className="inline-flex items-center gap-2 h-12 px-8 rounded-lg border border-[#2d3347] text-[#9daabf] text-base font-medium hover:border-[#4a5370] hover:text-[#d3dce8] transition-all"
          >
            Sign in to your org
          </Link>
        </div>

        {/* Social proof */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-14 text-[11px] text-[#4a5370] uppercase tracking-widest font-semibold">
          <span>TCCC Compliant</span>
          <span className="h-1 w-1 rounded-full bg-[#2d3347]" />
          <span>TEMS Doctrine Ready</span>
          <span className="h-1 w-1 rounded-full bg-[#2d3347]" />
          <span>SOC 2 Type II</span>
          <span className="h-1 w-1 rounded-full bg-[#2d3347]" />
          <span>HIPAA Aligned</span>
          <span className="h-1 w-1 rounded-full bg-[#2d3347]" />
          <span>Zero AI Medical Invention</span>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-[#1e2330] bg-[#0d0f14]">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: "< 45s", label: "Scenario generation time" },
            { value: "100%", label: "Deterministic physiology" },
            { value: "8+", label: "Scoring dimensions" },
            { value: "0", label: "AI medical invention" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-black text-[#f0f4ff] mb-1">{value}</div>
              <div className="text-xs text-[#4a5370] uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black text-[#f0f4ff] mb-4">
            Everything your training cell needs
          </h2>
          <p className="text-[#6b7594] max-w-xl mx-auto">
            From scenario generation to after action review, Aegis Medic Proctor covers the full
            tactical medicine training lifecycle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              icon: Brain,
              color: "text-blue-400",
              bg: "bg-blue-500/10 border-blue-500/20",
              title: "AI Scenario Studio",
              description:
                "Generate complex, realistic MASCAL and TCCC scenarios in seconds. AI writes the narrative — not the physiology. Every casualty profile is clinically auditable.",
            },
            {
              icon: Activity,
              color: "text-green-400",
              bg: "bg-green-500/10 border-green-500/20",
              title: "Deterministic Simulation",
              description:
                "A fully deterministic, real-time physiology engine. Vitals deteriorate based on proven shock models — no AI-generated medical truth, ever.",
            },
            {
              icon: Target,
              color: "text-red-400",
              bg: "bg-red-500/10 border-red-500/20",
              title: "Live Command Center",
              description:
                "Run scenarios in real time. Clock, triage board, treatment logging with AI interpretation, AI copilot for instructors, and full event queue.",
            },
            {
              icon: BarChart2,
              color: "text-amber-400",
              bg: "bg-amber-500/10 border-amber-500/20",
              title: "Doctrine-Grounded AAR",
              description:
                "After action reports grounded in your approved doctrine packs. AI generates narrative — tied explicitly to what your doctrine says, never beyond it.",
            },
            {
              icon: BookOpen,
              color: "text-purple-400",
              bg: "bg-purple-500/10 border-purple-500/20",
              title: "Doctrine Management",
              description:
                "Upload, chunk, embed, and approve doctrine documents. Subject matter experts review extracted rules before they influence any AI output.",
            },
            {
              icon: Users,
              color: "text-cyan-400",
              bg: "bg-cyan-500/10 border-cyan-500/20",
              title: "Multi-Org, Role-Gated",
              description:
                "Organization-isolated multi-tenancy with fine-grained roles: Lead Proctor, Proctor, Doctrine SME, Analyst, Observer. Full RLS at the database layer.",
            },
          ].map(({ icon: Icon, color, bg, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-[#1e2330] bg-[#0d0f14] p-6 hover:border-[#2d3347] transition-colors group"
            >
              <div className={`inline-flex h-10 w-10 rounded-xl border items-center justify-center mb-4 ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <h3 className="text-base font-bold text-[#f0f4ff] mb-2">{title}</h3>
              <p className="text-sm text-[#6b7594] leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6 bg-[#0d0f14] border-y border-[#1e2330]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-[#f0f4ff] mb-4">How it works</h2>
            <p className="text-[#6b7594]">Four steps from setup to debrief</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Load Doctrine", description: "Upload your approved TCCC/TEMS doctrine packs. SMEs review AI-extracted rules before activation." },
              { step: "02", title: "Generate Scenario", description: "Configure audience, environment, complexity, and clinical emphasis. AI generates the scenario package in under a minute." },
              { step: "03", title: "Run Live", description: "Instructors manage real-time simulation. Log treatments, track vitals, get AI copilot advice, all in one view." },
              { step: "04", title: "Debrief with AAR", description: "Structured after action report with dimension scoring, doctrine compliance analysis, and AI-generated narrative grounded in your doctrine." },
            ].map(({ step, title, description }) => (
              <div key={step} className="relative">
                <div className="text-4xl font-black text-[#1e2330] mb-4">{step}</div>
                <h3 className="text-sm font-bold text-[#f0f4ff] mb-2">{title}</h3>
                <p className="text-xs text-[#6b7594] leading-relaxed">{description}</p>
                {step !== "04" && (
                  <div className="hidden md:block absolute top-5 left-full w-full h-px bg-gradient-to-r from-[#2d3347] to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Safety callout */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-10">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="shrink-0">
              <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Shield className="h-7 w-7 text-amber-400" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-black text-[#f0f4ff] mb-3">
                AI that never invents medical truth
              </h2>
              <p className="text-sm text-[#9daabf] leading-relaxed mb-5 max-w-2xl">
                Every AI prompt in Aegis Medic Proctor carries an explicit system-level constraint: the model
                may write scenarios, narratives, and grading summaries — but it is prohibited from generating
                clinical protocols, treatment outcomes, or physiologic responses. Those are exclusively
                computed by our deterministic simulation engine, grounded in your approved doctrine.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                {[
                  "Zero unconstrained medical output",
                  "Deterministic physiology engine",
                  "Doctrine-locked grading",
                  "Full audit log on every AI call",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-[#d3dce8]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="py-24 px-6 bg-[#0d0f14] border-y border-[#1e2330]">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-black text-[#f0f4ff] mb-4">Built for security-conscious organizations</h2>
          <p className="text-[#6b7594] mb-12 max-w-xl mx-auto">
            Defense-grade data isolation, row-level security, and a complete audit trail — from day one.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Lock, label: "Row Level Security", desc: "Postgres RLS on all 30 tables" },
              { icon: Shield, label: "Org Isolation", desc: "Complete multi-tenant isolation" },
              { icon: Zap, label: "Audit Log", desc: "Every action recorded" },
              { icon: CheckCircle2, label: "Auth by Supabase", desc: "PKCE, MFA, JWT rotation" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="rounded-xl border border-[#1e2330] bg-[#0a0c10] p-5 text-center">
                <Icon className="h-6 w-6 text-blue-400 mx-auto mb-3" />
                <p className="text-xs font-bold text-[#f0f4ff] mb-1">{label}</p>
                <p className="text-[11px] text-[#4a5370]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center max-w-3xl mx-auto">
        <h2 className="text-4xl font-black text-[#f0f4ff] mb-4">
          Ready to modernize your training program?
        </h2>
        <p className="text-[#6b7594] mb-10 leading-relaxed">
          Get your organization set up in minutes. Import your doctrine, generate your first scenario,
          and run your first AI-graded exercise today.
        </p>
        <Link
          href="/auth/sign-up"
          className="inline-flex items-center gap-2 h-14 px-10 rounded-xl bg-blue-600 text-white text-lg font-bold hover:bg-blue-500 transition-all shadow-2xl shadow-blue-900/50 hover:shadow-blue-900/70 hover:scale-[1.02] active:scale-[0.98]"
        >
          Create your organization
          <ChevronRight className="h-5 w-5" />
        </Link>
        <p className="text-xs text-[#4a5370] mt-4">No credit card required for free tier.</p>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1e2330] bg-[#0d0f14]">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-md bg-blue-600 flex items-center justify-center">
              <Shield className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold text-[#9daabf]">Aegis Medic Proctor</span>
          </div>
          <p className="text-xs text-[#3e465e]">
            © {new Date().getFullYear()} Aegis Medic Proctor. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-xs text-[#4a5370]">
            <Link href="/auth/sign-in" className="hover:text-[#9daabf] transition-colors">Sign in</Link>
            <Link href="/auth/sign-up" className="hover:text-[#9daabf] transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
