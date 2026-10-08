"use client";

import { useMemo, useState } from "react";
import { ChevronsUpDown, LogOut, Moon, Sun, UserRound } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/zuno/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/zuno/dropdown-menu";
import { Switch } from "@/components/zuno/switch";

import { useConsoleSession } from "@/features/auth/console-session-provider";
import {
  logoutConsole,
  type ConsoleSession,
} from "@/features/auth/console-session";

function getInitials(user?: ConsoleSession["user"]) {
  const source = user?.name?.trim() || user?.email?.split("@")[0] || "";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase() || "";
}

export function UserAvatar({ locale }: { locale: string }) {
  const session = useConsoleSession();
  const [dark, setDark] = useState(() => typeof document !== "undefined" && document.documentElement.classList.contains("dark"));
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const user = session?.user;
  const initials = useMemo(() => getInitials(user), [user]);
  const label = user?.name || user?.email || "SSO";
  const metadata = user?.email && user.name ? user.email : "SSO";
  const canLogout = session?.authenticated && !loggingOut;

  function changeTheme(nextDark: boolean) {
    document.documentElement.classList.toggle("dark", nextDark);
    document.documentElement.classList.toggle("light", !nextDark);
    try {
      localStorage.setItem("console-theme", nextDark ? "dark" : "light");
    } catch {
      // The theme still applies when browser storage is unavailable.
    }
    setDark(nextDark);
  }

  async function handleLogout() {
    if (!canLogout) {
      return;
    }

    setLoggingOut(true);
    setLogoutError(null);

    try {
      await logoutConsole(locale);
    } catch {
      setLogoutError("No se pudo cerrar la sesion. Intenta nuevamente.");
      setLoggingOut(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Abrir menú de usuario"
        className="flex h-12 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-2 focus-visible:outline-sidebar-ring group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0"
        title={label}
      >
        <Avatar size="sm" aria-hidden="true">
          <AvatarFallback
            className="bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground"
          >
            {initials ? initials : <UserRound className="size-4" />}
          </AvatarFallback>
        </Avatar>
        <span className="flex min-w-0 flex-1 flex-col text-left leading-tight group-data-[collapsible=icon]:hidden">
          <span className="truncate font-semibold text-sidebar-accent-foreground">{label}</span>
          <span className="truncate text-xs">{metadata}</span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 group-data-[collapsible=icon]:hidden" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-64">
        <div className="px-3 py-2">
          <p className="truncate text-sm font-semibold text-foreground">{label}</p>
          <p className="truncate text-xs text-muted-foreground">{metadata}</p>
        </div>
        <DropdownMenuSeparator />
        <div className="flex items-center gap-3 px-3 py-2 text-sm">
          {dark ? <Moon className="size-4 text-muted-foreground" aria-hidden="true" /> : <Sun className="size-4 text-muted-foreground" aria-hidden="true" />}
          <span>Tema</span>
          <span className="ml-auto text-xs text-muted-foreground">{dark ? "Oscuro" : "Claro"}</span>
          <Switch aria-label={dark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"} checked={dark} onCheckedChange={changeTheme} />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="min-h-10 cursor-pointer gap-3 px-3 text-sm font-medium"
          closeOnClick={false}
          disabled={!canLogout}
          onClick={handleLogout}
          variant="destructive"
        >
          <LogOut className="size-4" />
          {loggingOut ? "Cerrando sesion..." : "Cerrar sesion"}
        </DropdownMenuItem>
        {logoutError ? (
          <p className="px-2.5 py-2 text-xs text-destructive" role="alert">
            {logoutError}
          </p>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
