import type { UserRole } from "@/end-points/types";
import { getStoredToken, request } from "@/end-points/http";

export interface AdminUserListItem {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  onboardingCompleted: boolean;
  locationAddress: string | null;
  locationCity: string | null;
  locationState: string | null;
  locationCountry: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface AdminListUsersQuery {
  role?: UserRole;
  q?: string;
  page?: number;
  limit?: number;
}

export interface AdminListUsersResponse {
  items: AdminUserListItem[];
  total: number;
  page: number;
  limit: number;
}

function buildQuery(query: AdminListUsersQuery): string {
  const params = new URLSearchParams();
  if (query.role) params.set("role", query.role);
  if (query.q?.trim()) params.set("q", query.q.trim());
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function matchesQuery(user: AdminUserListItem, query: AdminListUsersQuery) {
  if (query.role && user.role !== query.role) return false;
  const q = query.q?.trim().toLowerCase();
  if (!q) return true;
  return [user.name, user.email, user.phone, user.locationCity]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase().includes(q));
}

function normalizeUsersResponse(
  raw: AdminListUsersResponse | AdminUserListItem[],
  query: AdminListUsersQuery,
): AdminListUsersResponse {
  const rawItems = Array.isArray(raw) ? raw : raw.items;
  const items = rawItems.filter((user) => matchesQuery(user, query));

  if (Array.isArray(raw)) {
    return {
      items,
      total: items.length,
      page: query.page ?? 1,
      limit: query.limit ?? items.length,
    };
  }

  return {
    items,
    total: query.role || query.q ? items.length : raw.total,
    page: raw.page,
    limit: raw.limit,
  };
}

export const users = {
  async adminListUsers(
    query: AdminListUsersQuery = {},
  ): Promise<AdminListUsersResponse> {
    const raw = await request<AdminListUsersResponse | AdminUserListItem[]>(
      `/users${buildQuery(query)}`,
      {
        method: "GET",
        token: getStoredToken(),
      },
    );

    return normalizeUsersResponse(raw, query);
  },
};
