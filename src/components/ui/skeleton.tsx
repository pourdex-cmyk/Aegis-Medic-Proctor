import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton rounded-md", className)} {...props} />
}

function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-3.5", i === lines - 1 && lines > 1 && "w-3/4")}
        />
      ))}
    </div>
  )
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-[#2d3347] bg-[#0f1117] p-5 space-y-4", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <SkeletonText lines={2} />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  )
}

function SkeletonTable({ rows = 5, cols = 4, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={cn("space-y-px", className)}>
      <div className="flex gap-4 px-4 py-2.5 border-b border-[#2d3347] bg-[#0f1117]">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={ri} className="flex gap-4 px-4 py-3 border-b border-[#2d3347]/60">
          {Array.from({ length: cols }).map((_, ci) => (
            <Skeleton key={ci} className={cn("h-3.5 flex-1", ci === 0 && "w-8 flex-none")} />
          ))}
        </div>
      ))}
    </div>
  )
}

export { Skeleton, SkeletonText, SkeletonCard, SkeletonTable }
