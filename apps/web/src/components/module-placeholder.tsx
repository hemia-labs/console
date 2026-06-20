import { EmptyState } from "@/components/empty-state";

export function ModulePlaceholder({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <EmptyState
      description={description}
      title={title}
    />
  );
}
