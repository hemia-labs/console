import { EmptyState } from "@/components/empty-state";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { PageHeader } from "@/components/page-header";
import { breadcrumbsFor } from "@/lib/nav";

export function ModulePlaceholder({
  description,
  locale,
  route,
  title,
}: {
  description: string;
  locale: string;
  route: string;
  title: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={<AppBreadcrumb items={breadcrumbsFor(route, locale)} />}
        description={description}
        title={title}
      />
      <EmptyState
        description={description}
        title={title}
      />
    </div>
  );
}
