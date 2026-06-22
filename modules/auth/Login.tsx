"use client";

import { motion } from "framer-motion";
import { AuthVisualPanel } from "@/modules/auth/AuthVisualPanel";
import LoginPanel from "@/modules/auth/LoginPanel";
import { useSettings } from "@/contexts/settings-context";
import { SITE_NAME } from "@/lib/branding";

const Login = () => {
  const { settings } = useSettings();
  const siteName = settings?.siteName?.trim() || SITE_NAME;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AuthVisualPanel
        siteName={siteName}
        eyebrow="Welcome back"
        title="Pick up your property search where you left off."
        description="Sign in to manage shortlisted homes, saved enquiries, listing updates, and tenant tools from one calm workspace."
      />

      <div className="relative flex flex-1 items-center justify-center overflow-y-auto overflow-x-hidden bg-background p-6 lg:p-12">
        <div className="absolute inset-0 -z-10 bg-grid-black/[0.02]" />
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <LoginPanel variant="page" />
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
