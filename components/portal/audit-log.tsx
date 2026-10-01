"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Change = { field: string; from: string; to: string };
type AuditRow = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  reason: string | null;
  viewAs: string | null;
  createdAt: string;
  actor: string;
  email: string;
  changes: Change[];
  more: boolean;
};
type ActorOption = { id: string; label: string };
type Filters = {
  entity: string;
  action: string;
  actor: string;
  from: string;
  to: string;
  keyword: string;
};

const actionLabel: Record<string, string> = {
  insert: "Insert",
  update: "Update",
  delete: "Delete",
};

const emptyFilters: Filters = { entity: "", action: "", actor: "", from: "", to: "", keyword: "" };

function label(value: string) {
  return actionLabel[value] ?? value.replaceAll("_", " ");
}

function dayStart(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return "";
  return new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
}

function dayEnd(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return "";
  return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
}

function withCurrent(options: string[], current: string) {
  return current && !options.includes(current) ? [current, ...options] : options;
}

export function AuditLog({ onTotal }: { onTotal?: (total: number) => void }) {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [entities, setEntities] = useState<string[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [actors, setActors] = useState<ActorOption[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState("");

  async function load(nextPage = page, nextFilters = filters) {
    if (nextFilters.from && nextFilters.to && nextFilters.from > nextFilters.to) {
      setError("The start date has to be on or before the end date.");
      return;
    }
    const params = new URLSearchParams({ page: String(nextPage) });
    if (nextFilters.entity) params.set("entity", nextFilters.entity);
    if (nextFilters.action) params.set("action", nextFilters.action);
    if (nextFilters.actor) params.set("actor", nextFilters.actor);
    if (nextFilters.from) params.set("from", dayStart(nextFilters.from));
    if (nextFilters.to) params.set("to", dayEnd(nextFilters.to));
    if (nextFilters.keyword.trim()) params.set("keyword", nextFilters.keyword.trim());
    const response = await fetch(`/api/portal/audit?${params.toString()}`);
    const data = (await response.json()) as {
      rows?: AuditRow[];
      pages?: number;
      pageSize?: number;
      total?: number;
      entities?: string[];
      actions?: string[];
      actors?: ActorOption[];
      error?: string;
    };
    if (!response.ok) {
      setError(data.error ?? "The audit log could not be loaded.");
      return;
    }
    const nextPages = data.pages ?? 1;
    if (nextPage > nextPages) {
      setPage(nextPages);
      void load(nextPages, nextFilters);
      return;
    }
    setRows(data.rows ?? []);
    setPages(nextPages);
    setPageSize(data.pageSize && data.pageSize > 0 ? data.pageSize : 10);
    const nextTotal = data.total ?? 0;
    setTotal(nextTotal);
    onTotal?.(nextTotal);
    setEntities(data.entities ?? []);
    setActions(data.actions ?? []);
    setActors(data.actors ?? []);
    setError("");
  }

  useEffect(() => {
    void load(1, emptyFilters);
  }, []);

  function setFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <section>
      <h2 className="font-display text-2xl">Audit</h2>
      <p className="mt-2 text-sm text-muted">
        Inserts, updates, and deletes across the platform, with who made the change, when, the reason when one was given, and the value before and after.
      </p>
      {error ? <p className="mt-3 text-sm text-band-red" role="alert">{error}</p> : null}
      <form
        className="mt-4 grid gap-4 md:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          void load(1, filters);
        }}
      >
        <label className="text-sm">
          Entity
          <select className="mt-2 h-12 w-full rounded-2xl border border-stone bg-white px-4" value={filters.entity} onChange={(event) => setFilter("entity", event.target.value)}>
            <option value="">Any entity</option>
            {withCurrent(entities, filters.entity).map((entity) => (
              <option key={entity} value={entity}>{entity}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Action
          <select className="mt-2 h-12 w-full rounded-2xl border border-stone bg-white px-4" value={filters.action} onChange={(event) => setFilter("action", event.target.value)}>
            <option value="">Any action</option>
            {withCurrent(actions, filters.action).map((action) => (
              <option key={action} value={action}>{label(action)}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Person
          <select className="mt-2 h-12 w-full rounded-2xl border border-stone bg-white px-4" value={filters.actor} onChange={(event) => setFilter("actor", event.target.value)}>
            <option value="">Anyone</option>
            {actors.some((actor) => actor.id === filters.actor) || !filters.actor ? null : <option value={filters.actor}>{filters.actor}</option>}
            {actors.map((actor) => (
              <option key={actor.id} value={actor.id}>{actor.label || "System"}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          From date
          <Input className="mt-2" type="date" value={filters.from} onChange={(event) => setFilter("from", event.target.value)} />
        </label>
        <label className="text-sm">
          To date
          <Input className="mt-2" type="date" value={filters.to} onChange={(event) => setFilter("to", event.target.value)} />
        </label>
        <label className="text-sm">
          Keyword
          <Input className="mt-2" value={filters.keyword} onChange={(event) => setFilter("keyword", event.target.value)} placeholder="Name, id, reason, or value" />
        </label>
        <div className="md:col-span-3">
          <Button type="submit" size="sm">Show</Button>
          <p className="mt-2 text-xs text-muted">From and To open a calendar. Use one date, or both, for a range. Lists follow the page size in Settings.</p>
        </div>
      </form>
      <ul className="mt-4 space-y-3">
        {rows.map((row) => (
          <li key={row.id} className="rounded-3xl bg-white p-4 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold">
                  {label(row.action)} · {row.entity}
                  {row.entityId ? ` · ${row.entityId}` : ""}
                </p>
                <p className="mt-1 text-muted">
                  {row.actor}
                  {row.email ? ` · ${row.email}` : ""}
                  {" · "}
                  {row.createdAt ? new Date(row.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : ""}
                  {row.viewAs ? ` · viewing as ${row.viewAs}` : ""}
                </p>
              </div>
              <Button type="button" size="sm" variant="secondary" onClick={() => setDeleting(deleting === row.id ? "" : row.id)}>
                Delete
              </Button>
            </div>
            {row.reason ? <p className="mt-2">Reason: {row.reason}</p> : null}
            {row.changes.length ? (
              <ul className="mt-3 space-y-1">
                {row.changes.map((change) => (
                  <li key={change.field}>
                    <span className="font-bold">{change.field}</span>
                    {change.from ? ` from ${change.from}` : ""}
                    {change.to ? ` to ${change.to}` : ""}
                  </li>
                ))}
                {row.more ? <li className="text-muted">More fields changed on this record.</li> : null}
              </ul>
            ) : null}
            {deleting === row.id ? (
              <AuditDelete
                id={row.id}
                onDone={() => {
                  setDeleting("");
                  void load(page, filters);
                }}
              />
            ) : null}
          </li>
        ))}
      </ul>
      {rows.length === 0 ? <p className="mt-4 text-sm text-muted">No audit rows for that filter.</p> : null}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-muted">{total} entries · {pageSize} per page</p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={page <= 1}
            onClick={() => {
              const next = page - 1;
              setPage(next);
              void load(next, filters);
            }}
          >
            Previous
          </Button>
          <span>Page {page} of {pages}</span>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={page >= pages}
            onClick={() => {
              const next = page + 1;
              setPage(next);
              void load(next, filters);
            }}
          >
            Next
          </Button>
        </div>
      </div>
    </section>
  );
}

function AuditDelete({ id, onDone }: { id: string; onDone: () => void }) {
  const [confirm, setConfirm] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const ready = confirm === "PERMANENT DELETE" && reason.trim().length > 0;

  async function submit() {
    setError("");
    setPending(true);
    const response = await fetch("/api/portal/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, confirm, reason }),
    });
    const data = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      setError(data.error ?? "That audit entry could not be deleted.");
      return;
    }
    onDone();
  }

  return (
    <div className="mt-4 rounded-2xl border border-stone p-3">
      <p className="text-sm font-bold">Permanent delete</p>
      <p className="mt-1 text-sm text-muted">Give a reason, then type PERMANENT DELETE. This audit entry is erased.</p>
      <label className="mt-3 block text-sm">
        Reason
        <textarea
          className="mt-2 min-h-20 w-full rounded-2xl border border-stone bg-white px-4 py-3"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          required
        />
      </label>
      <label className="mt-3 block text-sm">
        Confirmation
        <Input className="mt-2" value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="off" />
      </label>
      {error ? <p className="mt-2 text-sm text-band-red" role="alert">{error}</p> : null}
      <Button className="mt-3" type="button" size="sm" variant="secondary" disabled={pending || !ready} onClick={() => void submit()}>
        Delete permanently
      </Button>
    </div>
  );
}
