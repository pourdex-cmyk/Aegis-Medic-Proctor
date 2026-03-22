import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[#1a2444] border-blue-700/40 text-blue-300",
        secondary: "bg-[#1e2330] border-[#353c52] text-[#9daabf]",
        critical: "bg-red-950/80 border-red-800/60 text-red-300",
        urgent: "bg-orange-950/80 border-orange-800/60 text-orange-300",
        warning: "bg-amber-950/80 border-amber-700/60 text-amber-300",
        stable: "bg-green-950/80 border-green-800/60 text-green-300",
        intel: "bg-cyan-950/80 border-cyan-700/60 text-cyan-300",
        outline: "bg-transparent border-[#353c52] text-[#9daabf]",
        ghost: "bg-transparent border-transparent text-[#9daabf]",
        // Triage
        T1: "bg-red-900/70 border-red-600/50 text-red-200 font-bold",
        T2: "bg-amber-900/70 border-amber-600/50 text-amber-200 font-bold",
        T3: "bg-green-900/70 border-green-600/50 text-green-200 font-bold",
        T4: "bg-purple-900/70 border-purple-600/50 text-purple-200 font-bold",
        deceased: "bg-[#1a1e2a] border-[#353c52] text-[#6b7594] font-bold",
      },
      size: {
        sm: "px-1.5 py-0.5 text-[10px]",
        md: "px-2 py-0.5 text-xs",
        lg: "px-2.5 py-1 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            "status-dot",
            variant === "critical" || variant === "T1" ? "status-dot-critical" :
            variant === "warning" || variant === "T2" ? "status-dot-alert" :
            variant === "stable" || variant === "T3" ? "status-dot-stable" :
            variant === "default" ? "status-dot-active" :
            "status-dot-neutral"
          )}
        />
      )}
      {children}
    </span>
  )
}

export { Badge, badgeVariants }
