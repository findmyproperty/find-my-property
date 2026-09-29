"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { buildLoginAndRegisterHrefs, isServiceAuthModalPath } from "@/lib/auth-redirect";
import { useServiceAuthModalOptional } from "@/contexts/service-auth-modal-context";

import { cn } from "@/lib/utils";

type Props = {
  onNavigate?: () => void;
  className?: string;
  isHeroTransparent?: boolean;
};

/**
 * Login / Sign Up links with `?from=` so post-auth returns to the current page.
 * On service pages with {@link ServiceAuthModalProvider}, opens the in-page auth modal.
 * Must render under a React `Suspense` boundary (see `Navbar`).
 */
export function NavLoginRegisterLinks({ onNavigate, className, isHeroTransparent = false }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { loginHref, registerHref } = buildLoginAndRegisterHrefs(pathname, searchParams);
  const serviceAuth = useServiceAuthModalOptional();
  const useModal = isServiceAuthModalPath(pathname) && serviceAuth != null;

  const loginButtonClass = cn(
    "flex-1 md:flex-initial rounded-full transition-all duration-200 text-xs font-medium px-4 h-9",
    isHeroTransparent
      ? "border-white/30 text-white hover:bg-white/15 hover:text-white bg-white/5 backdrop-blur-sm"
      : "border-border/80 text-foreground hover:bg-muted"
  );

  const registerButtonClass = cn(
    "flex-1 md:flex-initial rounded-full transition-all duration-200 text-xs font-semibold px-4 h-9 shadow-xs",
    isHeroTransparent
      ? "bg-amber-400 text-slate-950 hover:bg-amber-300"
      : "bg-primary text-primary-foreground hover:bg-primary/90"
  );

  if (useModal && serviceAuth) {
    return (
      <div className={cn("flex gap-2 items-center", className)}>
        <Button
          variant="outline"
          size="sm"
          className={loginButtonClass}
          type="button"
          onClick={() => {
            onNavigate?.();
            serviceAuth.openLogin();
          }}
        >
          Log In
        </Button>
        <Button
          size="sm"
          className={registerButtonClass}
          type="button"
          onClick={() => {
            onNavigate?.();
            serviceAuth.openRegister();
          }}
        >
          Sign Up
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-2 items-center", className)}>
      <Button variant="outline" size="sm" className={loginButtonClass} asChild>
        <Link href={loginHref} onClick={onNavigate}>
          Log In
        </Link>
      </Button>
      <Button size="sm" className={registerButtonClass} asChild>
        <Link href={registerHref} onClick={onNavigate}>
          Sign Up
        </Link>
      </Button>
    </div>
  );
}
