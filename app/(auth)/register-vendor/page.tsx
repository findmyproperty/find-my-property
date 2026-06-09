import { Suspense } from "react";
import { PublicAuthRoute } from "@/components/auth/route-guards";
import RegisterVendorPanel from "@/modules/auth/RegisterVendorPanel";

export default function RegisterVendorPage() {
  return (
    <Suspense fallback={null}>
      <PublicAuthRoute>
        <RegisterVendorPanel />
      </PublicAuthRoute>
    </Suspense>
  );
}
