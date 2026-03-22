import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0c10] disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98] cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-blue-600 text-white shadow-lg shadow-blue-900/30 hover:bg-blue-500 border border-blue-500/30",
        secondary:
          "bg-[#1e2330] text-[#d3dce8] border border-[#2d3347] hover:bg-[#252b3b] hover:border-[#353c52]",
        ghost:
          "text-[#9daabf] hover:bg-[#1e2330] hover:text-[#f0f4ff] border border-transparent hover:border-[#2d3347]",
        outline:
          "border border-[#353c52] bg-transparent text-[#b8c4d6] hover:bg-[#1e2330] hover:text-[#f0f4ff] hover:border-[#4a5370]",
        destructive:
          "bg-red-900/60 text-red-300 border border-red-800/60 hover:bg-red-900/80 hover:text-red-200 shadow-lg shadow-red-900/20",
        critical:
          "bg-red-700 text-white border border-red-600/50 hover:bg-red-600 shadow-lg shadow-red-900/30 pulse-critical",
        success:
          "bg-green-900/60 text-green-300 border border-green-800/60 hover:bg-green-900/80 hover:text-green-200",
        warning:
          "bg-amber-900/60 text-amber-300 border border-amber-800/60 hover:bg-amber-900/80 hover:text-amber-200",
        link:
          "text-blue-400 underline-offset-4 hover:text-blue-300 hover:underline",
        glass:
          "glass text-[#d3dce8] hover:text-[#f0f4ff] hover:border-[#4a5370]",
      },
      size: {
        xs: "h-7 px-2.5 text-xs rounded-sm gap-1.5",
        sm: "h-8 px-3 text-xs rounded-md",
        md: "h-9 px-4 text-sm",
        lg: "h-10 px-5 text-sm font-semibold",
        xl: "h-12 px-6 text-base font-semibold",
        icon: "h-9 w-9",
        "icon-sm": "h-7 w-7",
        "icon-lg": "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {children}
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
