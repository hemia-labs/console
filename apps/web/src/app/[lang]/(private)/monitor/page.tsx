import { ModulePlaceholder } from "@/components/module-placeholder";

export default async function MonitorPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;

  return (
    <ModulePlaceholder
      description="Ruta reservada para monitoreo y observabilidad operativa."
      locale={lang}
      route="/monitor"
      title="Monitor"
    />
  );
}
