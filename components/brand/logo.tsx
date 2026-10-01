import Image from "next/image";
import { useSiteContent } from "@/components/layout/site-content";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  const { logo, company } = useSiteContent();
  if (!logo) {
    return <span className={cn("font-display text-[1.75rem] font-bold leading-none", className)}>{company.brand}</span>;
  }
  return (
    <span className={cn("site-logo inline-flex", className)}>
      <Image
        src={logo.url}
        alt=""
        width={logo.width}
        height={logo.height}
        priority
        unoptimized
        className="h-9 w-auto"
      />
    </span>
  );
}
