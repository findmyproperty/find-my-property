import { describe, expect, it } from "vitest";
import {
  AUTH_STORAGE_KEYS,
  buildVerifyAgentPath,
  clearClientAuthStorage,
  sanitizeAuthRole,
} from "./auth-storage";

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial));
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => (map.has(key) ? map.get(key)! : null),
    key: (index: number) => [...map.keys()][index] ?? null,
    removeItem: (key: string) => {
      map.delete(key);
    },
    setItem: (key: string, value: string) => {
      map.set(key, String(value));
    },
  };
}

describe("clearClientAuthStorage", () => {
  it("removes access token, user, and legacy refresh token keys", () => {
    const storage = memoryStorage({
      nb_token: "access",
      nb_user: "{}",
      nb_refresh_token: "refresh-should-not-linger",
      unrelated: "keep",
    });

    clearClientAuthStorage(storage);

    for (const key of AUTH_STORAGE_KEYS) {
      expect(storage.getItem(key)).toBeNull();
    }
    expect(storage.getItem("unrelated")).toBe("keep");
  });
});

describe("sanitizeAuthRole", () => {
  it("allows known roles only", () => {
    expect(sanitizeAuthRole("admin")).toBe("admin");
    expect(sanitizeAuthRole(" Tenant ")).toBe("tenant");
    expect(sanitizeAuthRole("superadmin")).toBeNull();
    expect(sanitizeAuthRole("")).toBeNull();
  });
});

describe("buildVerifyAgentPath", () => {
  it("encodes special characters in the token query param", () => {
    expect(buildVerifyAgentPath("a+b/c=d")).toBe(
      `/auth/verify?token=${encodeURIComponent("a+b/c=d")}`,
    );
    expect(buildVerifyAgentPath("a+b/c=d")).not.toBe("/auth/verify?token=a+b/c=d");
  });
});
