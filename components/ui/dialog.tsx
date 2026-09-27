"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export function VideoModal({
  trigger,
  title,
  children,
}: {
  trigger: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/70" />
        <Dialog.Content className="fixed inset-4 z-50 m-auto h-fit max-h-[90vh] max-w-4xl overflow-auto rounded-3xl bg-ink p-4 text-paper sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <Dialog.Title className="font-display text-xl">{title}</Dialog.Title>
            <Dialog.Close
              className="rounded-full p-2 hover:bg-white/10"
              aria-label="Close video"
            >
              <X className="size-5" />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
