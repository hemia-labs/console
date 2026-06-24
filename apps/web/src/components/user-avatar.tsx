"use client";

import { useEffect, useMemo, useState } from "react";
import { LogOut, UserRound } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const DEFAULT_CONSOLE_API_BASE_URL = "http://localhost:3016";

type SessionUser = {
  email?: string;
  name?: string;
  permissions?: string[];
  roles?: string[];
  ssoUserId?: string;
};

type AuthSession = {
  authenticated: boolean;
  user?: SessionUser;
};

function getConsoleApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_CONSOLE_API_BASE_URL?.replace(/\/+$/, "") ??
    DEFAULT_CONSOLE_API_BASE_URL
  );
}

function getInitials(user?: SessionUser) {
  const source = user?.name?.trim() || user?.email?.split("@")[0] || "";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase() || "";
}

export function UserAvatar({ locale }: { locale: string }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [failed, setFailed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSession() {
      try {
        const response = await fetch(`${getConsoleApiBaseUrl()}/auth/session`, {
          credentials: "include",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });

        if (!response.ok) {
          setFailed(true);
          return;
        }

        setSession((await response.json()) as AuthSession);
      } catch {
        if (!controller.signal.aborted) {
          setFailed(true);
        }
      }
    }

    loadSession();

    return () => controller.abort();
  }, []);

  const user = session?.user;
  const initials = useMemo(() => getInitials(user), [user]);
  const label = user?.name || user?.email || (failed ? "Sin sesion" : "Cargando sesion");
  const metadata = user?.email && user.name ? user.email : user?.roles?.[0] ?? "SSO";
  const canLogout = session?.authenticated && !loggingOut;

  async function handleLogout() {
    if (!canLogout) {
      return;
    }

    setLoggingOut(true);

    try {
      await fetch(`${getConsoleApiBaseUrl()}/auth/logout`, {
        credentials: "include",
        method: "POST",
      });
    } finally {
      window.location.assign(`/${locale}`);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Cuenta de usuario"
        className="grid size-12 place-items-center rounded-full outline-none transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        title={label}
      >
        <Avatar
          size="lg"
          className={cn(failed ? "bg-muted text-muted-foreground" : "bg-secondary text-primary")}
        >
          <AvatarFallback className="bg-transparent text-xs font-bold text-inherit">
            {initials ? initials : <UserRound className="size-4" />}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-2">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-2">
            <span className="block truncate text-sm font-semibold text-foreground">{label}</span>
            <span className="block truncate text-xs font-normal text-muted-foreground">
              {metadata}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="min-h-12 cursor-pointer gap-2 px-2"
            disabled={!canLogout}
            onClick={handleLogout}
            variant="destructive"
          >
            <LogOut className="size-4" />
            {loggingOut ? "Cerrando sesion..." : "Cerrar sesion"}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
