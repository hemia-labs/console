"use client";

import { useState } from "react";
import { Bell, Menu, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { AppMobileSidebar } from "@/components/app-sidebar";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { descriptionFor, labelFor } from "@/lib/nav";

export function AppTopbar({ locale }: { locale: string }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();
  const title = labelFor(pathname);
  const description = descriptionFor(pathname);

  return (
    <header className="flex h-topbar shrink-0 items-center gap-4 border-b border-border bg-card px-4 sm:px-6 lg:px-8">
      <Button
        aria-label="Abrir navegacion"
        className="size-12 md:hidden"
        onClick={() => setMobileNavOpen(true)}
        size="icon"
        type="button"
        variant="ghost"
      >
        <Menu className="size-5" />
      </Button>
      <AppMobileSidebar locale={locale} onOpenChange={setMobileNavOpen} open={mobileNavOpen} />
      <div className="flex min-w-0 flex-1 flex-col">
        <h1 className="truncate text-lg font-semibold">{title}</h1>
        <p className="truncate text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <div className="relative hidden lg:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" placeholder="Buscar..." className="h-12 w-64 pl-9" />
        </div>
        <LocaleSwitcher locale={locale} />
        <Button variant="ghost" size="icon" aria-label="Notificaciones" className="size-12">
          <Bell className="size-4" />
        </Button>
        <UserAvatar locale={locale} />
      </div>
    </header>
  );
}
