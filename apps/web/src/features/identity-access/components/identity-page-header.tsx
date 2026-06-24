import type { ReactNode } from "react";

export function IdentityPageHeader({
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
    <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
      <div className="min-w-0">
        {breadcrumb}
        <h1 className="truncate text-3xl font-bold tracking-normal md:text-4xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-supporting md:text-base">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
