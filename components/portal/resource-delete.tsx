"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button, buttonClassName } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ResourceDelete({
  table,
  id,
  removed,
  onDone,
  withDialog = false,
}: {
  table: string;
  id: string;
  removed?: boolean;
  onDone?: () => void;
  withDialog?: boolean;
}) {
  const [confirm, setConfirm] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState("");
  const permanent = Boolean(removed);
  const phrase = permanent ? "PERMANENT DELETE" : "SOFT DELETE";
  const finished = permanent ? "This record was permanently deleted." : "This record was removed.";

  async function submit() {
    setError("");
    setPending(true);
    const response = await fetch("/api/portal/lifecycle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table, id, confirm, reason }),
    });
    const data = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      setError(data.error ?? "That record could not be removed.");
      return;
    }
    setConfirm("");
    setReason("");
    if (withDialog) {
      setDone(finished);
      return;
    }
    onDone?.();
  }

  function closeDialog() {
    if (pending) return;
    const completed = done;
    setOpen(false);
    setDone("");
    setError("");
    if (completed) onDone?.();
  }

  const fields = (
    <>
      <p className="text-sm text-muted">
        {permanent
          ? "This record is already removed. Type PERMANENT DELETE and a reason to erase it."
          : "Type SOFT DELETE to remove this. It stays recoverable until a permanent delete."}
      </p>
      <label className="mt-3 block text-sm">
        Confirmation
        <Input className="mt-2" value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="off" />
      </label>
      {permanent ? (
        <label className="mt-3 block text-sm">
          Reason
          <textarea
            className="mt-2 min-h-20 w-full rounded-2xl border border-stone bg-white px-4 py-3"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </label>
      ) : null}
      {error ? <p className="mt-2 text-sm" role="alert">{error}</p> : null}
    </>
  );

  if (!withDialog) {
    return (
      <div className="mt-4 rounded-2xl border border-stone p-3">
        <p className="text-sm font-bold">{permanent ? "Permanent delete" : "Remove"}</p>
        {fields}
        <Button className="mt-3" type="button" size="sm" variant="secondary" disabled={pending} onClick={() => void submit()}>
          {permanent ? "Delete permanently" : "Soft delete"}
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button
        className="mt-4"
        type="button"
        size="sm"
        variant="secondary"
        onClick={() => {
          setDone("");
          setError("");
          setOpen(true);
        }}
      >
        {permanent ? "Delete permanently" : "Remove"}
      </Button>
      <Dialog.Root open={open} onOpenChange={(next) => { if (!next) closeDialog(); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/70" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-50 w-[min(32rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 text-ink"
            onEscapeKeyDown={(event) => { if (pending) event.preventDefault(); }}
            onPointerDownOutside={(event) => { if (pending) event.preventDefault(); }}
          >
            {done ? (
              <>
                <Dialog.Title className="font-display text-xl">Done</Dialog.Title>
                <Dialog.Description className="mt-2 text-sm text-muted">{done}</Dialog.Description>
                <div className="mt-4">
                  <Button type="button" size="sm" onClick={closeDialog}>Close</Button>
                </div>
              </>
            ) : (
              <>
                <Dialog.Title className="font-display text-xl">{permanent ? "Delete this record permanently?" : "Remove this record?"}</Dialog.Title>
                <Dialog.Description className="sr-only">
                  {permanent ? "Type PERMANENT DELETE to erase this record." : "Type SOFT DELETE to remove this record."}
                </Dialog.Description>
                <div className="mt-3">{fields}</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Dialog.Close className={buttonClassName("secondary", "sm")} disabled={pending}>Cancel</Dialog.Close>
                  <Button type="button" size="sm" disabled={pending || confirm.trim() !== phrase} onClick={() => void submit()}>
                    {pending ? "Working" : permanent ? "Delete permanently" : "Remove"}
                  </Button>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
