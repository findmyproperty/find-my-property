import {
  Building2,
  Car,
  Home,
  Landmark,
  type LucideIcon,
} from "lucide-react";
import type { LoanType } from "@/lib/api";

export const LOAN_TYPE_OPTIONS: Array<{ value: LoanType; label: string }> = [
  { value: "home_loan", label: "Home Loan" },
  { value: "personal_loan", label: "Personal Loan" },
  { value: "vehicle_loan", label: "Vehicle Loan" },
  { value: "mortgage", label: "Mortgage" },
];

export const LOAN_META: Record<
  LoanType,
  { label: string; icon: LucideIcon }
> = {
  home_loan: { label: "Home Loan", icon: Home },
  personal_loan: { label: "Personal Loan", icon: Landmark },
  vehicle_loan: { label: "Vehicle Loan", icon: Car },
  mortgage: { label: "Mortgage", icon: Building2 },
};

export const LOAN_PAGE_TRUST = [
  { icon: Landmark, label: "Partner banks" },
  { icon: Building2, label: "Expert guidance" },
  { icon: Home, label: "Quick callback" },
] as const;