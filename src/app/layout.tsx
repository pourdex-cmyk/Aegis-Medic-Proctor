import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: {
    template: "%s | Aegis Medic Proctor",
    default: "Aegis Medic Proctor — Tactical Medicine Training Platform",
  },
  description:
    "AI-first tactical medicine scenario generation, proctoring, simulation control, multi-casualty orchestration, training evaluation, and after-action reporting for military, law enforcement, and EMS training environments.",
  keywords: ["tactical medicine", "TCCC training", "medical simulation", "MASCAL", "proctoring", "scenario generation"],
  authors: [{ name: "Aegis Medic" }],
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    title: "Aegis Medic Proctor",
    description: "AI-first tactical medicine training platform",
    siteName: "Aegis Medic Proctor",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0c10",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} dark h-full`} suppressHydrationWarning>
      <body className="h-full antialiased font-sans bg-[#0a0c10] text-[#f0f4ff]">
        {children}
        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{
            classNames: {
              toast: "!bg-[#1e2330] !border-[#2d3347] !text-[#f0f4ff] !shadow-xl !shadow-black/50",
              title: "!text-[#f0f4ff] !font-semibold",
              description: "!text-[#9daabf]",
              actionButton: "!bg-blue-600 !text-white",
              cancelButton: "!bg-[#252b3b] !text-[#9daabf]",
              closeButton: "!bg-[#252b3b] !border-[#353c52] !text-[#6b7594] hover:!text-[#f0f4ff]",
              error: "!bg-red-950/80 !border-red-800/60",
              success: "!bg-green-950/80 !border-green-800/60",
              warning: "!bg-amber-950/80 !border-amber-800/60",
              info: "!bg-blue-950/80 !border-blue-800/60",
            },
          }}
        />
        <Analytics />
      </body>
    </html>
  )
}
