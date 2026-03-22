import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public paths that don't require auth
  const publicPaths = [
    "/",
    "/auth/sign-in",
    "/auth/sign-up",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/callback",
    "/invite",
    "/role-player",
    "/api",
  ]

  const isPublicPath = publicPaths.some((p) => pathname === p || pathname.startsWith(p))

  // Redirect unauthenticated users to sign-in
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/sign-in"
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname.startsWith("/auth/sign-in") || pathname.startsWith("/auth/sign-up"))) {
    const url = request.nextUrl.clone()
    url.pathname = "/app/dashboard"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
