import * as React from "react"
import { cn } from "@/lib/utils"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "raised" | "glass" | "critical" | "stable" | "alert" | "accent"
  hoverable?: boolean
  pressable?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", hoverable = false, pressable = false, ...props }, ref) => {
    const variants = {
      default: "bg-[#0f1117] border border-[#2d3347]",
      raised: "bg-[#1e2330] border border-[#2d3347]",
      glass: "glass",
      critical: "bg-red-950/30 border border-red-800/50",
      stable: "bg-green-950/20 border border-green-800/40",
      alert: "bg-amber-950/20 border border-amber-800/40",
      accent: "bg-[#0d1a3d] border border-blue-700/40",
    }
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl",
          variants[variant],
          hoverable && "transition-all duration-200 hover:border-[#4a5370] hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5 cursor-pointer",
          pressable && "active:scale-[0.99] active:shadow-none",
          className
        )}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-1 p-5 pb-3", className)} {...props} />
  )
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("font-semibold text-[#f0f4ff] text-base leading-tight tracking-tight", className)}
      {...props}
    />
  )
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-[#9daabf] leading-relaxed", className)} {...props} />
  )
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />
  )
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-5 pt-0", className)}
      {...props}
    />
  )
)
CardFooter.displayName = "CardFooter"

const CardSection = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-5 py-3 border-t border-[#2d3347]", className)}
      {...props}
    />
  )
)
CardSection.displayName = "CardSection"

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardSection }
