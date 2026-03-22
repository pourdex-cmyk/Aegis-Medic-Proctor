"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    variant?: "default" | "critical" | "stable" | "alert"
    showValue?: boolean
    formatValue?: (v: number) => string
  }
>(({ className, variant = "default", showValue, formatValue, ...props }, ref) => {
  const colors = {
    default: "bg-blue-500",
    critical: "bg-red-500",
    stable: "bg-green-500",
    alert: "bg-amber-500",
  }
  const value = Array.isArray(props.value) ? props.value[0] : props.defaultValue?.[0] ?? 0
  return (
    <div className="w-full">
      {showValue && (
        <div className="flex justify-end mb-1">
          <span className="text-xs text-[#9daabf]">
            {formatValue ? formatValue(value as number) : value}
          </span>
        </div>
      )}
      <SliderPrimitive.Root
        ref={ref}
        className={cn("relative flex w-full touch-none select-none items-center", className)}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-[#2d3347]">
          <SliderPrimitive.Range className={cn("absolute h-full rounded-full", colors[variant])} />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className={cn(
            "block h-4 w-4 rounded-full border-2 border-white bg-white shadow-md transition-transform",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0c10]",
            "hover:scale-110 active:scale-95 cursor-grab active:cursor-grabbing",
            "disabled:pointer-events-none disabled:opacity-40"
          )}
        />
      </SliderPrimitive.Root>
    </div>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
