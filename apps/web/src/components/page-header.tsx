import type { ReactNode } from "react";
import {
  PageHeader as ZunoPageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/zuno/page-header";

export function PageHeader({ actions, breadcrumb, description, title }: {
  actions?: ReactNode;
  breadcrumb?: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <ZunoPageHeader className="items-start sm:items-end">
      <PageHeaderContent>
        {breadcrumb}
        <PageHeaderHeading className="text-2xl font-bold text-heading">{title}</PageHeaderHeading>
        <PageHeaderDescription className="max-w-3xl text-supporting">{description}</PageHeaderDescription>
      </PageHeaderContent>
      {actions && <PageHeaderActions>{actions}</PageHeaderActions>}
    </ZunoPageHeader>
  );
}
