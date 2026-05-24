"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/auth-context";
import { ServiceAuthModal } from "@/components/auth/ServiceAuthModal";

type AuthMode = "login" | "register";

type ServiceAuthModalContextValue = {
  isAuthenticated: boolean;
  isAuthReady: boolean;
  openLogin: () => void;
  openRegister: () => void;
  openAuthModal: () => void;
  requireAuth: (action: () => void) => void;
};

const ServiceAuthModalContext = createContext<ServiceAuthModalContextValue | null>(null);

export function ServiceAuthModalProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAuthReady } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");

  const openLogin = useCallback(() => {
    setMode("login");
    setOpen(true);
  }, []);

  const openRegister = useCallback(() => {
    setMode("register");
    setOpen(true);
  }, []);

  const openAuthModal = openLogin;

  const requireAuth = useCallback(
    (action: () => void) => {
      if (!isAuthReady) return;
      if (!isAuthenticated) {
        openLogin();
        return;
      }
      action();
    },
    [isAuthReady, isAuthenticated, openLogin],
  );

  const value = useMemo(
    () => ({
      isAuthenticated,
      isAuthReady,
      openLogin,
      openRegister,
      openAuthModal,
      requireAuth,
    }),
    [isAuthenticated, isAuthReady, openLogin, openRegister, openAuthModal, requireAuth],
  );

  return (
    <ServiceAuthModalContext.Provider value={value}>
      {children}
      <ServiceAuthModal
        open={open}
        onOpenChange={setOpen}
        mode={mode}
        onModeChange={setMode}
      />
    </ServiceAuthModalContext.Provider>
  );
}

export function useServiceAuthModal() {
  const context = useContext(ServiceAuthModalContext);
  if (!context) {
    throw new Error("useServiceAuthModal must be used within ServiceAuthModalProvider");
  }
  return context;
}

/** Safe for Navbar — returns null when the provider is not mounted (e.g. /browse guest chrome). */
export function useServiceAuthModalOptional() {
  return useContext(ServiceAuthModalContext);
}
