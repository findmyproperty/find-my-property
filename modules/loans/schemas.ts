import { z } from "zod";

const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;

export const loanApplicationSchema = z.object({
  loanType: z.enum(["home_loan", "personal_loan", "vehicle_loan", "mortgage"], {
    required_error: "Select a loan type.",
  }),
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name (min 2 characters).")
    .max(120, "Name is too long."),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Please enter a valid phone number."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email.")
    .max(160)
    .optional()
    .or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type LoanApplicationFormValues = z.infer<typeof loanApplicationSchema>;