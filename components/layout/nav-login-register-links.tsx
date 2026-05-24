"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { buildLoginAndRegisterHrefs, isServiceAuthModalPath } from "@/lib/auth-redirect";
import { useServiceAuthModalOptional } from "@/contexts/service-auth-modal-context";

type Props = {
  onNavigate?: () => void;
  className?: string;
};

/**
 * Login / Sign Up links with `?from=` so post-auth returns to the current page.
 * On service pages with {@link ServiceAuthModalProvider}, opens the in-page auth modal.
 * Must render under a React `Suspense` boundary (see `Navbar`).
 */
export function NavLoginRegisterLinks({ onNavigate, className }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { loginHref, registerHref } = buildLoginAndRegisterHrefs(pathname, searchParams);
  const serviceAuth = useServiceAuthModalOptional();
  const useModal = isServiceAuthModalPath(pathname) && serviceAuth != null;

  if (useModal && serviceAuth) {
    return (
      <div className={`flex gap-2 ${className ?? ""}`}>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 md:flex-initial"
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
          className="flex-1 md:flex-initial"
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
    <div className={`flex gap-2 ${className ?? ""}`}>
      <Button variant="outline" size="sm" className="flex-1 md:flex-initial" asChild>
        <Link href={loginHref} onClick={onNavigate}>
          Log In
        </Link>
      </Button>
      <Button size="sm" className="flex-1 md:flex-initial" asChild>
        <Link href={registerHref} onClick={onNavigate}>
          Sign Up
        </Link>
      </Button>
    </div>
  );
}
