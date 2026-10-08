import Link from "next/link";
import { ExternalLink, Plus, UserPlus } from "lucide-react";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { PageHeader } from "@/components/page-header";
import { breadcrumbsFor, localizedHref } from "@/lib/nav";

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;


  const quickLinks = [
    { href: "/identity/users", icon: UserPlus, label: "Crear usuario" },
    { href: "/identity/oauth-clients", icon: Plus, label: "Crear OAuth client" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={<AppBreadcrumb items={breadcrumbsFor("/", lang)} />}
        description="Resumen operativo de la consola"
        title="Dashboard"
      />

      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">{"Accesos rapidos"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{"Entradas directas a los flujos operativos principales."}</p>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => (
            <Link
              className="inline-flex h-8 items-center gap-3 rounded-md border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              href={localizedHref(lang, link.href)}
              key={link.href}
            >
              <link.icon className="size-4 shrink-0" />
              <span className="truncate">{link.label}</span>
              <ExternalLink className="ml-auto size-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold">Console</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Selecciona un módulo para comenzar a administrar Hemia.
        </p>
      </div>
    </div>
  );
}
