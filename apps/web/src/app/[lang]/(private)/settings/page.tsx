import { ModulePlaceholder } from "@/components/module-placeholder";

export default async function SettingsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;

  return (
    <ModulePlaceholder
      description="Ruta preparada para configuracion de Hemia Console."
      locale={lang}
      route="/settings"
      title="Ajustes"
    />
  );
}
