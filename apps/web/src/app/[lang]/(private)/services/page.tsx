import { ModulePlaceholder } from "@/components/module-placeholder";

export default async function ServicesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;

  return (
    <ModulePlaceholder
      description="Ruta reservada para el catalogo operativo de servicios Hemia."
      locale={lang}
      route="/services"
      title="Servicios"
    />
  );
}
