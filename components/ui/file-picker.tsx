"use client";

import { Folder } from "lucide-react";
import { type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type FilePickerProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className"> & {
  label: string;
  className?: string;
};

export function FilePicker({ label, className, disabled, ...props }: FilePickerProps) {
  return (
    <label
      className={cn(
        "inline-flex size-11 cursor-pointer items-center justify-center rounded-2xl border border-stone bg-white text-ink hover:border-ink/30 focus-within:border-ink",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      <span className="sr-only">{label}</span>
      <Folder className="size-5" aria-hidden />
      <input {...props} className="sr-only" type="file" disabled={disabled} />
    </label>
  );
}
