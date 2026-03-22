"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cn } from "@/lib/utils"

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & {
    required?: boolean
    hint?: string
  }
>(({ className, required, hint, children, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "text-sm font-medium text-[#b8c4d6] leading-none cursor-default select-none",
      "peer-disabled:opacity-40",
      className
    )}
    {...props}
  >
    {children}
    {required && <span className="ml-1 text-red-400">*</span>}
    {hint && <span className="ml-1.5 text-[#6b7594] font-normal text-xs">({hint})</span>}
  </LabelPrimitive.Root>
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
