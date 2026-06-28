"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type AdminSearchInputProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  className?: string
}

export function AdminSearchInput({
  value,
  onChange,
  placeholder = "Search…",
  label = "Search",
  className,
}: AdminSearchInputProps) {
  return (
    <div className={cn("min-w-0 flex-1", className)}>
      <Label className="sr-only">{label}</Label>
      <div className="relative w-full">
        <Search
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>
    </div>
  )
}
