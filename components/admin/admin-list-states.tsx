import { AlertCircle, Loader2 } from "lucide-react"

export function AdminListLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
      <Loader2 className="size-6 animate-spin" aria-hidden />
      {label}
    </div>
  )
}

export function AdminListError({
  title,
  message,
}: {
  title: string
  message?: string
}) {
  return (
    <div
      role="alert"
      className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
    >
      <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
      <div>
        <p className="font-medium text-destructive">{title}</p>
        {message ? (
          <p className="mt-1 text-muted-foreground">{message}</p>
        ) : null}
      </div>
    </div>
  )
}

export function AdminListEmpty({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
      <p className="font-medium text-foreground">{title}</p>
      {description ? <p className="mt-1 text-sm">{description}</p> : null}
    </div>
  )
}
