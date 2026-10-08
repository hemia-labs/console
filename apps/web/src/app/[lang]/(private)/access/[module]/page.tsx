import { notFound } from "next/navigation";

import { ModulePlaceholder } from "@/components/module-placeholder";

const modules = {
  invitations: {
    description: "Ruta reservada para administrar invitaciones de acceso.",
    title: "Invitations",
  },
  memberships: {
    description: "Ruta reservada para administrar memberships de organizations.",
    title: "Memberships",
  },
  organizations: {
    description: "Ruta reservada para administrar organizations de Hemia Access.",
    title: "Organizations",
  },
  products: {
    description: "Ruta reservada para administrar products y product access.",
    title: "Products",
  },
  roles: {
    description: "Ruta reservada para administrar roles y permisos.",
    title: "Roles y permisos",
  },
} as const;

export default async function AccessModulePage({
  params,
}: {
  params: Promise<{ lang: string; module: string }>;
}) {
  const { lang, module } = await params;
  const accessModule = modules[module as keyof typeof modules];

  if (!accessModule) notFound();

  return (
    <ModulePlaceholder
      description={accessModule.description}
      locale={lang}
      route={`/access/${module}`}
      title={accessModule.title}
    />
  );
}
