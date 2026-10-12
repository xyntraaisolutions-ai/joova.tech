"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { useAuth } from "@/components/layout/auth-provider";
import { Button, buttonClassName } from "@/components/ui/button";

export function InternalCheckoutDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { logout } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState<"guest" | "customer" | null>(null);

  async function leave(next: "guest" | "customer") {
    setPending(next);
    await logout();
    onOpenChange(false);
    router.push(next === "guest" ? "/checkout" : "/account?mode=sign-in&next=/checkout");
    setPending(null);
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!pending) onOpenChange(next); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/70" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(32rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 text-ink">
          <Dialog.Title className="font-display text-2xl">This account cannot place an order</Dialog.Title>
          <Dialog.Description className="mt-3 text-sm text-muted">
            Please log out of your Joova internal account and sign in as a customer, or check out as a guest. Use an email other than your internal account email.
          </Dialog.Description>
          <div className="mt-6 flex flex-col gap-2">
            <Button type="button" disabled={pending !== null} onClick={() => void leave("guest")}>
              {pending === "guest" ? "Signing out" : "Log out and check out as a guest"}
            </Button>
            <Button type="button" variant="secondary" disabled={pending !== null} onClick={() => void leave("customer")}>
              {pending === "customer" ? "Signing out" : "Log out and sign in as a customer"}
            </Button>
            <Dialog.Close className={buttonClassName("ghost", "sm")} disabled={pending !== null}>
              Stay signed in
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
