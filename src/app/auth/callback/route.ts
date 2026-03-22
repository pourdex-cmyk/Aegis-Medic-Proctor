import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const requestedNext = searchParams.get("next")

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Determine redirect: explicit next param > check membership > onboarding
      let next = requestedNext ?? "/app/dashboard"

      if (!requestedNext) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: member } = await supabase
            .from("organization_members")
            .select("id")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .limit(1)
            .single()
          if (!member) next = "/onboarding"
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host")
      const isLocalEnv = process.env.NODE_ENV === "development"
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/sign-in?error=auth_callback_failed`)
}
