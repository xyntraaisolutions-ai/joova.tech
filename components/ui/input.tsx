import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-2xl border border-stone bg-white px-4 text-[17px] text-ink placeholder:text-muted",
        className,
      )}
      {...props}
    />
  );
}
