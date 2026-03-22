import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 flex gap-3",
  {
    variants: {
      variant: {
        default: "bg-[#1a2444]/60 border-blue-700/40 text-blue-200",
        destructive: "bg-red-950/50 border-red-800/60 text-red-200",
        warning: "bg-amber-950/50 border-amber-800/60 text-amber-200",
        success: "bg-green-950/50 border-green-800/60 text-green-200",
        ghost: "bg-[#1e2330] border-[#2d3347] text-[#b8c4d6]",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

const iconMap = {
  default: Info,
  destructive: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle2,
  ghost: Info,
}

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  dismissible?: boolean
  onDismiss?: () => void
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", dismissible, onDismiss, children, ...props }, ref) => {
    const Icon = iconMap[variant ?? "default"]
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        <Icon className="h-4 w-4 shrink-0 mt-0.5 opacity-80" />
        <div className="flex-1 min-w-0">{children}</div>
        {dismissible && (
          <button
            onClick={onDismiss}
            className="shrink-0 rounded p-0.5 hover:bg-white/10 transition-colors"
          >
            <X className="h-3.5 w-3.5 opacity-60" />
          </button>
        )}
      </div>
    )
  }
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn("font-semibold text-sm leading-tight mb-1", className)} {...props} />
  )
)
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm opacity-80 leading-relaxed", className)} {...props} />
  )
)
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
