import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { BreadcrumbProvider } from "@/components/breadcrumb-context";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/zuno/tooltip";
import { ConsoleSessionProvider } from "@/features/auth/console-session-provider";

export default async function PrivateLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return (
    <ConsoleSessionProvider>
      <TooltipProvider>
        <BreadcrumbProvider>
        <SidebarProvider
          style={
            {
              "--sidebar-width": "var(--layout-sidebar-width)",
              "--sidebar-width-icon": "var(--layout-sidebar-collapsed-width)",
            } as React.CSSProperties
          }
        >
          <AppSidebar locale={lang} />
          <SidebarInset className="min-w-0">
            <AppTopbar locale={lang} />
            <div className="flex min-w-0 flex-1 flex-col gap-4 p-4">
              <main className="min-h-full min-w-0 flex-1 rounded-xl bg-muted/50 p-4 md:p-6">{children}</main>
            </div>
          </SidebarInset>
        </SidebarProvider>
        </BreadcrumbProvider>
      </TooltipProvider>
    </ConsoleSessionProvider>
  );
}
