/**
 * Nested scrollports (dashboard `main`, listing cards, etc.) must not use Radix
 * modal scroll-lock — that forces a second page scrollbar via `data-scroll-locked`.
 * Shared default for every `DropdownMenu` in the app.
 */
export const DROPDOWN_MENU_MODAL_DEFAULT = false;

/** @deprecated Use {@link DROPDOWN_MENU_MODAL_DEFAULT} */
export const PROFILE_DROPDOWN_MODAL = DROPDOWN_MENU_MODAL_DEFAULT;

/** Outer dashboard shell: lock to the viewport; never grow the document. */
export function getDashboardShellClassName(): string {
  return "flex h-svh max-h-svh w-full overflow-hidden bg-background";
}

/** SidebarProvider wrapper must also be viewport-clamped (default is only min-h-svh). */
export function getDashboardSidebarProviderClassName(): string {
  return "h-svh max-h-svh overflow-hidden";
}
