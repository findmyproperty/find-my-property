"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, type AuthUser, type UserRole } from "@/lib/api";
import { clearFmpRoleCookieClient, setFmpRoleCookieClient } from "@/lib/fmp-cookie";
import { clearClientAuthStorage } from "@/lib/auth-storage";
import { AUTH_ERROR_REFRESH_FAILED, AUTH_ERROR_SESSION_EXPIRED } from "@/end-points/http";

export type { UserRole };

export interface User extends AuthUser {
  avatar?: string;
}

type SuccessResult = { success: true; requiresOnboarding: boolean };
type FailedResult = { success: false; error: string };
type AuthResult = SuccessResult | FailedResult;

/** Client-only extras (not stored on the user API). Phone lives on `user.phone` after save. */
export interface UserProfile {
  phone?: string;
  bio?: string;
  companyName?: string;
  address?: string;
}

const PROFILE_KEY = "nb_profile";

function getStoredProfile(userId: string): UserProfile {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(`${PROFILE_KEY}:${userId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setStoredProfile(userId: string, profile: UserProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${PROFILE_KEY}:${userId}`, JSON.stringify(profile));
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  profile: UserProfile;
  requestPhoneOtp: (
    phone: string,
    intent?: "login" | "register",
  ) => Promise<{ success: true } | FailedResult>;
  requestEmailOtp: (email: string) => Promise<{ success: true } | FailedResult>;
  verifyEmailOtp: (
    email: string,
    code: string,
  ) => Promise<AuthResult>;
  loginWithPhone: (
    phone: string,
    code: string,
    name?: string,
    role?: UserRole,
    vendorSignup?: {
      businessName?: string;
      categoryIds?: number[];
    },
    intent?: "login" | "register",
  ) => Promise<AuthResult>;
  loginWithPassword: (identifier: string, password: string) => Promise<AuthResult>;
  changePassword: (input: {
    currentPassword?: string;
    newPassword: string;
  }) => Promise<AuthResult>;
  refreshUser: () => Promise<void>;
  updateProfile: (payload: {
    email?: string;
    name?: string;
    role?: UserRole;
    phone?: string;
    password?: string;
    otp?: string;
    avatarUrl?: string | null;
    locationAddress?: string;
    locationCity?: string;
    locationState?: string;
    locationCountry?: string;
    latitude?: number;
    longitude?: number;
  }) => Promise<AuthResult>;
  deleteAccount: () => Promise<{ success: true } | FailedResult>;
  logout: () => Promise<void>;
  /** Local-only profile extras (bio, etc.) — not synced to the API. */
  updateProfileLocal: (updates: UserProfile) => void;
  isAuthenticated: boolean;
  /** True after client has read session from localStorage (matches SSR until then). */
  isAuthReady: boolean;
  /** Admin feature: login as another user (impersonate) */
  loginAsUser: (userId: number) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [profile, setProfileState] = useState<UserProfile>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem("nb_user");
      const tok = localStorage.getItem("nb_token");
      setUser(stored ? (JSON.parse(stored) as User) : null);
      setToken(tok);
    } finally {
      setIsAuthReady(true);
    }
  }, []);

  useEffect(() => {
    const onAccessTokenUpdated = (e: Event) => {
      const detail = (e as CustomEvent<{ accessToken: string }>).detail;
      if (detail?.accessToken) setToken(detail.accessToken);
    };
    window.addEventListener("fmp-access-token-updated", onAccessTokenUpdated);
    return () => window.removeEventListener("fmp-access-token-updated", onAccessTokenUpdated);
  }, []);

  useEffect(() => {
    setProfileState(user ? getStoredProfile(user.id) : {});
  }, [user?.id]);

  useEffect(() => {
    if (!isAuthReady) return;
    if (user && token) {
      setFmpRoleCookieClient(user.role);
    } else {
      clearFmpRoleCookieClient();
    }
  }, [isAuthReady, user, token]);

  const persistSession = (nextUser: User, accessToken: string) => {
    setUser(nextUser);
    setToken(accessToken);
    localStorage.setItem("nb_user", JSON.stringify(nextUser));
    localStorage.setItem("nb_token", accessToken);
    setFmpRoleCookieClient(nextUser.role);
  };

  const updateStoredUser = (nextUser: User) => {
    setUser(nextUser);
    localStorage.setItem("nb_user", JSON.stringify(nextUser));
    setFmpRoleCookieClient(nextUser.role);
  };

  const requestPhoneOtp = async (
    phone: string,
    intent: "login" | "register" = "login",
  ) => {
    try {
      await api.requestPhoneOtp(phone, intent);
      return { success: true as const };
    } catch (error) {
      return {
        success: false as const,
        error: error instanceof Error ? error.message : "Unable to send phone OTP",
      };
    }
  };

  const requestEmailOtp = async (email: string) => {
    try {
      await api.requestEmailOtp(email);
      return { success: true as const };
    } catch (error) {
      return {
        success: false as const,
        error: error instanceof Error ? error.message : "Unable to send email OTP",
      };
    }
  };

  const verifyEmailOtp = async (email: string, code: string): Promise<AuthResult> => {
    try {
      const result = await api.verifyEmailOtp({ email, code });
      persistSession(result.user, result.accessToken);
      return { success: true, requiresOnboarding: !result.user.onboardingCompleted };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unable to verify email OTP",
      };
    }
  };

  const loginWithPhone = async (
    phone: string,
    code: string,
    name?: string,
    role?: UserRole,
    vendorSignup?: {
      businessName?: string;
      categoryIds?: number[];
    },
    intent: "login" | "register" = "login",
  ): Promise<AuthResult> => {
    try {
      const result = await api.verifyPhoneOtp({
        phone,
        code,
        name,
        role,
        intent,
        businessName: vendorSignup?.businessName,
        categoryIds: vendorSignup?.categoryIds,
      });
      persistSession(result.user, result.accessToken);
      return { success: true, requiresOnboarding: !result.user.onboardingCompleted };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unable to authenticate with phone",
      };
    }
  };

  const loginWithPassword = async (
    identifier: string,
    password: string,
  ): Promise<AuthResult> => {
    try {
      const trimmed = identifier.trim();
      const payload = trimmed.includes("@")
        ? ({ email: trimmed.toLowerCase() } as const)
        : ({ phone: trimmed } as const);
      const result = await api.loginWithPassword(payload, password);
      persistSession(result.user, result.accessToken);
      return { success: true, requiresOnboarding: !result.user.onboardingCompleted };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unable to authenticate with password",
      };
    }
  };

  const changePassword = async (input: {
    currentPassword?: string;
    newPassword: string;
  }): Promise<AuthResult> => {
    try {
      const result = await api.changePassword(input);
      persistSession(result.user, result.accessToken);
      return { success: true, requiresOnboarding: !result.user.onboardingCompleted };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unable to change password",
      };
    }
  };

  const loginAsUser = async (userId: number): Promise<AuthResult> => {
    try {
      const result = await api.adminLoginAs(userId);
      const newUser: User = {
        ...result.user,
        avatar: result.user.avatarUrl || undefined,
      };
      // Refresh token stays in HttpOnly `fmp-rt` cookie from the API — never localStorage.
      persistSession(newUser, result.accessToken);
      return { success: true, requiresOnboarding: !newUser.onboardingCompleted };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to login as user. Make sure you are admin and backend supports /auth/admin/login-as",
      };
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const result = await api.getMe(token);
      updateStoredUser(result.user);
    } catch (e) {
      if (e instanceof Error && e.message === AUTH_ERROR_SESSION_EXPIRED) {
        return;
      }
      if (e instanceof Error && e.message === AUTH_ERROR_REFRESH_FAILED) {
        return;
      }
      await logout();
    }
  };

  const updateProfile = async (payload: {
    email?: string;
    name?: string;
    role?: UserRole;
    phone?: string;
    password?: string;
    otp?: string;
    avatarUrl?: string | null;
    locationAddress?: string;
    locationCity?: string;
    locationState?: string;
    locationCountry?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<AuthResult> => {
    try {
      const result = await api.updateMe(payload);
      persistSession(result.user, result.accessToken);
      return { success: true, requiresOnboarding: !result.user.onboardingCompleted };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unable to update profile",
      };
    }
  };

  const deleteAccount = async () => {
    try {
      await api.deleteMe();
      await logout();
      return { success: true as const };
    } catch (error) {
      return {
        success: false as const,
        error: error instanceof Error ? error.message : "Unable to delete account",
      };
    }
  };

  const logout = async () => {
    clearFmpRoleCookieClient();
    setUser(null);
    setToken(null);
    clearClientAuthStorage();
    try {
      await api.logout();
    } catch {
      /* session already invalid */
    }
  };

  const updateProfileLocal = (updates: UserProfile) => {
    if (!user) return;
    const next = { ...profile, ...updates };
    setStoredProfile(user.id, next);
    setProfileState(next);
  };

  // Defer /me refresh so public pages paint first; localStorage session stays usable immediately.
  useEffect(() => {
    if (!token) return;
    const run = () => {
      void refreshUser();
    };
    const ric = globalThis.requestIdleCallback?.bind(globalThis);
    if (ric) {
      const id = ric(run, { timeout: 2500 });
      return () => globalThis.cancelIdleCallback?.(id);
    }
    const t = globalThis.setTimeout(run, 1);
    return () => globalThis.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        profile,
        requestPhoneOtp,
        requestEmailOtp,
        verifyEmailOtp,
        loginWithPhone,
        loginWithPassword,
        changePassword,
        refreshUser,
        updateProfile,
        deleteAccount,
        logout,
        updateProfileLocal,
        isAuthenticated: !!user && !!token,
        isAuthReady,
        loginAsUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
