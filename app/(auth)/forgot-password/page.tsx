import { Suspense } from "react";
import { PublicAuthRoute } from "@/components/auth/route-guards";
import ForgotPassword from "@/modules/auth/ForgotPassword";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <PublicAuthRoute>
        <ForgotPassword />
      </PublicAuthRoute>
    </Suspense>
  );
}
