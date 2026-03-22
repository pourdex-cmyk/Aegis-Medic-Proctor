"use client"

import React, { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Shield, Eye, EyeOff, AlertCircle, ArrowRight, Lock, Mail, User } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

const signUpSchema = z.object({
  display_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
})

type SignUpForm = z.infer<typeof signUpSchema>

export default function SignUpPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, formState: { errors } } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
  })

  const onSubmit = (data: SignUpForm) => {
    setError(null)
    startTransition(async () => {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { display_name: data.display_name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        setError(authError.message)
        return
      }

      setSuccess(true)
    })
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-900/40">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[#f0f4ff] mb-3">Check your email</h2>
          <p className="text-sm text-[#6b7594] mb-8">
            We sent a confirmation link to your email address. Click the link to activate your account and continue setup.
          </p>
          <Link href="/auth/sign-in">
            <Button variant="secondary" className="w-full">Back to Sign In</Button>
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        className="max-w-sm w-full"
      >
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
          <h1 className="text-2xl font-bold text-[#f0f4ff] tracking-tight mb-2">Create your account</h1>
          <p className="text-sm text-[#6b7594]">
            Start building doctrine-aligned training scenarios
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="display_name">Full name</Label>
            <Input
              id="display_name"
              placeholder="Sergeant Smith"
              leftElement={<User className="h-3.5 w-3.5" />}
              error={!!errors.display_name}
              {...register("display_name")}
            />
            {errors.display_name && (
              <p className="text-xs text-red-400">{errors.display_name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="operator@unit.mil"
              leftElement={<Mail className="h-3.5 w-3.5" />}
              error={!!errors.email}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Min. 8 characters"
              leftElement={<Lock className="h-3.5 w-3.5" />}
              rightElement={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[#4a5370] hover:text-[#9daabf]">
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              }
              error={!!errors.password}
              {...register("password")}
            />
            {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm_password">Confirm password</Label>
            <Input
              id="confirm_password"
              type={showPassword ? "text" : "password"}
              placeholder="Confirm password"
              leftElement={<Lock className="h-3.5 w-3.5" />}
              error={!!errors.confirm_password}
              {...register("confirm_password")}
            />
            {errors.confirm_password && <p className="text-xs text-red-400">{errors.confirm_password.message}</p>}
          </div>

          <Button type="submit" className="w-full mt-2" size="lg" loading={isPending} rightIcon={<ArrowRight className="h-4 w-4" />}>
            Create Account
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-[#6b7594]">
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-[#3e465e]">
          By creating an account you agree to our terms of service
        </p>
      </motion.div>
    </div>
  )
}
