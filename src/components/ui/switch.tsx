"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> & {
    size?: "sm" | "md"
  }
>(({ className, size = "md", ...props }, ref) => {
  const sizes = {
    sm: { root: "h-4 w-7", thumb: "h-3 w-3 data-[state=checked]:translate-x-3" },
    md: { root: "h-5 w-9", thumb: "h-4 w-4 data-[state=checked]:translate-x-4" },
  }
  return (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(
        "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0c10]",
        "disabled:cursor-not-allowed disabled:opacity-40",
        "data-[state=unchecked]:bg-[#353c52] data-[state=checked]:bg-blue-600",
        sizes[size].root,
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block rounded-full bg-white shadow-md ring-0 transition-transform",
          "data-[state=unchecked]:translate-x-0",
          sizes[size].thumb
        )}
      />
    </SwitchPrimitive.Root>
  )
})
Switch.displayName = SwitchPrimitive.Root.displayName

export { Switch }
