import { specs } from "@/content/site";

export function SpecsTable() {
  return (
    <div className="overflow-hidden rounded-3xl border border-stone bg-white">
      <dl>
        {specs.map((row) => (
          <div
            key={row.label}
            className="grid gap-1 border-t border-stone px-4 py-3 first:border-t-0 sm:grid-cols-[11rem_1fr] sm:gap-4"
          >
            <dt className="font-medium">{row.label}</dt>
            <dd className="text-muted">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
