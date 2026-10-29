import Link from "next/link";
import { connection } from "next/server";
import { ArrowUpRight, ArrowRight, Receipt, Scale, Wallet, BookOpen, Users, Building2, MailPlus, Network, Activity, KeyRound } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { localizedHref } from "@/lib/nav";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  await connection();
  const { lang } = await params;
  const local = process.env.NODE_ENV === "development";
  const systems = [
    { name: "Billing", description: "Facturación, cobros y suscripciones.", icon: Receipt, url: process.env.BILLING_WEB_URL || (local ? "http://localhost:5175" : undefined) },
    { name: "Legal", description: "Documentos legales y aceptaciones.", icon: Scale, url: process.env.LEGAL_WEB_URL || (local ? "http://localhost:5180" : undefined) },
    { name: "Balanz", description: "Operaciones y gestión financiera.", icon: Wallet, url: process.env.BALANZ_WEB_URL || (local ? "http://localhost:5181" : undefined) },
    { name: "Docs", description: "Documentación y conocimiento compartido.", icon: BookOpen, url: process.env.DOCS_WEB_URL },
  ];
  const actions = [
    { href: "/identity/users", icon: Users, label: "Administrar usuarios", description: "Cuentas, datos y estado de acceso." },
    { href: "/access/organizations", icon: Building2, label: "Organizaciones", description: "Consulta organizaciones y sus miembros." },
    { href: "/access/invitations/new", icon: MailPlus, label: "Invitar a una persona", description: "Da acceso a una organización." },
    { href: "/identity/oauth-clients/new", icon: KeyRound, label: "Registrar cliente OAuth", description: "Conecta una aplicación con Identity." },
  ];
  const resources = [
    { href: "/catalogs/systems", icon: Network, label: "Configurar sistemas", description: "Servicios, capacidades e integraciones." },
    { href: "/monitor", icon: Activity, label: "Monitor", description: "Consulta la vista de observabilidad operativa." },
  ];
  return (
    <div className="space-y-8">
      <PageHeader title="Hemia Console" description="Tu punto de entrada a los sistemas y la administración de Hemia." />
      <section aria-labelledby="systems-heading" className="space-y-4">
        <div><h2 id="systems-heading" className="text-lg font-semibold text-heading">Tus sistemas</h2><p className="mt-1 text-sm text-muted-foreground">Abre el sistema con el que necesitas trabajar.</p></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {systems.map((system) => {
            const content = <><system.icon aria-hidden="true" className="size-6 text-primary" /><div className="space-y-1"><h3 className="font-semibold">{system.name}</h3><p className="text-sm text-muted-foreground">{system.description}</p></div><span className="mt-auto flex items-center gap-2 pt-3 text-sm font-medium">{system.url ? <>Abrir sistema<ArrowUpRight aria-hidden="true" className="size-4" /></> : "Enlace pendiente de configurar"}</span></>;
            const className = "flex min-h-52 flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm";
            return system.url ? <a key={system.name} href={system.url} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ${system.name} en una nueva pestaña`} className={`${className} transition-colors hover:border-primary/50 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}>{content}</a> : <div key={system.name} className={className}>{content}</div>;
          })}
        </div>
      </section>
      <section aria-labelledby="actions-heading" className="space-y-4">
        <div><h2 id="actions-heading" className="text-lg font-semibold text-heading">Administración</h2><p className="mt-1 text-sm text-muted-foreground">Accesos directos a las tareas frecuentes.</p></div>
        <div className="grid gap-3 sm:grid-cols-2">
          {actions.map((action) => <Link key={action.href} href={localizedHref(lang, action.href)} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><action.icon aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" /><div className="min-w-0"><h3 className="text-sm font-semibold">{action.label}</h3><p className="mt-1 text-sm text-muted-foreground">{action.description}</p></div><ArrowRight aria-hidden="true" className="ml-auto size-4 shrink-0" /></Link>)}
        </div>
      </section>
      <section aria-labelledby="resources-heading" className="space-y-4">
        <h2 id="resources-heading" className="text-lg font-semibold text-heading">Configuración y operación</h2>
        <div className="grid gap-3 sm:grid-cols-2">{resources.map((resource) => <Link key={resource.href} href={localizedHref(lang, resource.href)} className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><resource.icon aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" /><div><h3 className="text-sm font-semibold">{resource.label}</h3><p className="mt-1 text-sm text-muted-foreground">{resource.description}</p></div><ArrowRight aria-hidden="true" className="ml-auto size-4 shrink-0" /></Link>)}</div>
      </section>
    </div>
  );
}
