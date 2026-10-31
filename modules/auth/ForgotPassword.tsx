"use client";

import { motion } from "framer-motion";
import { AuthVisualPanel } from "@/modules/auth/AuthVisualPanel";
import ForgotPasswordPanel from "@/modules/auth/ForgotPasswordPanel";
import { useSettings } from "@/contexts/settings-context";
import { SITE_NAME } from "@/lib/branding";

const ForgotPassword = () => {
  const { settings } = useSettings();
  const siteName = settings?.siteName?.trim() || SITE_NAME;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AuthVisualPanel
        siteName={siteName}
        eyebrow="Account recovery"
        title="Reset your password with a phone verification code."
        description="We will send a one-time code to your registered mobile number so you can set a new password securely."
      />

      <div className="relative flex flex-1 items-center justify-center overflow-y-auto overflow-x-hidden bg-background p-6 lg:p-12">
        <div className="absolute inset-0 -z-10 bg-grid-black/[0.02]" />
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <ForgotPasswordPanel />
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
