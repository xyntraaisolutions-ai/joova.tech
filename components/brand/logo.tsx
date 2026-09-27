import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex", className)}>
      <Image
        src="/brand/joova-wordmark-ink.png"
        alt=""
        width={2000}
        height={456}
        priority
        className="logo-day h-7 w-auto"
      />
      <Image
        src="/brand/joova-wordmark-paper.png"
        alt=""
        width={2000}
        height={456}
        className="logo-night h-7 w-auto"
      />
    </span>
  );
}
