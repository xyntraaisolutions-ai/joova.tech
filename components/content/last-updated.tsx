import { lastUpdatedLabel } from "@/lib/content/updated";

export function LastUpdated({ value }: { value: string }) {
  const label = lastUpdatedLabel(value);
  if (!label) return null;
  return <p className="mt-3 text-sm text-muted">{label}</p>;
}
