import type { LucideIcon } from "lucide-react";
import { isLocale } from "@/i18n/config";
import {
  Activity,
  BriefcaseBusiness,
  FolderKanban,
  Gauge,
  KeyRound,
  LayoutDashboard,
  Settings,
  ShieldUser,
  Users,
} from "lucide-react";

export type NavItem = {
  children?: NavItem[];
  description?: string;
  disabled?: boolean;
  href?: string;
  icon: LucideIcon;
  label: string;
};

export const nav: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    description: "Resumen operativo de la consola",
    icon: LayoutDashboard,
  },
  {
    label: "Identity & Access",
    description: "Usuarios, permisos, cuentas y clientes de identidad",
    icon: ShieldUser,
    children: [
      {
        href: "/identity-access/users",
        label: "Usuarios",
        description: "Administracion de usuarios",
        icon: Users,
      },
      {
        href: "/identity-access/accounts",
        label: "Cuentas",
        description: "Cuentas locales conectadas a Hemia ID",
        icon: KeyRound,
      },
      {
        href: "/identity-access/oauth-clients",
        label: "OAuth clients",
        description: "Clientes OAuth y secretos one-time",
        icon: BriefcaseBusiness,
      },
    ],
  },
  {
    href: "/customers",
    label: "Clientes",
    description: "Modulo reservado para CRM v1+",
    icon: BriefcaseBusiness,
  },
  {
    href: "/projects",
    label: "Proyectos",
    description: "Modulo reservado para gestion de proyectos",
    icon: FolderKanban,
  },
  {
    href: "/services",
    label: "Servicios",
    description: "Catalogo operativo de servicios Hemia",
    icon: Gauge,
  },
  {
    href: "/monitor",
    label: "Monitor",
    description: "Observabilidad operativa de la consola",
    icon: Activity,
  },
  {
    href: "/settings",
    label: "Ajustes",
    description: "Configuracion de Hemia Console",
    icon: Settings,
  },
];

// Routes live under /[lang]; strip the locale so matching/links stay locale-agnostic.
export function stripLocale(pathname: string) {
  const seg = pathname.split("/")[1] ?? "";
  if (isLocale(seg)) return pathname.slice(seg.length + 1) || "/";
  return pathname;
}

export function localizedHref(locale: string, href: string) {
  return href === "/" ? `/${locale}` : `/${locale}${href}`;
}

function flatten(items: NavItem[]): NavItem[] {
  return items.flatMap((item) => [item, ...(item.children ? flatten(item.children) : [])]);
}

function flattenWithParents(items: NavItem[], parents: NavItem[] = []): Array<{ item: NavItem; parents: NavItem[] }> {
  return items.flatMap((item) => [
    { item, parents },
    ...(item.children ? flattenWithParents(item.children, [...parents, item]) : []),
  ]);
}

function matchFor(pathname: string) {
  pathname = stripLocale(pathname);
  return flatten(nav)
    .filter((item) =>
      item.href
        ? item.href === "/"
          ? pathname === "/"
          : pathname === item.href || pathname.startsWith(`${item.href}/`)
        : false
    )
    .sort((a, b) => (b.href?.length ?? 0) - (a.href?.length ?? 0))[0];
}

export function labelFor(pathname: string) {
  return matchFor(pathname)?.label ?? "Hemia Console";
}

export function descriptionFor(pathname: string) {
  return matchFor(pathname)?.description ?? "Consola operativa";
}

function titleFromSegment(segment: string) {
  if (segment === "new") return "Crear";
  if (segment === "edit") return "Editar";
  return segment
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function matchedTrail(pathname: string) {
  pathname = stripLocale(pathname);

  return flattenWithParents(nav)
    .filter(({ item }) =>
      item.href
        ? item.href === "/"
          ? pathname === "/"
          : pathname === item.href || pathname.startsWith(`${item.href}/`)
        : false
    )
    .sort((a, b) => (b.item.href?.length ?? 0) - (a.item.href?.length ?? 0))[0];
}

export type BreadcrumbNavItem = {
  href?: string;
  label: string;
};

export function breadcrumbsFor(pathname: string, locale: string): BreadcrumbNavItem[] {
  const currentPath = stripLocale(pathname);
  const match = matchedTrail(currentPath);
  const items: BreadcrumbNavItem[] = [{ href: localizedHref(locale, "/"), label: "Hemia" }];

  if (!match) {
    return [...items, { label: "Hemia Console" }];
  }

  for (const parent of match.parents) {
    items.push({
      href: parent.href ? localizedHref(locale, parent.href) : undefined,
      label: parent.label,
    });
  }

  const matchedHref = match.item.href ?? "/";
  const isExact = currentPath === matchedHref;
  items.push({
    href: isExact ? undefined : localizedHref(locale, matchedHref),
    label: match.item.label,
  });

  if (!isExact) {
    const suffix = currentPath.slice(matchedHref.length).split("/").filter(Boolean);
    const meaningfulSuffix = suffix.filter((segment) => segment !== "edit" || suffix.length === 1);

    if (meaningfulSuffix.includes("new")) {
      items.push({ label: titleFromSegment("new") });
    } else if (suffix.includes("edit")) {
      items.push({ label: titleFromSegment("edit") });
    } else {
      const last = meaningfulSuffix.at(-1);
      if (last) items.push({ label: titleFromSegment(last) });
    }
  }

  return items;
}
