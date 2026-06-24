import Link from "next/link";
import { Fragment } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export type AppBreadcrumbItem = {
  href?: string;
  label: string;
};

export function AppBreadcrumb({ items }: { items: AppBreadcrumbItem[] }) {
  return (
    <Breadcrumb className="mb-3 min-w-0 text-sm font-semibold text-primary">
      <BreadcrumbList>
        {items.map((item, index) => {
          const current = index === items.length - 1;

          return (
            <Fragment key={`${item.href ?? "current"}-${item.label}`}>
              <BreadcrumbItem>
                {current ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : !item.href ? (
                  <span className="truncate text-primary">{item.label}</span>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!current ? <BreadcrumbSeparator>/</BreadcrumbSeparator> : null}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
