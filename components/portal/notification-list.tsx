"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Kind = "order" | "return" | "warranty";

type Recipient = {
  id: string;
  kind: Kind;
  full_name: string;
  email: string;
  phone: string;
  role_label: string;
  email_enabled: boolean;
};

const copy: Record<Kind, { title: string; lead: string }> = {
  order: {
    title: "Order",
    lead: "These people get an email when a new order is paid. Until you add someone, that email still goes to the support address.",
  },
  return: {
    title: "Return",
    lead: "These people get an email when a customer starts a return.",
  },
  warranty: {
    title: "Warranty",
    lead: "These people get an email when a customer starts a warranty claim.",
  },
};

export function NotificationList({ kind, onError }: { kind: Kind; onError: (message: string) => void }) {
  const [rows, setRows] = useState<Recipient[]>([]);
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);

  function report(text: string, isError: boolean) {
    setMessage(text);
    setFailed(isError);
    onError(isError ? text : "");
  }

  async function load() {
    const response = await fetch("/api/portal/notifications");
    const data = (await response.json()) as { recipients?: Recipient[]; error?: string };
    if (!response.ok) {
      setLoadFailed(true);
      setReady(true);
      report(data.error ?? "Notifications could not be loaded.", true);
      return;
    }
    setLoadFailed(false);
    setRows((data.recipients ?? []).filter((row) => row.kind === kind));
    setReady(true);
  }

  useEffect(() => {
    void load();
  }, [kind]);

  return (
    <section className="rounded-3xl bg-white p-4">
      <h2 className="font-display text-2xl">{copy[kind].title}</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">{copy[kind].lead}</p>
      <p className="mt-2 text-sm text-muted">Email is on for each new person. Text messages are not sent yet. The phone number is saved for that later step.</p>
      {message ? (
        <p className="mt-4 text-sm" role={failed ? "alert" : "status"}>{message}</p>
      ) : null}
      {!ready ? <p className="mt-4 text-sm text-muted">Loading recipients.</p> : null}
      <ul className="mt-4 space-y-3">
        {rows.map((row) => (
          <RecipientRow key={row.id} kind={kind} recipient={row} onReport={report} onDone={load} />
        ))}
      </ul>
      {ready && !loadFailed && rows.length === 0 ? <p className="mt-4 text-sm text-muted">No one is on this list yet.</p> : null}
      <RecipientForm
        kind={kind}
        heading={rows.length > 0 ? "Add another recipient" : "Add a recipient"}
        onReport={report}
        onDone={load}
      />
    </section>
  );
}

function RecipientRow({
  kind,
  recipient,
  onReport,
  onDone,
}: {
  kind: Kind;
  recipient: Recipient;
  onReport: (message: string, failed: boolean) => void;
  onDone: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li>
        <RecipientForm
          kind={kind}
          recipient={recipient}
          onReport={onReport}
          onDone={async () => {
            setEditing(false);
            await onDone();
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="rounded-3xl border border-stone p-4">
      <p className="font-bold">{recipient.full_name}</p>
      <p className="mt-1 text-sm">{recipient.email}</p>
      <p className="mt-1 text-sm text-muted">{recipient.phone || "No phone"} · {recipient.role_label}</p>
      <p className="mt-1 text-sm text-muted">{recipient.email_enabled ? "Email on" : "Email off"} · Text is not sent yet</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={async () => {
            if (!window.confirm(`Remove ${recipient.full_name} from ${copy[kind].title.toLowerCase()} notifications?`)) return;
            const response = await fetch("/api/portal/notifications", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "delete", id: recipient.id }),
            });
            const data = (await response.json()) as { error?: string };
            if (!response.ok) {
              onReport(data.error ?? "The recipient could not be removed.", true);
              return;
            }
            onReport(`${recipient.full_name} was removed.`, false);
            await onDone();
          }}
        >
          Remove
        </Button>
      </div>
    </li>
  );
}

function RecipientForm({
  kind,
  recipient,
  heading,
  onReport,
  onDone,
  onCancel,
}: {
  kind: Kind;
  recipient?: Recipient;
  heading?: string;
  onReport: (message: string, failed: boolean) => void;
  onDone: () => Promise<void>;
  onCancel?: () => void;
}) {
  return (
    <form
      className="mt-6 grid gap-3 rounded-3xl border border-stone p-4 md:grid-cols-2"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const values = new FormData(form);
        const fullName = String(values.get("fullName") ?? "").trim();
        const email = String(values.get("email") ?? "").trim();
        const confirmed = window.confirm(
          recipient
            ? `Save changes for ${fullName || "this recipient"}?`
            : `Add ${fullName || "this recipient"} (${email}) to ${copy[kind].title.toLowerCase()} notifications?`,
        );
        if (!confirmed) return;
        const response = await fetch("/api/portal/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "save",
            id: recipient?.id,
            kind,
            fullName,
            email,
            phone: String(values.get("phone") ?? ""),
            role: String(values.get("role") ?? ""),
            emailEnabled: values.get("emailEnabled") === "on",
          }),
        });
        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          onReport(data.error ?? "The recipient could not be saved.", true);
          await onDone();
          return;
        }
        if (!recipient) form.reset();
        onReport(recipient ? `Changes for ${fullName} were saved.` : `${fullName} was added. You can add another person below.`, false);
        await onDone();
      }}
    >
      {heading ? <h3 className="font-display text-xl md:col-span-2">{heading}</h3> : null}
      <label className="text-sm">Full name<Input className="mt-2" name="fullName" defaultValue={recipient?.full_name} required /></label>
      <label className="text-sm">Email<Input className="mt-2" type="email" name="email" defaultValue={recipient?.email} required /></label>
      <label className="text-sm">Phone<Input className="mt-2" name="phone" inputMode="tel" autoComplete="tel" defaultValue={recipient?.phone ?? ""} /></label>
      <label className="text-sm">Role<Input className="mt-2" name="role" defaultValue={recipient?.role_label} placeholder="Customer support" required /></label>
      <div className="flex flex-wrap items-center gap-4 md:col-span-2">
        <label className="inline-flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" name="emailEnabled" defaultChecked={recipient ? recipient.email_enabled : true} />
          Email
        </label>
        <label className="inline-flex min-h-11 items-center gap-2 text-sm text-muted">
          <input type="checkbox" name="textEnabled" disabled defaultChecked={false} />
          Text
        </label>
      </div>
      <div className="flex flex-wrap gap-2 md:col-span-2">
        <Button type="submit" size="sm">{recipient ? "Save" : "Add recipient"}</Button>
        {onCancel ? <Button type="button" size="sm" variant="secondary" onClick={onCancel}>Cancel</Button> : null}
      </div>
    </form>
  );
}
