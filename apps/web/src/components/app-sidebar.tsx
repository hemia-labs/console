"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { BrandWordmark } from "@/components/brand-wordmark";
import { UserAvatar } from "@/components/user-avatar";
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
        className="justify-start"
        isActive={isActive(pathname, item.href)}
        render={
          <Link href={localizedHref(locale, item.href)}>
            <Icon />
            <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
          </Link>
        }
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
        className="justify-start"
        isActive={false}
        onClick={() => setExpanded((open) => !open)}
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
                  className="data-active:bg-sidebar-selected"
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
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-topbar justify-center group-data-[collapsible=icon]:px-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href={localizedHref(locale, "/")} aria-label="Hemia Console" />}>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[var(--hemia-navy)] p-0.5 dark:bg-transparent dark:p-0 group-data-[collapsible=icon]:size-8">
                <Image src="/logo.png" alt="" width={96} height={66} className="h-auto w-full" />
              </span>
              <BrandWordmark className="group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator className="bg-sidebar-border" />
      <SidebarContent>
        <SidebarGroup className="group-data-[collapsible=icon]:px-3">
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
      <SidebarFooter className="border-t border-sidebar-border group-data-[collapsible=icon]:px-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <UserAvatar locale={locale} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
