"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button, buttonClassName } from "@/components/ui/button";

type LogoRow = {
  id: string;
  url: string;
  width: number;
  height: number;
  active: boolean;
  created_at: string;
};

export function LogoLibrary({ onError }: { onError: (message: string) => void }) {
  const [logos, setLogos] = useState<LogoRow[]>([]);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [deleting, setDeleting] = useState<LogoRow | null>(null);
  const [reason, setReason] = useState("");

  async function load() {
    const response = await fetch("/api/portal/logos");
    const data = (await response.json()) as { logos?: LogoRow[]; error?: string };
    if (!response.ok) {
      onError(data.error ?? "Logos could not be loaded.");
      setReady(true);
      return;
    }
    setLogos(data.logos ?? []);
    setReady(true);
  }

  useEffect(() => {
    void load();
  }, []);

  async function upload(file: File) {
    onError("");
    setPending(true);
    const body = new FormData();
    body.set("file", file);
    const response = await fetch("/api/portal/logos", { method: "POST", body });
    const data = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      onError(data.error ?? "The logo could not be uploaded.");
      return;
    }
    await load();
  }

  async function activate(id: string) {
    onError("");
    setPending(true);
    const response = await fetch("/api/portal/logos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "activate", id }),
    });
    const data = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      onError(data.error ?? "That logo could not be set as primary.");
      return;
    }
    await load();
  }

  async function confirmDelete() {
    if (!deleting || reason.trim().length < 3) return;
    onError("");
    setPending(true);
    const response = await fetch("/api/portal/logos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id: deleting.id, reason: reason.trim() }),
    });
    const data = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      onError(data.error ?? "The logo could not be deleted.");
      return;
    }
    setDeleting(null);
    setReason("");
    await load();
  }

  return (
    <div className="border-b border-stone pb-6">
      <h3 className="font-display text-xl">Logo</h3>
      <p className="mt-2 text-sm text-muted">
        This logo is used in the header, footer, receipts, and emails. Uploading a new file makes it primary and keeps the earlier versions.
        When no logo is primary, the brand name is shown instead.
      </p>
      <label className="mt-4 inline-flex min-h-11 cursor-pointer items-center rounded-full bg-ink px-4 text-sm font-bold text-paper">
        {pending ? "Working" : "Upload new logo"}
        <input
          className="sr-only"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          disabled={pending}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void upload(file);
          }}
        />
      </label>
      {!ready ? <p className="mt-4 text-sm text-muted">Loading logos.</p> : null}
      {ready && logos.length === 0 ? <p className="mt-4 text-sm text-muted">No logo is on file. The brand name is shown in its place.</p> : null}
      <ul className="mt-4 space-y-3">
        {logos.map((logo) => (
          <li key={logo.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone p-3">
            <Image src={logo.url} alt="" width={logo.width} height={logo.height} unoptimized className="h-10 w-auto max-w-48 bg-white object-contain" />
            <p className="text-sm text-muted">
              {logo.active ? "Primary" : "Saved"}
              {" · "}
              {new Date(logo.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
            </p>
            <div className="flex flex-wrap gap-2">
              {logo.active ? null : (
                <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => void activate(logo.id)}>
                  Make primary
                </Button>
              )}
              <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => { setReason(""); setDeleting(logo); }}>
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Dialog.Root open={Boolean(deleting)} onOpenChange={(open) => { if (!open && !pending) setDeleting(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/70" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(32rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 text-ink">
            <Dialog.Title className="font-display text-xl">Delete this logo</Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted">
              {deleting?.active
                ? "This logo is primary. After it is deleted, the header, footer, receipts, and emails show the brand name until another logo is set as primary."
                : "This removes the saved logo. The primary logo stays in place."}
            </Dialog.Description>
            <label className="mt-4 block text-sm">
              Reason
              <textarea
                className="mt-2 min-h-24 w-full rounded-2xl border border-stone bg-white px-4 py-3"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                required
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-2">
              <Dialog.Close className={buttonClassName("secondary", "sm")} disabled={pending}>
                Cancel
              </Dialog.Close>
              <Button type="button" size="sm" disabled={pending || reason.trim().length < 3} onClick={() => void confirmDelete()}>
                Delete logo
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
