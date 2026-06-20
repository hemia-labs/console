import Link from "next/link";
import { Activity, KeyRound, ShieldUser, Users } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { getDictionary } from "@/i18n/dictionaries";
import { localizedHref } from "@/lib/nav";
import type { Locale } from "@/i18n/config";

export default async function Home({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  const t = (await getDictionary(lang)).home;

  const quickLinks = [
    { href: "/identity-access/users", label: t.quickLinks.users },
    { href: "/identity-access/invitations", label: t.quickLinks.invitations },
    { href: "/identity-access/tenants", label: t.quickLinks.tenants },
    { href: "/identity-access/oauth-clients", label: t.quickLinks.oauthClients },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t.consoleApi} value={t.ready} icon={<Activity className="size-5" />} />
        <StatCard label={t.identityAccess} value="11" icon={<ShieldUser className="size-5" />} />
        <StatCard label={t.users} value={t.pending} tone="violet" icon={<Users className="size-5" />} />
        <StatCard label={t.accounts} value={t.pending} icon={<KeyRound className="size-5" />} />
      </div>

      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">{t.sectionTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.sectionDescription}</p>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => (
            <Link
              className="inline-flex h-12 items-center rounded-md border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              href={localizedHref(lang, link.href)}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
