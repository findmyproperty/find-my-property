import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  getAdminStatusStyle,
  type AdminStatusOption,
} from "@/lib/admin/status-config"

type AdminStatusBadgeProps = {
  status: string
  options: readonly AdminStatusOption[]
  className?: string
}

export function AdminStatusBadge({
  status,
  options,
  className,
}: AdminStatusBadgeProps) {
  const meta = getAdminStatusStyle(options, status)
  return (
    <Badge
      variant="outline"
      className={cn("font-normal capitalize", meta.className, className)}
    >
      {meta.label}
    </Badge>
  )
}
