import { cn } from "@/lib/utils";

export function BandVisual({
  strap,
  pod,
  className,
  label,
}: {
  strap: string;
  pod: string;
  className?: string;
  label: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[4/5] w-full overflow-hidden rounded-[24px]",
        className,
      )}
      role="img"
      aria-label={label}
    >
      <svg viewBox="0 0 400 500" className="h-full w-full" aria-hidden>
        <rect width="400" height="500" fill="#F6F3EE" />
        <ellipse cx="200" cy="430" rx="120" ry="18" fill="#E5DFD6" />
        <rect
          x="118"
          y="90"
          width="164"
          height="300"
          rx="82"
          fill={strap}
        />
        <rect
          x="150"
          y="200"
          width="100"
          height="78"
          rx="18"
          fill={pod}
        />
        <rect
          x="168"
          y="218"
          width="64"
          height="12"
          rx="6"
          fill="#F6F3EE"
          opacity="0.35"
        />
      </svg>
    </div>
  );
}
