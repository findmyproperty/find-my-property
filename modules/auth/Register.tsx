"use client";

import { motion } from "framer-motion";
import { AuthVisualPanel } from "@/modules/auth/AuthVisualPanel";
import RegisterPanel from "@/modules/auth/RegisterPanel";
import { useSettings } from "@/contexts/settings-context";
import { SITE_NAME } from "@/lib/branding";

const Register = () => {
  const { settings } = useSettings();
  const siteName = settings?.siteName?.trim() || SITE_NAME;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AuthVisualPanel
        siteName={siteName}
        eyebrow="Join the marketplace"
        title="Start with a clearer way to find and list homes."
        description="Create your account to save properties, contact owners, publish listings, and keep every property conversation organized."
      />

      <div className="relative flex flex-1 items-center justify-center overflow-y-auto overflow-x-hidden bg-muted/10 p-6 lg:p-12">
        <div className="absolute inset-0 -z-10 bg-grid-black/[0.02]" />
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <RegisterPanel variant="page" />
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
