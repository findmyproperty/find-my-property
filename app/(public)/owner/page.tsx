import type { Metadata } from "next";
import ForOwnersPage from "@/modules/public/ForOwnersPage";

export const metadata: Metadata = {
  title: "List your property",
  description:
    "List your rental or sale property on Find My Property — reach verified tenants and buyers without broker commission.",
  alternates: { canonical: "/owner" },
};

export default function OwnerPage() {
  return <ForOwnersPage />;
}
