import { describe, expect, it } from "vitest";
import {
  DROPDOWN_MENU_MODAL_DEFAULT,
  PROFILE_DROPDOWN_MODAL,
  getDashboardShellClassName,
  getDashboardSidebarProviderClassName,
} from "./dashboard-chrome";

describe("dashboard chrome scroll containment", () => {
  it("disables Radix modal scroll-lock for all dropdown menus by default", () => {
    expect(DROPDOWN_MENU_MODAL_DEFAULT).toBe(false);
    expect(PROFILE_DROPDOWN_MODAL).toBe(false);
  });

  it("locks the shell to the viewport with overflow hidden", () => {
    const shell = getDashboardShellClassName();
    expect(shell).toContain("h-svh");
    expect(shell).toContain("max-h-svh");
    expect(shell).toContain("overflow-hidden");
  });

  it("clamps SidebarProvider so min-h-svh cannot grow the document", () => {
    const provider = getDashboardSidebarProviderClassName();
    expect(provider).toContain("h-svh");
    expect(provider).toContain("max-h-svh");
    expect(provider).toContain("overflow-hidden");
  });
});
