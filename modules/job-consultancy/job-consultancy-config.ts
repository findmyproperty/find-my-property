import {
  Briefcase,
  Headphones,
  Laptop,
  type LucideIcon,
} from "lucide-react";
import type { JobConsultancyType } from "@/lib/api";

export const CONSULTANCY_TYPE_OPTIONS: Array<{
  value: JobConsultancyType;
  label: string;
}> = [
  { value: "it", label: "IT" },
  { value: "non_it", label: "Non IT" },
  { value: "customer_support", label: "Customer Support" },
];

export const CONSULTANCY_META: Record<
  JobConsultancyType,
  { label: string; icon: LucideIcon }
> = {
  it: { label: "IT", icon: Laptop },
  non_it: { label: "Non IT", icon: Briefcase },
  customer_support: { label: "Customer Support", icon: Headphones },
};

export const JOB_CONSULTANCY_PAGE_TRUST = [
  { icon: Laptop, label: "IT & tech roles" },
  { icon: Briefcase, label: "Non-IT openings" },
  { icon: Headphones, label: "Customer support" },
] as const;