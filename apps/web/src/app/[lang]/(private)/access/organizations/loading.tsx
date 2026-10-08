import { Skeleton } from "@/components/zuno/skeleton";

export default function OrganizationsLoading() {
  return <div className="space-y-5"><Skeleton className="h-24 w-full" /><Skeleton className="h-8 w-48 self-end" /><Skeleton className="h-96 w-full" /></div>;
}
