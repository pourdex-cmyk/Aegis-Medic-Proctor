import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftElement?: React.ReactNode
  rightElement?: React.ReactNode
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leftElement, rightElement, error, ...props }, ref) => {
    if (leftElement || rightElement) {
      return (
        <div className="relative flex items-center">
          {leftElement && (
            <div className="absolute left-3 flex items-center text-[#6b7594] pointer-events-none">
              {leftElement}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-9 w-full rounded-md border bg-[#0f1117] px-3 py-2 text-sm text-[#f0f4ff] placeholder:text-[#4a5370] transition-colors",
              "border-[#2d3347] focus:border-blue-600/60 focus:outline-none focus:ring-1 focus:ring-blue-600/40",
              "disabled:cursor-not-allowed disabled:opacity-40",
              error && "border-red-700/60 focus:border-red-600 focus:ring-red-600/30",
              leftElement && "pl-9",
              rightElement && "pr-9",
              className
            )}
            ref={ref}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 flex items-center text-[#6b7594]">
              {rightElement}
            </div>
          )}
        </div>
      )
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border bg-[#0f1117] px-3 py-2 text-sm text-[#f0f4ff] placeholder:text-[#4a5370] transition-colors",
          "border-[#2d3347] focus:border-blue-600/60 focus:outline-none focus:ring-1 focus:ring-blue-600/40",
          "disabled:cursor-not-allowed disabled:opacity-40",
          error && "border-red-700/60 focus:border-red-600 focus:ring-red-600/30",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
