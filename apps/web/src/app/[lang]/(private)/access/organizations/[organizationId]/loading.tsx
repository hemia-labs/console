import { Skeleton } from "@/components/zuno/skeleton";

export default function OrganizationDetailLoading() {
  return <div className="space-y-5"><Skeleton className="h-8 w-full" /><Skeleton className="h-56 w-full" /><Skeleton className="h-48 w-full" /></div>;
}
