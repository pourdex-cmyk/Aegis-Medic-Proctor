"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  variant?: "default" | "critical" | "stable" | "alert" | "intel"
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  label?: string
  animated?: boolean
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant = "default", size = "md", showLabel, label, animated, ...props }, ref) => {
  const trackColors = {
    default: "bg-[#1e2330]",
    critical: "bg-red-950/50",
    stable: "bg-green-950/50",
    alert: "bg-amber-950/50",
    intel: "bg-cyan-950/50",
  }
  const fillColors = {
    default: "bg-blue-500",
    critical: "bg-red-500",
    stable: "bg-green-500",
    alert: "bg-amber-500",
    intel: "bg-cyan-400",
  }
  const heights = {
    sm: "h-1",
    md: "h-1.5",
    lg: "h-2.5",
  }

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs text-[#9daabf]">{label}</span>}
          {showLabel && <span className="text-xs text-[#6b7594]">{value ?? 0}%</span>}
        </div>
      )}
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden rounded-full",
          trackColors[variant],
          heights[size],
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full w-full flex-1 transition-all duration-500 rounded-full",
            fillColors[variant],
            animated && "animate-pulse"
          )}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      </ProgressPrimitive.Root>
    </div>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
