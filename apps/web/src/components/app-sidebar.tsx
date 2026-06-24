"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { localizedHref, nav, stripLocale, type NavItem } from "@/lib/nav";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function hasActiveChild(pathname: string, item: NavItem) {
  return item.children?.some((child) => child.href && isActive(pathname, child.href)) ?? false;
}

function NavLink({
  item,
  locale,
  pathname,
}: {
  item: NavItem;
  locale: string;
  pathname: string;
}) {
  if (!item.href) return null;

  const Icon = item.icon;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        className="min-h-12 justify-start text-blue-50/95 hover:bg-white/10 hover:text-white data-active:bg-primary data-active:text-primary-foreground data-active:shadow-lg data-active:shadow-blue-950/25 group-data-[collapsible=icon]:size-12! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! [&_svg]:size-5"
        isActive={isActive(pathname, item.href)}
        render={
          <Link href={localizedHref(locale, item.href)}>
            <Icon />
            <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
          </Link>
        }
        size="lg"
        tooltip={item.label}
      />
    </SidebarMenuItem>
  );
}

function NavGroup({
  item,
  locale,
  pathname,
}: {
  item: NavItem;
  locale: string;
  pathname: string;
}) {
  const active = hasActiveChild(pathname, item);
  const [expanded, setExpanded] = useState(active);
  const Icon = item.icon;

  if (!item.children?.length) {
    return <NavLink item={item} locale={locale} pathname={pathname} />;
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        aria-expanded={expanded}
        className="min-h-12 justify-start text-blue-50/95 hover:bg-white/10 hover:text-white data-active:bg-primary data-active:text-primary-foreground data-active:shadow-lg data-active:shadow-blue-950/25 group-data-[collapsible=icon]:size-12! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! [&_svg]:size-5"
        isActive={active}
        onClick={() => setExpanded((open) => !open)}
        size="lg"
        tooltip={item.label}
      >
        <Icon />
        <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
        <ChevronDown
          className={cn("ml-auto size-4 transition-transform group-data-[collapsible=icon]:hidden", expanded && "rotate-180")}
        />
      </SidebarMenuButton>
      {expanded ? (
        <SidebarMenuSub>
          {item.children.map((child) => {
            if (!child.href) return null;
            const ChildIcon = child.icon;

            return (
              <SidebarMenuSubItem key={child.href}>
                <SidebarMenuSubButton
                  className="min-h-10 text-blue-50/85 hover:bg-white/10 hover:text-white data-active:bg-primary data-active:text-primary-foreground"
                  isActive={isActive(pathname, child.href)}
                  render={
                    <Link href={localizedHref(locale, child.href)}>
                      <ChildIcon />
                      <span>{child.label}</span>
                    </Link>
                  }
                />
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      ) : null}
    </SidebarMenuItem>
  );
}

export function AppSidebar({ locale }: { locale: string }) {
  const pathname = stripLocale(usePathname());

  return (
    <Sidebar className="border-r border-white/10" collapsible="icon">
      <SidebarHeader className="h-topbar justify-center px-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="min-h-12 justify-start text-white hover:bg-white/10 hover:text-white group-data-[collapsible=icon]:size-12! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!"
              size="lg"
              tooltip="Hemia Console"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                H
              </span>
              <span className="text-lg font-bold group-data-[collapsible=icon]:hidden">Hemia Console</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator className="bg-white/10" />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 group-data-[collapsible=icon]:items-center">
              {nav.map((item) => (
                <NavGroup
                  item={item}
                  key={item.href ?? item.label}
                  locale={locale}
                  pathname={pathname}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator className="bg-white/10" />
      <SidebarFooter className="p-4">
        <div className="flex min-h-12 items-center gap-2 rounded-lg bg-white/5 px-3 text-xs text-blue-50/95 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <span className="size-2 shrink-0 rounded-full bg-emerald-400" />
          <span className="truncate group-data-[collapsible=icon]:sr-only">Sistema operativo</span>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
