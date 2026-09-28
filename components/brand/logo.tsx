import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex", className)}>
      <Image
        src="/brand/joova-wordmark-orange.png"
        alt=""
        width={977}
        height={285}
        priority
        unoptimized
        className="logo-day h-8 w-auto"
      />
      <Image
        src="/brand/joova-wordmark-orange-night.png"
        alt=""
        width={977}
        height={285}
        unoptimized
        className="logo-night h-8 w-auto"
      />
    </span>
  );
}
