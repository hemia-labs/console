"use client";

import { Bell, Search } from "lucide-react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function AppTopbar({ locale }: { locale: string }) {
  return (
    <header className="flex h-topbar shrink-0 items-center gap-4 border-b border-border bg-card px-4 sm:px-6 lg:px-8">
      <SidebarTrigger aria-label="Abrir navegacion" className="-ml-2 size-12" />
      <div className="min-w-0 flex-1" />
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <div className="relative hidden lg:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" placeholder="Buscar..." className="h-12 w-64 pl-9" />
        </div>
        <LocaleSwitcher locale={locale} />
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="Notificaciones" className="size-12">
                <Bell className="size-4" />
              </Button>
            }
          />
          <TooltipContent>Notificaciones</TooltipContent>
        </Tooltip>
        <UserAvatar locale={locale} />
      </div>
    </header>
  );
}
