"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
    indeterminate?: boolean
  }
>(({ className, indeterminate, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded border border-[#4a5370] bg-[#0f1117] transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0c10]",
      "disabled:cursor-not-allowed disabled:opacity-40",
      "data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600",
      "data-[state=indeterminate]:bg-blue-600 data-[state=indeterminate]:border-blue-600",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-white">
      {indeterminate ? (
        <Minus className="h-2.5 w-2.5" strokeWidth={3} />
      ) : (
        <Check className="h-2.5 w-2.5" strokeWidth={3} />
      )}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
