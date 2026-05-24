"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/auth-context";
import LoginPanel from "@/modules/auth/LoginPanel";
import RegisterPanel from "@/modules/auth/RegisterPanel";

type AuthMode = "login" | "register";

type ServiceAuthModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
};

export function ServiceAuthModal({
  open,
  onOpenChange,
  mode,
  onModeChange,
}: ServiceAuthModalProps) {
  const router = useRouter();
  const { isAuthenticated, isAuthReady, user } = useAuth();

  useEffect(() => {
    if (!open) {
      onModeChange("login");
    }
  }, [open, onModeChange]);

  useEffect(() => {
    if (!open || !isAuthReady || !isAuthenticated) return;

    if (user && !user.onboardingCompleted) {
      onOpenChange(false);
      router.replace("/onboarding");
      return;
    }

    onOpenChange(false);
  }, [open, isAuthReady, isAuthenticated, user, onOpenChange, router]);

  const title =
    mode === "login" ? "Log in to request a callback" : "Sign up to request a callback";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(92vh,720px)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">
            {mode === "login"
              ? "Log in with your phone to request a callback on this page."
              : "Create an account with your phone to request a callback on this page."}
          </DialogDescription>
        </DialogHeader>
        <Suspense fallback={null}>
          {mode === "login" ? (
            <LoginPanel
              variant="modal"
              onAuthSuccess={() => onOpenChange(false)}
              onSwitchToRegister={() => onModeChange("register")}
            />
          ) : (
            <RegisterPanel
              variant="modal"
              onAuthSuccess={() => onOpenChange(false)}
              onSwitchToLogin={() => onModeChange("login")}
            />
          )}
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}
