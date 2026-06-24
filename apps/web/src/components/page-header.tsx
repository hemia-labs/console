import type { ReactNode } from "react";

export function PageHeader({
  actions,
  breadcrumb,
  description,
  title,
}: {
  actions?: ReactNode;
  breadcrumb: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {breadcrumb}
        <h1 className="mt-1 truncate text-2xl font-bold">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-supporting">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
