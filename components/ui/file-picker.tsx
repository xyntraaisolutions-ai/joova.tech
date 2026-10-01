"use client";

import { Folder } from "lucide-react";
import { useState, type ChangeEvent, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type FilePickerProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className"> & {
  label: string;
  hint?: string;
  className?: string;
};

export function FilePicker({ label, hint, className, disabled, onChange, onInvalid, ...props }: FilePickerProps) {
  const [fileName, setFileName] = useState("");
  const [missing, setMissing] = useState("");

  function change(event: ChangeEvent<HTMLInputElement>) {
    setFileName(event.target.files?.[0]?.name ?? "");
    setMissing("");
    onChange?.(event);
  }

  if (!hint) {
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
        <input {...props} className="sr-only" type="file" disabled={disabled} onChange={onChange} onInvalid={onInvalid} />
      </label>
    );
  }

  return (
    <div className={className}>
      <p className="text-sm font-medium text-ink">{label}</p>
      <label className="mt-2 flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-stone bg-white px-4 text-ink hover:border-ink/30 focus-within:border-ink">
        <Folder className="size-5 shrink-0" aria-hidden />
        <span className="min-w-0 truncate text-sm">{fileName || "Choose a file"}</span>
        <input
          {...props}
          className="sr-only"
          type="file"
          disabled={disabled}
          onChange={change}
          onInvalid={(event) => {
            event.preventDefault();
            setMissing(`Add a file. ${hint}`);
            onInvalid?.(event);
          }}
        />
      </label>
      <p className="mt-2 text-sm text-muted">{hint}</p>
      {missing ? <p className="mt-2 text-sm text-band-red" role="alert">{missing}</p> : null}
    </div>
  );
}
