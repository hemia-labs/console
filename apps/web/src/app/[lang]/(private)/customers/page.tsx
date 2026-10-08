import { ModulePlaceholder } from "@/components/module-placeholder";

export default async function CustomersPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;

  return (
    <ModulePlaceholder
      description="Ruta reservada para el modulo de clientes en una fase posterior."
      locale={lang}
      route="/customers"
      title="Clientes"
    />
  );
}
