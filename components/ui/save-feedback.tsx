"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type FieldIssue = { name: string; detail: string };

type Notice =
  | { kind: "success"; detail: string }
  | { kind: "error"; detail?: string; fields: FieldIssue[] };

type PendingSave = { form: HTMLFormElement; submitter: HTMLElement | null };

function fieldName(element: HTMLElement) {
  const label = element.closest("label");
  if (label) {
    const copy = label.cloneNode(true) as HTMLElement;
    copy.querySelectorAll("input, textarea, select").forEach((node) => node.remove());
    const text = copy.textContent?.replace(/\s+/g, " ").trim();
    if (text) return text;
  }
  return element.getAttribute("aria-label") || element.getAttribute("name") || "This field";
}

function fieldIssues(form: HTMLFormElement) {
  const issues: FieldIssue[] = [];
  const seen = new Set<string>();
  const controls = [...form.elements].filter(
    (element): element is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement =>
      element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement,
  );
  for (const element of controls) {
    element.removeAttribute("aria-invalid");
    if (element.disabled || element.type === "hidden" || element.type === "button" || element.type === "submit" || element.type === "file") continue;
    if (element instanceof HTMLInputElement && element.type === "radio") {
      if (!element.required || seen.has(element.name)) continue;
      const group = form.elements.namedItem(element.name);
      const picked = group instanceof RadioNodeList
        ? [...group].some((node) => node instanceof HTMLInputElement && node.checked)
        : element.checked;
      seen.add(element.name);
      if (!picked) issues.push({ name: fieldName(element), detail: "Choose one option." });
      continue;
    }
    if (element instanceof HTMLInputElement && element.type === "checkbox") continue;
    const name = fieldName(element);
    const value = element.value.trim();
    if (element.required && value.length === 0) {
      issues.push({ name, detail: "This field is required." });
      element.setAttribute("aria-invalid", "true");
      continue;
    }
    if (element instanceof HTMLInputElement && element.type === "email" && value && !element.checkValidity()) {
      issues.push({ name, detail: "Enter a valid email address." });
      element.setAttribute("aria-invalid", "true");
      continue;
    }
    if (element instanceof HTMLInputElement && element.minLength > 0 && value.length > 0 && value.length < element.minLength) {
      issues.push({ name, detail: `Use at least ${element.minLength} characters.` });
      element.setAttribute("aria-invalid", "true");
    }
  }
  const password = form.elements.namedItem("password");
  const confirm = form.elements.namedItem("confirm");
  if (
    password instanceof HTMLInputElement &&
    confirm instanceof HTMLInputElement &&
    password.value &&
    confirm.value &&
    password.value !== confirm.value
  ) {
    issues.push({ name: fieldName(confirm), detail: "Enter the same password in both fields." });
    confirm.setAttribute("aria-invalid", "true");
  }
  return issues;
}

function isSaveSubmit(submitter: HTMLElement | null) {
  const label = submitter?.textContent?.replace(/\s+/g, " ").trim() ?? "";
  return /\bsave\b/i.test(label);
}

async function watchSave(run: () => void) {
  const errors: string[] = [];
  let saved = false;
  const original = window.fetch.bind(window);
  const inflight = new Set<Promise<unknown>>();
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    const promise = original(input, init).then(async (response) => {
      if (method !== "GET" && method !== "HEAD") {
        if (response.ok) saved = true;
        else {
          const data = (await response.clone().json().catch(() => null)) as { error?: string } | null;
          errors.push(data?.error || "That change could not be saved.");
        }
      }
      return response;
    });
    inflight.add(promise.finally(() => inflight.delete(promise)));
    return promise;
  }) as typeof fetch;
  try {
    run();
    for (let turn = 0; turn < 30; turn += 1) {
      if (inflight.size === 0 && turn > 0) break;
      await Promise.all([...inflight]);
      await new Promise((resolve) => window.setTimeout(resolve, 40));
    }
  } finally {
    window.fetch = original;
  }
  if (errors.length) return { kind: "error" as const, detail: errors[0], fields: [] };
  if (saved) return { kind: "success" as const, detail: "Successfully saved." };
  return null;
}

export function SaveFeedback({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pending, setPending] = useState<PendingSave | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (notice?.kind !== "success") return;
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const onSubmit = (event: Event) => {
      if ((window as Window & { __joovaSaveSkip?: boolean }).__joovaSaveSkip) return;
      const submitEvent = event as SubmitEvent;
      const submitter = submitEvent.submitter instanceof HTMLElement ? submitEvent.submitter : null;
      if (!isSaveSubmit(submitter)) return;
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || form.dataset.saveFeedback === "manual") return;
      event.preventDefault();
      event.stopPropagation();
      const issues = fieldIssues(form);
      if (issues.length) {
        setNotice({ kind: "error", fields: issues });
        const first = form.querySelector<HTMLElement>("[aria-invalid='true']");
        first?.focus();
        return;
      }
      setPending({ form, submitter });
    };
    window.addEventListener("submit", onSubmit, true);
    return () => window.removeEventListener("submit", onSubmit, true);
  }, []);

  async function confirmSave() {
    if (!pending) return;
    const { form, submitter } = pending;
    setPending(null);
    setBusy(true);
    setNotice(null);
    const result = await watchSave(() => {
      (window as Window & { __joovaSaveSkip?: boolean }).__joovaSaveSkip = true;
      form.requestSubmit(submitter instanceof HTMLButtonElement ? submitter : undefined);
      (window as Window & { __joovaSaveSkip?: boolean }).__joovaSaveSkip = false;
    });
    setBusy(false);
    if (result) setNotice(result);
  }

  return (
    <>
      {children}
      {notice ? (
        <div className="fixed inset-x-0 top-4 z-[80] flex justify-center px-4">
          <div
            role={notice.kind === "error" ? "alert" : "status"}
            className={`w-full max-w-lg rounded-3xl border border-stone bg-white p-4 shadow-lg ${notice.kind === "error" ? "text-band-red" : "text-ink"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-bold">
                {notice.kind === "success" ? "Successfully saved." : notice.fields.length ? "Check these fields." : "Could not save."}
              </p>
              <button type="button" className="min-h-11 px-2 text-sm font-bold" onClick={() => setNotice(null)}>
                Close
              </button>
            </div>
            {notice.kind === "error" && notice.detail ? <p className="mt-2 text-sm">{notice.detail}</p> : null}
            {notice.kind === "error" && notice.fields.length ? (
              <ul className="mt-2 space-y-1 text-sm">
                {notice.fields.map((field) => (
                  <li key={`${field.name}-${field.detail}`}>
                    <span className="font-bold">{field.name}.</span> {field.detail}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}
      {pending ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[var(--fixed-ink)]/45 p-4 sm:items-center">
          <div role="dialog" aria-modal="true" aria-labelledby="save-confirm-title" className="w-full max-w-md rounded-3xl bg-white p-6 text-ink shadow-lg">
            <h2 id="save-confirm-title" className="font-display text-2xl">Save these changes?</h2>
            <p className="mt-2 text-sm text-muted">Confirm to save. You can go back and keep editing.</p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setPending(null)}>
                Go back
              </Button>
              <Button type="button" disabled={busy} onClick={() => void confirmSave()}>
                {busy ? "Saving" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
