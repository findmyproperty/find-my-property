import { describe, expect, it } from "vitest";
import { shouldRefreshOn401 } from "./should-refresh-on-401";

describe("shouldRefreshOn401", () => {
  it("does not refresh on failed password login 401", () => {
    expect(shouldRefreshOn401("/auth/login", undefined, true)).toBe(false);
  });

  it("does not refresh on phone OTP auth challenges", () => {
    expect(shouldRefreshOn401("/auth/phone-otp/request", undefined, true)).toBe(false);
    expect(shouldRefreshOn401("/auth/phone-otp/verify", undefined, true)).toBe(false);
  });

  it("does not refresh on email OTP or forgot-password challenges", () => {
    expect(shouldRefreshOn401("/auth/email-otp/request", undefined, true)).toBe(false);
    expect(shouldRefreshOn401("/auth/email-otp/verify", undefined, true)).toBe(false);
    expect(shouldRefreshOn401("/auth/password/forgot/request", undefined, true)).toBe(false);
    expect(shouldRefreshOn401("/auth/password/forgot/verify", undefined, true)).toBe(false);
    expect(shouldRefreshOn401("/auth/password/forgot/reset", undefined, true)).toBe(false);
  });

  it("does not refresh after a refresh was already attempted", () => {
    expect(shouldRefreshOn401("/auth/me", true, true)).toBe(false);
  });

  it("does not refresh for refresh/logout endpoints", () => {
    expect(shouldRefreshOn401("/auth/refresh", undefined, true)).toBe(false);
    expect(shouldRefreshOn401("/auth/logout", undefined, true)).toBe(false);
  });

  it("refreshes on protected API 401 while in the browser", () => {
    expect(shouldRefreshOn401("/auth/me", undefined, true)).toBe(true);
    expect(shouldRefreshOn401("/properties", undefined, true)).toBe(true);
  });

  it("never refreshes outside the browser", () => {
    expect(shouldRefreshOn401("/auth/me", undefined, false)).toBe(false);
  });
});
