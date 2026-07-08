"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserAvatar } from "@/components/user-avatar";
import { useAuth } from "@/contexts/auth-context";
import ThemeToggle from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { getProfileMenuItems } from "@/components/layout/Navbar";

interface DashboardHeaderProps {
  title?: string;
}

export default function DashboardHeader({ title }: DashboardHeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const profileMenuItems = getProfileMenuItems(user?.role);

  const handleLogout = () => {
    logout().then(() => {
      router.refresh();
    });
  };

  return (
    <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card/50 backdrop-blur-sm sticky top-0 z-30 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <SidebarTrigger className="shrink-0" />
        {title && (
          <h1 className="font-heading font-semibold text-lg text-foreground truncate">
            {title}
          </h1>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <ThemeToggle />
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-full p-1 hover:bg-muted/50 transition-colors focus:outline-none">
              <UserAvatar
                name={user.name ?? "User"}
                avatarUrl={user.avatarUrl}
                className="h-8 w-8 shrink-0"
                fallbackClassName="text-xs"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="truncate font-medium text-foreground">
                  {user.name ?? "Account"}
                </p>
                {user.email ? (
                  <p className="truncate text-xs font-normal text-muted-foreground">
                    {user.email}
                  </p>
                ) : null}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {profileMenuItems.map(({ href, label, icon: Icon }) => (
                <DropdownMenuItem key={href} asChild>
                  <Link href={href} className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                    {label}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" aria-hidden />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
