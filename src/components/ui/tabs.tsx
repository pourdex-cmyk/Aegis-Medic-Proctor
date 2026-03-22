"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
    variant?: "default" | "pills" | "underline" | "segmented"
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "inline-flex h-9 items-center gap-1 rounded-lg bg-[#0f1117] border border-[#2d3347] p-1",
    pills: "inline-flex items-center gap-2",
    underline: "inline-flex items-center gap-0 border-b border-[#2d3347]",
    segmented: "inline-flex h-9 items-center gap-0 rounded-lg bg-[#0f1117] border border-[#2d3347] p-1",
  }
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(variants[variant], className)}
      {...props}
    />
  )
})
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    variant?: "default" | "pills" | "underline"
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: [
      "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all",
      "text-[#6b7594] hover:text-[#b8c4d6]",
      "data-[state=active]:bg-[#252b3b] data-[state=active]:text-[#f0f4ff] data-[state=active]:border data-[state=active]:border-[#2d3347]",
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600/40",
      "disabled:pointer-events-none disabled:opacity-40",
    ].join(" "),
    pills: [
      "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-all border",
      "border-transparent text-[#6b7594] hover:text-[#b8c4d6] hover:bg-[#1e2330]",
      "data-[state=active]:bg-[#1a2444] data-[state=active]:text-blue-300 data-[state=active]:border-blue-700/40",
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600/40",
    ].join(" "),
    underline: [
      "inline-flex items-center justify-center gap-1.5 whitespace-nowrap px-4 py-2 text-sm font-medium transition-all border-b-2",
      "border-transparent text-[#6b7594] hover:text-[#b8c4d6] -mb-px",
      "data-[state=active]:border-blue-500 data-[state=active]:text-[#f0f4ff]",
      "focus-visible:outline-none",
    ].join(" "),
  }
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(variants[variant], className)}
      {...props}
    />
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600/40 rounded-md",
      "data-[state=active]:animate-fade-in",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
