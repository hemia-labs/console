import type { LucideIcon } from "lucide-react";
import { isLocale } from "@/i18n/config";
import {
  Activity,
  BriefcaseBusiness,
  Building2,
  FolderKanban,
  Gauge,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  MonitorCog,
  Network,
  Send,
  Settings,
  ShieldCheck,
  ShieldUser,
  SquareStack,
  Users,
  UserRoundCog,
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
        href: "/identity-access/invitations",
        label: "Invitaciones",
        description: "Altas pendientes y reenvios",
        icon: Send,
      },
      {
        href: "/identity-access/roles",
        label: "Roles",
        description: "Roles operativos y asignaciones",
        icon: ShieldCheck,
      },
      {
        href: "/identity-access/permissions",
        label: "Permisos",
        description: "Permisos disponibles para roles",
        icon: LockKeyhole,
      },
      {
        href: "/identity-access/tenants",
        label: "Tenants",
        description: "Tenants administrados por Hemia ID",
        icon: Building2,
      },
      {
        href: "/identity-access/organizations",
        label: "Organizaciones",
        description: "Organizaciones asociadas a tenants",
        icon: Network,
      },
      {
        href: "/identity-access/teams",
        label: "Teams",
        description: "Equipos y pertenencia operativa",
        icon: SquareStack,
      },
      {
        href: "/identity-access/memberships",
        label: "Membresias",
        description: "Relaciones usuario-organizacion-team",
        icon: UserRoundCog,
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
      {
        href: "/identity-access/sso-clients",
        label: "SSO clients",
        description: "Configuracion de clientes SSO",
        icon: MonitorCog,
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
