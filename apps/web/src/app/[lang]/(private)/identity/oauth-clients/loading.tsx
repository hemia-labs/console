import { Skeleton } from "@/components/zuno/skeleton";

export default function OAuthClientsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-full sm:w-96" />
        </div>
        <Skeleton className="h-80 w-full rounded-none" />
        <div className="border-t border-border px-5 py-4">
          <Skeleton className="h-5 w-40" />
        </div>
      </div>
    </div>
  );
}
