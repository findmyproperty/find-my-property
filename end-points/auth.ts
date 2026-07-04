import type { AuthUser, UserRole } from "@/end-points/types";
import { getStoredToken, request } from "@/end-points/http";

interface BackendAuthUser {
  id: number;
  name?: string;
  email?: string | null;
  pendingEmail?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  role?: string;
  defaultRole?: string | null;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  onboardingCompleted?: boolean;
  locationAddress?: string | null;
  locationCity?: string | null;
  locationState?: string | null;
  locationCountry?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface AuthApiResponse {
  access_token: string;
  /** Returned by login / refresh when using refresh-token rotation */
  refresh_token?: string;
  user: BackendAuthUser;
}

function normalizeRole(role?: string): UserRole {
  const normalized = role?.toLowerCase();
  if (
    normalized === "admin" ||
    normalized === "agent" ||
    normalized === "tenant" ||
    normalized === "vendor"
  ) {
    return normalized;
  }
  return "tenant";
}

function mapAuthUser(user: BackendAuthUser): AuthUser {
  return {
    id: String(user.id),
    name: user.name?.trim() || user.email || user.phone || "User",
    email: user.email ?? null,
    pendingEmail: user.pendingEmail ?? null,
    phone: user.phone ?? null,
    avatarUrl: user.avatarUrl ?? null,
    role: normalizeRole(user.role),
    defaultRole:
      user.defaultRole != null && String(user.defaultRole).trim() !== ""
        ? normalizeRole(user.defaultRole)
        : null,
    isEmailVerified: Boolean(user.isEmailVerified),
    isPhoneVerified: Boolean(user.isPhoneVerified),
    onboardingCompleted: Boolean(user.onboardingCompleted),
    locationAddress: user.locationAddress ?? null,
    locationCity: user.locationCity ?? null,
    locationState: user.locationState ?? null,
    locationCountry: user.locationCountry ?? null,
    latitude: user.latitude ?? null,
    longitude: user.longitude ?? null,
  };
}

function mapAuthResponse(data: AuthApiResponse) {
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    user: mapAuthUser(data.user),
  };
}

export const auth = {
  async uploadFile(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    return request<{ url: string }>("/upload", {
      method: "POST",
      token: getStoredToken(),
      body: formData,
    });
  },

  async requestPhoneOtp(phone: string) {
    return request<{ message: string; status: string }>("/auth/phone-otp/request", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
  },

  async verifyPhoneOtp(input: {
    phone: string;
    code: string;
    name?: string;
    role?: UserRole;
  }) {
    const response = await request<AuthApiResponse>("/auth/phone-otp/verify", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return mapAuthResponse(response);
  },

  async getMe(token?: string) {
    const response = await request<{ user: BackendAuthUser }>("/auth/me", {
      method: "GET",
      token: token || getStoredToken(),
    });
    return { user: mapAuthUser(response.user) };
  },

  async updateMe(input: {
    email?: string;
    name?: string;
    role?: UserRole;
    phone?: string;
    /** OTP sent to `phone` via `requestPhoneOtp` — required when updating phone while logged in. */
    otp?: string;
    /** Pass `null` to clear the existing avatar. */
    avatarUrl?: string | null;
    locationAddress?: string;
    locationCity?: string;
    locationState?: string;
    locationCountry?: string;
    latitude?: number;
    longitude?: number;
  }) {
    const response = await request<AuthApiResponse>("/auth/me", {
      method: "PATCH",
      token: getStoredToken(),
      body: JSON.stringify(input),
    });
    return mapAuthResponse(response);
  },

  async deleteMe() {
    return request<{ message: string }>("/auth/me", {
      method: "DELETE",
      token: getStoredToken(),
    });
  },

  async verifyAgent(token: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/auth/verify?token=${token}`);
  },

  async logout() {
    return request<{ message: string }>("/auth/logout", {
      method: "POST",
    });
  },

  /**
   * Admin-only: login as another user (impersonation).
   * Backend should return access_token + user for the target id.
   */
  async adminLoginAs(userId: number) {
    const data = await request<AuthApiResponse>("/auth/admin/login-as", {
      method: "POST",
      token: getStoredToken(),
      body: JSON.stringify({ userId }),
    });
    return mapAuthResponse(data);
  },
};
