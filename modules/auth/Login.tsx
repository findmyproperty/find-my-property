"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import LoginPanel from "@/modules/auth/LoginPanel";
import { useSettings } from "@/contexts/settings-context";
import { SITE_NAME } from "@/lib/branding";

const Login = () => {
  const { settings } = useSettings();
  const siteName = settings?.siteName?.trim() || SITE_NAME;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="relative hidden lg:flex lg:w-1/2">
        <Image
          src="/images/auth-bg.jpg"
          alt="Auth apartments"
          fill
          priority
          className="object-cover"
          sizes="(max-width: 1023px) 0px, 50vw"
        />
        {/* <motion.div
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
        </motion.div> */}
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-y-auto overflow-x-hidden bg-muted/10 p-6 lg:p-12">
        <div className="absolute inset-0 -z-10 bg-grid-black/[0.02]" />
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <LoginPanel variant="page" />
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
