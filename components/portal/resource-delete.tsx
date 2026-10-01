"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ResourceDelete({
  table,
  id,
  removed,
  onDone,
}: {
  table: string;
  id: string;
  removed?: boolean;
  onDone?: () => void;
}) {
  const [confirm, setConfirm] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const permanent = Boolean(removed);

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
    onDone?.();
  }

  return (
    <div className="mt-4 rounded-2xl border border-stone p-3">
      <p className="text-sm font-bold">{permanent ? "Permanent delete" : "Remove"}</p>
      <p className="mt-1 text-sm text-muted">
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
      <Button className="mt-3" type="button" size="sm" variant="secondary" disabled={pending} onClick={() => void submit()}>
        {permanent ? "Delete permanently" : "Soft delete"}
      </Button>
    </div>
  );
}
