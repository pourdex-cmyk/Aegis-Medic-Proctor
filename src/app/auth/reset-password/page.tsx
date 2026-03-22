"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Shield, Lock, Eye, EyeOff, CheckCircle2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert } from "@/components/ui/alert"
import { createBrowserClient } from "@supabase/ssr"
import Link from "next/link"

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  })

type Form = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [sessionReady, setSessionReady] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) })

  useEffect(() => {
    // Supabase sets the session from the URL hash when the user clicks the reset link
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true)
      }
    })
  }, [supabase])

  const onSubmit = async (data: Form) => {
    setServerError(null)
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) {
      setServerError(error.message)
      return
    }
    setSuccess(true)
    setTimeout(() => router.push("/app/dashboard"), 2500)
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-900/40 mb-4">
            <Shield className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-bold text-[#f0f4ff]">Reset your password</h1>
          <p className="text-sm text-[#6b7594] mt-1">Choose a new secure password</p>
        </div>

        {success ? (
          <div className="rounded-2xl border border-green-800/30 bg-green-950/20 p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-3" />
            <h2 className="text-base font-bold text-[#f0f4ff] mb-2">Password updated</h2>
            <p className="text-sm text-[#6b7594]">Redirecting you to your dashboard…</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#1e2330] bg-[#0d0f14] p-8">
            {!sessionReady && (
              <Alert variant="warning" className="mb-5">
                <AlertTriangle className="h-4 w-4" />
                Waiting for password reset session. Please make sure you followed the link from your email.
              </Alert>
            )}

            {serverError && (
              <Alert variant="destructive" className="mb-5">
                {serverError}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="password" required>New password</Label>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  className="mt-1.5"
                  error={!!errors.password}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-[#4a5370] hover:text-[#9daabf] transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="confirm" required>Confirm password</Label>
                <Input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat your password"
                  className="mt-1.5"
                  error={!!errors.confirm}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="text-[#4a5370] hover:text-[#9daabf] transition-colors"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  {...register("confirm")}
                />
                {errors.confirm && (
                  <p className="text-xs text-red-400 mt-1">{errors.confirm.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full mt-2"
                size="lg"
                loading={isSubmitting}
                disabled={!sessionReady}
                leftIcon={<Lock className="h-4 w-4" />}
              >
                Update password
              </Button>
            </form>

            <div className="mt-5 text-center">
              <Link href="/auth/sign-in" className="text-xs text-[#4a5370] hover:text-[#9daabf] transition-colors">
                Back to sign in
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
