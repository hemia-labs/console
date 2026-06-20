"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { localizedHref, nav, stripLocale, type NavItem } from "@/lib/nav";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  collapsed,
  item,
  locale,
  onNavigate,
  pathname,
}: {
  collapsed?: boolean;
  item: NavItem;
  locale: string;
  onNavigate?: () => void;
  pathname: string;
}) {
  const active = item.href ? isActive(pathname, item.href) : false;
  const Icon = item.icon;

  if (!item.href) {
    return null;
  }

  return (
    <Link
      aria-current={active ? "page" : undefined}
      href={localizedHref(locale, item.href)}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex min-h-12 cursor-pointer items-center gap-3 rounded-md text-sm font-medium transition-colors",
        collapsed ? "justify-center px-0" : "px-3",
        active
          ? "bg-primary text-primary-foreground shadow-lg shadow-blue-950/25"
          : "text-blue-50/95 hover:bg-white/10 hover:text-white"
      )}
    >
      <Icon className="size-5 shrink-0" />
      <span className={cn("truncate", collapsed && "sr-only")}>{item.label}</span>
    </Link>
  );
}

function NavGroup({
  collapsed,
  item,
  locale,
  onNavigate,
  pathname,
}: {
  collapsed?: boolean;
  item: NavItem;
  locale: string;
  onNavigate?: () => void;
  pathname: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = item.icon;

  if (!item.children?.length) {
    return <NavLink collapsed={collapsed} item={item} locale={locale} onNavigate={onNavigate} pathname={pathname} />;
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        aria-label={expanded ? `Ocultar ${item.label}` : `Mostrar ${item.label}`}
        aria-expanded={expanded}
        onClick={() => setExpanded((open) => !open)}
        title={collapsed ? item.label : undefined}
        className={cn(
          "flex min-h-12 cursor-pointer items-center gap-3 rounded-md text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/40",
          collapsed ? "justify-center px-0" : "px-3",
          "text-blue-50/95 hover:bg-white/10 hover:text-white"
        )}
      >
        <Icon className="size-5 shrink-0" />
        <span className={cn("flex-1 truncate", collapsed && "sr-only")}>{item.label}</span>
        {!collapsed ? (
          <ChevronDown className={cn("size-4 shrink-0 transition-transform", expanded && "rotate-180")} />
        ) : null}
      </button>
      {expanded && !collapsed ? (
        <div className={cn("flex flex-col gap-1", collapsed ? "items-center" : "pl-5")}>
          {item.children.map((child) => (
            <NavLink
              collapsed={collapsed}
              item={child}
              key={child.href ?? child.label}
              locale={locale}
              onNavigate={onNavigate}
              pathname={pathname}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SidebarNav({
  collapsed,
  locale,
  onNavigate,
  pathname,
}: {
  collapsed?: boolean;
  locale: string;
  onNavigate?: () => void;
  pathname: string;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-2">
      {nav.map((item) => (
        <NavGroup
          collapsed={collapsed}
          item={item}
          key={item.href ?? item.label}
          locale={locale}
          onNavigate={onNavigate}
          pathname={pathname}
        />
      ))}
    </nav>
  );
}

export function AppSidebar({ locale }: { locale: string }) {
  const pathname = stripLocale(usePathname());
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out md:flex",
        collapsed ? "w-sidebar-collapsed" : "w-sidebar"
      )}
    >
      <div className="flex h-topbar items-center gap-2 px-4">
        {!collapsed && <span className="flex-1 truncate text-lg font-bold">Hemia Console</span>}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          aria-expanded={!collapsed}
          className="grid size-12 shrink-0 cursor-pointer place-items-center rounded-md text-blue-50/95 transition-colors hover:bg-white/10 hover:text-white"
        >
          {collapsed ? <PanelLeftOpen className="size-6" /> : <PanelLeftClose className="size-6" />}
        </button>
      </div>
      <SidebarNav collapsed={collapsed} locale={locale} pathname={pathname} />
      <div className="m-4 flex items-center gap-2 rounded-lg bg-white/5 p-3 text-xs">
        <span className="size-2 shrink-0 rounded-full bg-emerald-400" />
        {!collapsed && <span className="truncate text-blue-50/95">Sistema operativo</span>}
      </div>
    </aside>
  );
}

export function AppMobileSidebar({
  locale,
  onOpenChange,
  open,
}: {
  locale: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const pathname = stripLocale(usePathname());

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="w-[19rem] bg-sidebar p-0 text-sidebar-foreground" side="left">
        <SheetHeader className="border-b border-white/10 px-4 py-5 text-left">
          <SheetTitle className="text-white">Hemia Console</SheetTitle>
          <SheetDescription className="text-blue-50/80">Consola operativa</SheetDescription>
        </SheetHeader>
        <SidebarNav locale={locale} onNavigate={() => onOpenChange(false)} pathname={pathname} />
        <div className="m-4 flex items-center gap-2 rounded-lg bg-white/5 p-3 text-xs">
          <span className="size-2 shrink-0 rounded-full bg-emerald-400" />
          <span className="truncate text-blue-50/95">Sistema operativo</span>
        </div>
      </SheetContent>
    </Sheet>
  );
}
