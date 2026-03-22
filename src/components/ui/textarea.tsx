import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border bg-[#0f1117] px-3 py-2 text-sm text-[#f0f4ff] placeholder:text-[#4a5370] transition-colors",
          "border-[#2d3347] focus:border-blue-600/60 focus:outline-none focus:ring-1 focus:ring-blue-600/40",
          "disabled:cursor-not-allowed disabled:opacity-40 resize-none",
          error && "border-red-700/60 focus:border-red-600 focus:ring-red-600/30",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
