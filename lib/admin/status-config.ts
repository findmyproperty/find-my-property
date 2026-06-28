export type AdminStatusOption = {
  value: string
  label: string
  className: string
}

const tones = {
  sky: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300",
  violet:
    "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-300",
  amber:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300",
  emerald:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300",
  red: "border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300",
  zinc: "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-500/30 dark:bg-zinc-500/15 dark:text-zinc-300",
  indigo:
    "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300",
  teal: "border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-500/30 dark:bg-teal-500/15 dark:text-teal-300",
  slate:
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/15 dark:text-slate-300",
  blue: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300",
} as const

function opt(value: string, label: string, tone: keyof typeof tones): AdminStatusOption {
  return { value, label, className: tones[tone] }
}

export function formatAdminStatus(value: string): string {
  return value.replace(/_/g, " ")
}

export const PROPERTY_STATUS_OPTIONS: AdminStatusOption[] = [
  opt("Pending", "Pending", "amber"),
  opt("Approved", "Approved", "emerald"),
  opt("Rejected", "Rejected", "red"),
]

export const AGENT_STATUS_OPTIONS: AdminStatusOption[] = [
  opt("active", "Active", "emerald"),
  opt("pending", "Pending verify", "amber"),
]

export const VENDOR_VERIFICATION_STATUS_OPTIONS: AdminStatusOption[] = [
  opt("pending", "Pending", "amber"),
  opt("verified", "Verified", "emerald"),
  opt("rejected", "Rejected", "red"),
]

export const SERVICE_REQUEST_STATUS_OPTIONS: AdminStatusOption[] = [
  opt("new", "New", "sky"),
  opt("contacted", "Contacted", "violet"),
  opt("scheduled", "Scheduled", "amber"),
  opt("completed", "Completed", "emerald"),
  opt("cancelled", "Cancelled", "red"),
]

export const LOAN_REQUEST_STATUS_OPTIONS: AdminStatusOption[] = [
  opt("new", "New", "sky"),
  opt("contacted", "Contacted", "violet"),
  opt("documents_pending", "Docs pending", "amber"),
  opt("under_review", "Under review", "indigo"),
  opt("approved", "Approved", "emerald"),
  opt("disbursed", "Disbursed", "teal"),
  opt("rejected", "Rejected", "red"),
  opt("cancelled", "Cancelled", "zinc"),
]

export const AGENT_LEAD_STATUS_OPTIONS: AdminStatusOption[] = [
  opt("new", "New", "sky"),
  opt("contacted", "Contacted", "violet"),
  opt("closed", "Closed", "emerald"),
  opt("archived", "Archived", "zinc"),
]

export const NOTIFICATION_READ_STATUS_OPTIONS: AdminStatusOption[] = [
  opt("unread", "Unread", "sky"),
  opt("read", "Read", "zinc"),
]

export const PAYOUT_STATUS_OPTIONS: AdminStatusOption[] = [
  opt("pending", "Pending", "amber"),
  opt("processing", "Processing", "violet"),
  opt("processed", "Processed", "emerald"),
  opt("settled", "Settled", "emerald"),
  opt("failed", "Failed", "red"),
  opt("rejected", "Rejected", "red"),
  opt("cancelled", "Cancelled", "zinc"),
  opt("reversed", "Reversed", "red"),
]

export const VENDOR_LEAD_STATUS_OPTIONS: AdminStatusOption[] = [
  opt("new", "New", "sky"),
  opt("accepted", "Accepted", "blue"),
  opt("in_progress", "In progress", "violet"),
  opt("completed", "Completed", "emerald"),
  opt("rejected", "Rejected", "red"),
]

export const SUPPORT_TICKET_STATUS_OPTIONS: AdminStatusOption[] = [
  opt("open", "Open", "sky"),
  opt("in_progress", "In progress", "amber"),
  opt("resolved", "Resolved", "emerald"),
]

export const CUSTOMER_STATUS_OPTIONS: AdminStatusOption[] = [
  opt("verified", "Email verified", "emerald"),
  opt("pending", "Email pending", "amber"),
  opt("onboarded", "Onboarded", "teal"),
  opt("incomplete", "Incomplete", "zinc"),
]

export const EMAIL_LOG_STATUS_OPTIONS: AdminStatusOption[] = [
  opt("sent", "Sent", "emerald"),
  opt("failed", "Failed", "red"),
  opt("skipped", "Skipped", "zinc"),
  opt("queued", "Queued", "sky"),
]

export const SERVICE_CATEGORY_STATUS_OPTIONS: AdminStatusOption[] = [
  opt("active", "Active", "emerald"),
  opt("inactive", "Inactive", "zinc"),
]

export const JOB_CONSULTANCY_STATUS_OPTIONS: AdminStatusOption[] = [
  opt("new", "New", "sky"),
  opt("contacted", "Contacted", "violet"),
  opt("screening", "Screening", "amber"),
  opt("interview_scheduled", "Interview scheduled", "indigo"),
  opt("placed", "Placed", "emerald"),
  opt("rejected", "Rejected", "red"),
  opt("cancelled", "Cancelled", "zinc"),
]

export function getAdminStatusStyle(
  options: readonly AdminStatusOption[],
  value: string,
): AdminStatusOption {
  const found = options.find((item) => item.value === value)
  if (found) return found
  return {
    value,
    label: formatAdminStatus(value),
    className: tones.slate,
  }
}

export function adminStatusOptionsToMap(
  options: readonly AdminStatusOption[],
): Record<string, { label: string; className: string }> {
  return Object.fromEntries(
    options.map((item) => [
      item.value,
      { label: item.label, className: item.className },
    ]),
  )
}
