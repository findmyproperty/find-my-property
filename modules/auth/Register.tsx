"use client";

import { motion } from "framer-motion";
import RegisterPanel from "@/modules/auth/RegisterPanel";
import { useSettings } from "@/contexts/settings-context";
import { SITE_NAME } from "@/lib/branding";

const Register = () => {
  const { settings } = useSettings();
  const siteName = settings?.siteName?.trim() || SITE_NAME;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="relative hidden lg:flex lg:w-1/2">
        <div className="absolute inset-0 bg-linear-to-br from-primary/40 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute bottom-12 left-8 right-8 max-w-md"
        >
          <div className="rounded-2xl bg-card/90 p-6 shadow-lg backdrop-blur-md">
            <p className="mb-4 text-sm leading-relaxed text-foreground">
              &quot;{siteName} helped us find our dream home in Bangalore. All we just did was search their listings
              and we found it in a few minutes!&quot;
            </p>
            <div>
              <p className="font-heading text-sm font-semibold text-foreground">Priya Sharma</p>
              <p className="text-xs text-muted-foreground">Software Engineer, Bangalore</p>
            </div>
          </div>
        </motion.div>
      </div>

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
