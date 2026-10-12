"use client";

import { useState } from "react";
import Link from "next/link";
import { appsContent, storeTarget, type AppStoreId } from "@/content/apps";
import { StoreBadge } from "@/components/apps/store-badge";
import { Button } from "@/components/ui/button";
import { FilePicker } from "@/components/ui/file-picker";
import { Input } from "@/components/ui/input";

type AppPageRow = {
  kicker?: string;
  title?: string;
  lead?: string;
  phone_title?: string;
  phone_copy?: string;
  note?: string;
  includes_href?: string;
  includes_label?: string;
  privacy_href?: string;
  privacy_label?: string;
};

type NoteRow = { id: string; title: string; body: string; deleted_at?: string | null };
type CardRow = {
  id: string;
  eyebrow: string;
  title: string;
  lead: string;
  href: string;
  href_label: string;
  steps: string[];
  deleted_at?: string | null;
};
type StoreRow = {
  id: string;
  card_id: string;
  store: AppStoreId;
  kicker: string;
  label: string;
  href: string;
  icon_url: string;
  deleted_at?: string | null;
};

export type AppsDeskData = {
  page?: AppPageRow | null;
  notes?: NoteRow[];
  cards?: CardRow[];
  stores?: StoreRow[];
};

async function save(body: unknown) {
  const response = await fetch("/api/portal/content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as { error?: string };
  return response.ok ? "" : data.error ?? "That content could not be saved.";
}

export function AppsDesk({
  apps,
  onDone,
  onError,
}: {
  apps?: AppsDeskData;
  onDone: () => void;
  onError: (message: string) => void;
}) {
  const [notice, setNotice] = useState("");
  const page = apps?.page;
  const notes = apps?.notes ?? [];
  const cards = apps?.cards ?? [];
  const stores = apps?.stores ?? [];
  const fallback = appsContent;

  async function submit(body: unknown) {
    setNotice("");
    const error = await save(body);
    onError(error);
    if (!error) {
      setNotice("Saved. The public Apps page uses this now.");
      onDone();
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Apps</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Edit the download page, product links, Google Play and App Store links, and the badge icons. Leave a store link empty to keep the stand-in listing.
          </p>
        </div>
        <Link href="/apps" className="text-sm font-bold underline underline-offset-4">Open the public page</Link>
      </div>
      {notice ? <p className="mt-4 text-sm font-bold" role="status">{notice}</p> : null}

      <form
        className="mt-4 grid gap-3 rounded-3xl bg-white p-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          void submit({
            kind: "appPage",
            kicker: String(form.get("kicker") ?? ""),
            title: String(form.get("title") ?? ""),
            lead: String(form.get("lead") ?? ""),
            phoneTitle: String(form.get("phoneTitle") ?? ""),
            phoneCopy: String(form.get("phoneCopy") ?? ""),
            note: String(form.get("note") ?? ""),
            includesHref: String(form.get("includesHref") ?? ""),
            includesLabel: String(form.get("includesLabel") ?? ""),
            privacyHref: String(form.get("privacyHref") ?? ""),
            privacyLabel: String(form.get("privacyLabel") ?? ""),
          });
        }}
      >
        <h3 className="font-display text-xl">Page</h3>
        <Field name="kicker" label="Eyebrow" defaultValue={page?.kicker || fallback.kicker} />
        <Field name="title" label="Heading" defaultValue={page?.title || fallback.title} />
        <Area name="lead" label="Intro" defaultValue={page?.lead || fallback.lead} />
        <Field name="phoneTitle" label="Phone title" defaultValue={page?.phone_title || fallback.phoneTitle} />
        <Field name="phoneCopy" label="Phone line" defaultValue={page?.phone_copy || fallback.phoneCopy} />
        <Area name="note" label="Footer note" defaultValue={page?.note || fallback.note} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field name="includesLabel" label="Feature link label" defaultValue={page?.includes_label || fallback.includesLabel} />
          <Field name="includesHref" label="Feature link" defaultValue={page?.includes_href || fallback.includesHref} />
          <Field name="privacyLabel" label="Privacy link label" defaultValue={page?.privacy_label || fallback.privacyLabel} />
          <Field name="privacyHref" label="Privacy link" defaultValue={page?.privacy_href || fallback.privacyHref} />
        </div>
        <Button type="submit" size="sm">Save page</Button>
      </form>

      <section className="mt-6">
        <h3 className="font-display text-xl">Notes</h3>
        <ul className="mt-3 space-y-3">
          {notes.map((note) => (
            <li key={note.id}>
              <form
                className="grid gap-3 rounded-3xl bg-white p-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  void submit({
                    kind: "appNote",
                    id: note.id,
                    title: String(form.get("title") ?? ""),
                    body: String(form.get("body") ?? ""),
                    hidden: form.get("hidden") === "on",
                  });
                }}
              >
                <Field name="title" label="Title" defaultValue={note.title} />
                <Area name="body" label="Text" defaultValue={note.body} />
                <Hide hidden={Boolean(note.deleted_at)} />
                <Button type="submit" size="sm">Save note</Button>
              </form>
            </li>
          ))}
        </ul>
        <form
          className="mt-3 grid gap-3 rounded-3xl bg-white p-4"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void submit({
              kind: "appNote",
              id: "",
              title: String(form.get("title") ?? ""),
              body: String(form.get("body") ?? ""),
              hidden: false,
            });
          }}
        >
          <h4 className="font-bold">Add a note</h4>
          <Field name="title" label="Title" />
          <Area name="body" label="Text" />
          <Button type="submit" size="sm">Add note</Button>
        </form>
      </section>

      <section className="mt-6 space-y-6">
        <h3 className="font-display text-xl">Products and stores</h3>
        {cards.map((card) => (
          <article key={card.id} className="rounded-3xl bg-white p-4">
            <form
              className="grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                void submit({
                  kind: "appCard",
                  id: card.id,
                  eyebrow: String(form.get("eyebrow") ?? ""),
                  title: String(form.get("title") ?? ""),
                  lead: String(form.get("lead") ?? ""),
                  href: String(form.get("href") ?? ""),
                  hrefLabel: String(form.get("hrefLabel") ?? ""),
                  steps: String(form.get("steps") ?? ""),
                  hidden: form.get("hidden") === "on",
                });
              }}
            >
              <p className="text-sm text-muted">Id {card.id}</p>
              <Field name="eyebrow" label="Product label" defaultValue={card.eyebrow} optional />
              <Field name="title" label="Heading" defaultValue={card.title} />
              <Area name="lead" label="Intro" defaultValue={card.lead} />
              <Area name="steps" label="Steps, one per line" defaultValue={(card.steps ?? []).join("\n")} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field name="hrefLabel" label="Product link label" defaultValue={card.href_label} />
                <Field name="href" label="Product link" defaultValue={card.href} />
              </div>
              <Hide hidden={Boolean(card.deleted_at)} />
              <Button type="submit" size="sm">Save product</Button>
            </form>
            <ul className="mt-4 space-y-3">
              {stores.filter((store) => store.card_id === card.id).map((store) => (
                <li key={`${store.id}-${store.icon_url}`}>
                  <StoreForm store={store} cardId={card.id} cardTitle={card.title} onSubmit={submit} />
                </li>
              ))}
            </ul>
            <AddStore cardId={card.id} onSubmit={submit} />
          </article>
        ))}
        <form
          className="grid gap-3 rounded-3xl bg-white p-4"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void submit({
              kind: "appCard",
              id: String(form.get("id") ?? ""),
              eyebrow: String(form.get("eyebrow") ?? ""),
              title: String(form.get("title") ?? ""),
              lead: String(form.get("lead") ?? ""),
              href: String(form.get("href") ?? ""),
              hrefLabel: String(form.get("hrefLabel") ?? ""),
              steps: String(form.get("steps") ?? ""),
              hidden: false,
            });
          }}
        >
          <h4 className="font-bold">Add a product</h4>
          <Field name="id" label="Id, such as ring" />
          <Field name="eyebrow" label="Product label" optional />
          <Field name="title" label="Heading" />
          <Area name="lead" label="Intro" />
          <Area name="steps" label="Steps, one per line" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field name="hrefLabel" label="Product link label" />
            <Field name="href" label="Product link" />
          </div>
          <Button type="submit" size="sm">Add product</Button>
        </form>
      </section>
    </div>
  );
}

function StoreForm({
  store,
  cardId,
  cardTitle,
  onSubmit,
}: {
  store: StoreRow;
  cardId: string;
  cardTitle: string;
  onSubmit: (body: unknown) => Promise<void>;
}) {
  const [iconUrl, setIconUrl] = useState(store.icon_url);
  const [href, setHref] = useState(store.href);
  const [kicker, setKicker] = useState(store.kicker);
  const [label, setLabel] = useState(store.label);
  const [uploadError, setUploadError] = useState("");

  async function upload(file: File) {
    setUploadError("");
    const body = new FormData();
    body.set("file", file);
    const response = await fetch("/api/portal/media", { method: "POST", body });
    const data = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !data.url) {
      setUploadError(data.error ?? "The icon could not be uploaded.");
      return;
    }
    setIconUrl(data.url);
  }

  return (
    <form
      className="grid gap-3 rounded-2xl border border-stone p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        void onSubmit({
          kind: "appStore",
          id: store.id,
          cardId,
          store: store.store,
          kicker: String(form.get("kicker") ?? ""),
          label: String(form.get("label") ?? ""),
          href: String(form.get("href") ?? ""),
          iconUrl,
          hidden: form.get("hidden") === "on",
        });
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="font-bold">{store.store === "google" ? "Google Play" : "App Store"}</h4>
        <StoreBadge store={store.store} name={cardTitle} kicker={kicker} label={label} iconUrl={iconUrl} href={storeTarget(cardId, { store: store.store, href })} />
      </div>
      <Field name="kicker" label="Small line" defaultValue={kicker} onChange={setKicker} />
      <Field name="label" label="Store name" defaultValue={label} onChange={setLabel} />
      <Field name="href" label="Store link" defaultValue={href} optional onChange={setHref} />
      <p className="text-sm text-muted">Leave the store link empty until the listing is live. A phone will open this link in the store.</p>
      <label className="block text-sm">
        Icon address
        <Input className="mt-2" name="iconUrl" value={iconUrl} onChange={(event) => setIconUrl(event.target.value)} placeholder="Upload or paste an image address" />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <FilePicker
          label="Upload icon"
          hint="JPEG, PNG, WebP, or GIF"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
        />
        <Button type="button" size="sm" variant="secondary" onClick={() => setIconUrl("")}>Use the built-in icon</Button>
      </div>
      {uploadError ? <p role="alert">{uploadError}</p> : null}
      <Hide hidden={Boolean(store.deleted_at)} />
      <Button type="submit" size="sm">Save store</Button>
    </form>
  );
}

function AddStore({ cardId, onSubmit }: { cardId: string; onSubmit: (body: unknown) => Promise<void> }) {
  return (
    <form
      className="mt-3 grid gap-3 rounded-2xl border border-dashed border-stone p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const store = String(form.get("store") ?? "google") === "apple" ? "apple" : "google";
        void onSubmit({
          kind: "appStore",
          id: `${cardId}-${store}-${Date.now().toString(36)}`,
          cardId,
          store,
          kicker: String(form.get("kicker") ?? ""),
          label: String(form.get("label") ?? ""),
          href: String(form.get("href") ?? ""),
          iconUrl: "",
          hidden: false,
        });
      }}
    >
      <h4 className="font-bold">Add a store button</h4>
      <label className="block text-sm">
        Store
        <select name="store" className="mt-2 h-11 w-full rounded-2xl border border-stone bg-white px-4" defaultValue="google">
          <option value="google">Google Play</option>
          <option value="apple">App Store</option>
        </select>
      </label>
      <Field name="kicker" label="Small line" />
      <Field name="label" label="Store name" />
      <Field name="href" label="Store link" optional />
      <Button type="submit" size="sm">Add store</Button>
    </form>
  );
}

function Hide({ hidden }: { hidden: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name="hidden" defaultChecked={hidden} />
      Hide on the site
    </label>
  );
}

function Field({
  name,
  label,
  defaultValue = "",
  optional = false,
  onChange,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  optional?: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="block text-sm">
      {label}
      <Input
        className="mt-2"
        name={name}
        defaultValue={defaultValue}
        required={!optional}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      />
    </label>
  );
}

function Area({ name, label, defaultValue = "" }: { name: string; label: string; defaultValue?: string }) {
  return (
    <label className="block text-sm">
      {label}
      <textarea name={name} defaultValue={defaultValue} required className="mt-2 min-h-24 w-full rounded-2xl border border-stone bg-white px-4 py-3" />
    </label>
  );
}
