"use client";

import { Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BrandWordmark } from "@/components/brand-wordmark";
import { useBreadcrumbTitle } from "@/components/breadcrumb-context";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { breadcrumbsFor, localizedHref } from "@/lib/nav";

export function AppTopbar({ locale }: { locale: string }) {
  const pathname = usePathname();
  const { title } = useBreadcrumbTitle();
  const breadcrumbs = breadcrumbsFor(pathname, locale, title?.pathname === pathname ? title.label : undefined);

  return (
    <header className="flex h-topbar shrink-0 items-center gap-2 border-b border-border px-4">
      <SidebarTrigger aria-label="Mostrar u ocultar navegación" className="-ml-1 shrink-0" />
      <Separator orientation="vertical" className="mr-2 hidden h-4 self-center md:block" />
      <Link href={localizedHref(locale, "/")} aria-label="Hemia Console" className="flex min-w-0 items-center gap-2 md:hidden">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[var(--hemia-navy)] p-0.5 dark:bg-transparent dark:p-0">
          <Image src="/logo.png" alt="" width={96} height={66} className="h-auto w-full" />
        </span>
        <BrandWordmark compact className="max-[400px]:hidden" />
      </Link>
      <Breadcrumb aria-label="Ruta actual" className="hidden min-w-0 md:block">
        <BreadcrumbList className="flex-nowrap gap-1.5 font-normal text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <Fragment key={`${index}-${crumb.label}`}>
              {index > 0 && <BreadcrumbSeparator className="mx-0" />}
              <BreadcrumbItem className="gap-1">
                {crumb.href ? (
                  <BreadcrumbLink asChild className="text-muted-foreground hover:text-foreground hover:no-underline">
                    <Link href={crumb.href}>{index === 0 ? "Hemia Console" : crumb.label}</Link>
                  </BreadcrumbLink>
                ) : index === breadcrumbs.length - 1 ? (
                  <BreadcrumbPage className="font-normal text-foreground">{crumb.label}</BreadcrumbPage>
                ) : (
                  <span className="truncate">{crumb.label}</span>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
