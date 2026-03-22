import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const d = new Date(date)
  const diffMs = now.getTime() - d.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(date)
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + "..."
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function titleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase())
}

export function generateId(prefix?: string): string {
  const id = Math.random().toString(36).slice(2, 11)
  return prefix ? `${prefix}_${id}` : id
}

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, ms: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), ms)
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function percentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}

export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = String(item[key])
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {} as Record<string, T[]>)
}

export function sortBy<T>(arr: T[], key: keyof T, dir: "asc" | "desc" = "asc"): T[] {
  return [...arr].sort((a, b) => {
    if (a[key] < b[key]) return dir === "asc" ? -1 : 1
    if (a[key] > b[key]) return dir === "asc" ? 1 : -1
    return 0
  })
}

export function omit<T extends object, K extends keyof T>(obj: T, ...keys: K[]): Omit<T, K> {
  const result = { ...obj }
  keys.forEach((key) => delete result[key])
  return result as Omit<T, K>
}

export function pick<T extends object, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>
  keys.forEach((key) => { result[key] = obj[key] })
  return result
}

export function isNullOrUndefined(value: unknown): value is null | undefined {
  return value === null || value === undefined
}

export function parseJsonSafe<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Vitals / clinical formatting
export function formatVitalTrend(current: number, previous: number): "up" | "down" | "stable" {
  const diff = current - previous
  if (Math.abs(diff) < 2) return "stable"
  return diff > 0 ? "up" : "down"
}

export function getCriticalityColor(level: "critical" | "urgent" | "delayed" | "minimal" | "expectant" | "unknown"): string {
  const map: Record<string, string> = {
    critical: "text-red-400",
    urgent: "text-orange-400",
    delayed: "text-yellow-400",
    minimal: "text-green-400",
    expectant: "text-purple-400",
    unknown: "text-steel-400",
  }
  return map[level] ?? "text-steel-400"
}

export function getTriageColor(category: string): string {
  const map: Record<string, string> = {
    T1: "#e53e3e",
    T2: "#f59e0b",
    T3: "#22c55e",
    T4: "#6b7594",
    expectant: "#9333ea",
    immediate: "#e53e3e",
    delayed: "#f59e0b",
    minimal: "#22c55e",
    deceased: "#4b5563",
  }
  return map[category.toUpperCase()] ?? map[category] ?? "#6b7594"
}
