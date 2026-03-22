"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Shield, Mail, CheckCircle2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert } from "@/components/ui/alert"
import { createBrowserClient } from "@supabase/ssr"

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
})
type Form = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: Form) => {
    setServerError(null)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${appUrl}/auth/reset-password`,
    })
    if (error) {
      setServerError(error.message)
      return
    }
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-900/40 mb-4">
            <Shield className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-bold text-[#f0f4ff]">Forgot your password?</h1>
          <p className="text-sm text-[#6b7594] mt-1 text-center">
            Enter your email and we&apos;ll send a reset link
          </p>
        </div>

        {sent ? (
          <div className="rounded-2xl border border-green-800/30 bg-green-950/20 p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-3" />
            <h2 className="text-base font-bold text-[#f0f4ff] mb-2">Check your inbox</h2>
            <p className="text-sm text-[#6b7594] mb-5">
              We sent a password reset link to{" "}
              <span className="text-[#d3dce8] font-medium">{getValues("email")}</span>.
            </p>
            <Link
              href="/auth/sign-in"
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to sign in
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#1e2330] bg-[#0d0f14] p-8">
            {serverError && (
              <Alert variant="destructive" className="mb-5">
                {serverError}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="email" required>Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="operator@unit.mil"
                  className="mt-1.5"
                  error={!!errors.email}
                  leftElement={<Mail className="h-3.5 w-3.5" />}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                loading={isSubmitting}
                leftIcon={<Mail className="h-4 w-4" />}
              >
                Send reset link
              </Button>
            </form>

            <div className="mt-5 text-center">
              <Link
                href="/auth/sign-in"
                className="text-xs text-[#4a5370] hover:text-[#9daabf] transition-colors flex items-center justify-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to sign in
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
