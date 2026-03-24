"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, ArrowRight, Loader2 } from "lucide-react"

export default function RolePlayerEntryPage() {
  const router = useRouter()
  const [token, setToken] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const clean = token.trim().toUpperCase().replace(/[^A-Z0-9]/g, "")
    if (clean.length < 4) {
      setError("Enter the code given to you by your proctor.")
      return
    }
    setLoading(true)
    setError("")

    // Validate token before navigating
    try {
      const res = await fetch(`/api/actor/${clean}`)
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Invalid code. Check with your proctor.")
        setLoading(false)
        return
      }
      router.push(`/role-player/${clean}`)
    } catch {
      setError("Connection error. Check your network and try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050607] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="h-16 w-16 rounded-2xl bg-[#1a2444] border border-blue-800/40 flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-black text-[#f0f4ff] tracking-tight">Aegis Medic</h1>
          <p className="text-sm text-[#4a5370] mt-1">Patient Role Player</p>
        </div>

        {/* Entry form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#6b7594] uppercase tracking-wider mb-2">
              Enter your patient code
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => {
                setError("")
                setToken(e.target.value.toUpperCase())
              }}
              placeholder="e.g. A3X7K2"
              maxLength={8}
              autoCapitalize="characters"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              className="w-full h-16 rounded-xl border border-[#2d3347] bg-[#0f1117] px-5 text-3xl font-black font-mono text-center text-[#f0f4ff] tracking-[0.3em] placeholder:text-[#2d3347] placeholder:text-base placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:border-blue-600 transition-colors"
            />
            {error && (
              <p className="mt-2 text-sm text-red-400 text-center">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || token.trim().length < 4}
            className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-[#1e2330] disabled:text-[#4a5370] text-white font-bold text-base flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Enter Scenario
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-[#3e465e] mt-8">
          Your proctor will give you a 6-character code when the scenario begins.
        </p>
      </div>
    </div>
  )
}
