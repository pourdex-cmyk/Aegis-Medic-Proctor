"use client"

import React, { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Shield, Eye, EyeOff, AlertCircle, ArrowRight, Lock, Mail } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

type SignInForm = z.infer<typeof signInSchema>

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") ?? "/app/dashboard"
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, formState: { errors } } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
  })

  const onSubmit = (data: SignInForm) => {
    setError(null)
    startTransition(async () => {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (authError) {
        setError(authError.message)
        return
      }

      toast.success("Signed in successfully")
      router.push(redirect)
      router.refresh()
    })
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] grid lg:grid-cols-2">
      {/* Left: Form */}
      <div className="flex flex-col justify-center px-8 py-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          className="max-w-sm w-full mx-auto"
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center shadow-lg shadow-blue-900/50">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-base font-bold text-[#f0f4ff] tracking-tight leading-none">Aegis Medic</p>
              <p className="text-[10px] text-[#4a5370] font-medium uppercase tracking-widest">Proctor</p>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#f0f4ff] tracking-tight mb-2">Sign in to your account</h1>
            <p className="text-sm text-[#6b7594]">
              Access your tactical medicine training platform
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="operator@unit.mil"
                autoComplete="email"
                error={!!errors.email}
                leftElement={<Mail className="h-3.5 w-3.5" />}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/auth/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                autoComplete="current-password"
                error={!!errors.password}
                leftElement={<Lock className="h-3.5 w-3.5" />}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[#4a5370] hover:text-[#9daabf] transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                }
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={isPending}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Sign In
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-[#6b7594]">
            Don&apos;t have an account?{" "}
            <Link href="/auth/sign-up" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Request access
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-[#3e465e]">
            Protected access — authorized personnel only
          </p>
        </motion.div>
      </div>

      {/* Right: Visual */}
      <div className="hidden lg:flex relative overflow-hidden bg-[#0f1117] border-l border-[#1e2330]">
        {/* Background grid */}
        <div className="absolute inset-0 grid-tactical opacity-60" />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/30 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#0f1117] to-transparent" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-end p-12 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="status-dot status-dot-active" />
              <span className="text-xs text-[#6b7594] font-medium uppercase tracking-wider">Platform Overview</span>
            </div>
            <h2 className="text-3xl font-bold text-[#f0f4ff] leading-tight mb-4 tracking-tight">
              Doctrine-aligned training.<br />
              <span className="gradient-text">AI-powered evaluation.</span>
            </h2>
            <p className="text-sm text-[#6b7594] leading-relaxed max-w-md">
              Generate scenarios, proctor multi-casualty exercises, and produce auditable
              after-action reports — all grounded in approved doctrine and driven by
              real training data.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              {[
                { label: "Scenario Types", value: "24+" },
                { label: "Doctrine Rules", value: "500+" },
                { label: "Training Orgs", value: "Multi" },
              ].map((stat) => (
                <div key={stat.label} className="bg-[#0a0c10]/60 border border-[#1e2330] rounded-lg px-4 py-3">
                  <p className="text-lg font-bold text-[#f0f4ff]">{stat.value}</p>
                  <p className="text-[11px] text-[#4a5370] mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Floating cards */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="absolute top-12 right-12 glass rounded-xl p-4 w-56"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="status-dot status-dot-critical animate-pulse" />
            <span className="text-xs font-semibold text-red-300">T1 — Immediate</span>
          </div>
          <p className="text-xs text-[#9daabf] mb-2">Casualty Alpha</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#1e2330] rounded-full h-1.5">
              <div className="bg-red-500 rounded-full h-1.5 w-1/3" />
            </div>
            <span className="text-[10px] text-red-400 font-mono">HR 142</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="absolute top-36 right-24 glass rounded-xl p-4 w-48"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="status-dot status-dot-stable" />
            <span className="text-xs font-semibold text-green-300">Stabilized</span>
          </div>
          <p className="text-[10px] text-[#9daabf]">Tourniquet applied • 00:04:22</p>
        </motion.div>
      </div>
    </div>
  )
}
