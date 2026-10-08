import type { ComponentProps } from "react";
import { PageHeader } from "@/components/page-header";

export function IdentityPageHeader(props: ComponentProps<typeof PageHeader>) {
  return <div className="mb-6"><PageHeader {...props} /></div>;
}
