import { ModulePlaceholder } from "@/components/module-placeholder";

export default async function ProjectsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;

  return (
    <ModulePlaceholder
      description="Ruta reservada para el modulo de proyectos en una fase posterior."
      locale={lang}
      route="/projects"
      title="Proyectos"
    />
  );
}
