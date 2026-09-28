import { cn } from "@/lib/utils";

export function PhoneMockup({
  title,
  copy,
  dark = false,
}: {
  title: string;
  copy: string;
  dark?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-[220px] rounded-[36px] border-8 p-4 shadow-xl",
        dark
          ? "border-[var(--fixed-ink)] bg-[var(--fixed-ink)] text-[var(--fixed-paper)]"
          : "border-ink bg-paper text-ink",
      )}
    >
      <div className="mx-auto mb-4 h-4 w-20 rounded-full bg-stone/80" />
      <p className="font-display text-2xl font-semibold leading-tight">{title}</p>
      <p className={cn("mt-3 text-sm", dark ? "text-[var(--fixed-muted)]" : "text-muted")}>
        {copy}
      </p>
      <div className="mt-6 space-y-2">
        <div className="h-16 rounded-2xl bg-stone/70" />
        <div className="h-10 rounded-2xl bg-stone/50" />
        <div className="h-10 rounded-2xl bg-coral/80" />
      </div>
    </div>
  );
}
