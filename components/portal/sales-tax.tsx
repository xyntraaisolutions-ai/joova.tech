"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import { Button, buttonClassName } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Country = { code: string; name: string; currency: string };
type Rate = { country_code: string; rate_percent: number; updated_at: string };
type ImportRow = { id: string; filename: string; uploaded_at: string; row_count: number; state_codes: string };
type StoredFile = { name: string; updatedAt: string };
type ChosenUpload = { files: File[]; label: string };
type FileStatus = "waiting" | "copying" | "done" | "error";
type UploadJob = {
  label: string;
  files: { name: string; status: FileStatus }[];
  index: number;
  total: number;
  percent: number;
  phase: "copy" | "update" | "done" | "error";
  kind: "upload" | "refresh";
  error: string;
};
type ZipRate = {
  zip: string;
  state: string;
  regionName: string;
  combined: string;
  stateRate: string;
  countyRate: string;
  cityRate: string;
  specialRate: string;
};

const AVALARA_TABLES = "https://www.avalara.com/taxrates/en/download-tax-tables.html";

function when(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Chicago" }).format(date);
}

export function SalesTax({ onError }: { onError: (message: string) => void }) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [rates, setRates] = useState<Record<string, string>>({});
  const [imports, setImports] = useState<ImportRow[]>([]);
  const [zipCount, setZipCount] = useState(0);
  const [storedFolder, setStoredFolder] = useState("");
  const [storedFiles, setStoredFiles] = useState<StoredFile[]>([]);
  const [ratesUpdatedAt, setRatesUpdatedAt] = useState("");
  const [filesOpen, setFilesOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);
  const [chosen, setChosen] = useState<ChosenUpload | null>(null);
  const [job, setJob] = useState<UploadJob | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [zipQuery, setZipQuery] = useState("");
  const [zipRate, setZipRate] = useState<ZipRate | null>(null);
  const [zipNote, setZipNote] = useState("");
  const [zipPending, setZipPending] = useState(false);
  const cancelUpload = useRef(false);
  const folderInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  async function load() {
    const response = await fetch("/api/portal/tax");
    const data = (await response.json()) as {
      countries?: Country[];
      rates?: Rate[];
      imports?: ImportRow[];
      zipCount?: number;
      storedFolder?: string;
      storedFiles?: StoredFile[];
      ratesUpdatedAt?: string | null;
      error?: string;
    };
    if (!response.ok) {
      onError(data.error ?? "Sales tax could not be loaded.");
      setReady(true);
      return;
    }
    const next: Record<string, string> = {};
    for (const rate of data.rates ?? []) next[rate.country_code] = String(Number(rate.rate_percent));
    setCountries(data.countries ?? []);
    setRates(next);
    setImports(data.imports ?? []);
    setZipCount(data.zipCount ?? 0);
    setStoredFolder(data.storedFolder ?? "");
    setStoredFiles(data.storedFiles ?? []);
    setRatesUpdatedAt(data.ratesUpdatedAt ?? "");
    setReady(true);
  }

  useEffect(() => {
    void load();
    folderInput.current?.setAttribute("webkitdirectory", "");
    folderInput.current?.setAttribute("directory", "");
  }, []);

  async function showZip(event: FormEvent) {
    event.preventDefault();
    setZipNote("");
    setZipRate(null);
    setZipPending(true);
    const response = await fetch("/api/portal/tax", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "lookup", zip: zipQuery }),
    });
    const data = (await response.json()) as ZipRate & { error?: string };
    setZipPending(false);
    if (!response.ok) {
      setZipNote(data.error ?? "That ZIP code could not be looked up.");
      return;
    }
    setZipRate(data);
  }

  async function saveRate(code: string) {
    const ratePercent = Number(rates[code]);
    if (!Number.isFinite(ratePercent)) {
      onError("Enter a sales tax percent from 0 to 100.");
      return;
    }
    onError("");
    setPending(true);
    const response = await fetch("/api/portal/tax", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: code, ratePercent }),
    });
    const data = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      onError(data.error ?? "That tax rate could not be saved.");
      return;
    }
    await load();
  }

  function queueUpload(list: File[], folderName: string) {
    const files = list.filter((file) => file.name.toLowerCase().endsWith(".csv"));
    files.sort((a, b) => a.name.localeCompare(b.name));
    if (!files.length) {
      setNotice(folderName ? `${folderName} has no CSV files. Choose the folder that holds the state rate tables.` : "Choose an Avalara CSV file.");
      return;
    }
    setNotice("");
    onError("");
    setChosen({ files, label: folderName || (files.length === 1 ? files[0].name : `${files.length} CSV files`) });
  }

  async function chooseFolder() {
    setNotice("");
    const picker = (window as Window & { showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker;
    if (!picker) {
      folderInput.current?.click();
      return;
    }
    try {
      const directory = await picker();
      queueUpload(await csvFilesInDirectory(directory), directory.name);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setNotice("That folder could not be opened.");
    }
  }

  async function dropFolder(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    const entries = [...event.dataTransfer.items].map((item) => item.webkitGetAsEntry?.() ?? null).filter((entry): entry is FileSystemEntry => Boolean(entry));
    const files: File[] = [];
    let folderName = "";
    for (const entry of entries) {
      if (entry.isDirectory) {
        folderName = folderName || entry.name;
        files.push(...await csvFilesFromEntry(entry));
      } else if (entry.isFile && entry.name.toLowerCase().endsWith(".csv")) {
        const file = await fileFromEntry(entry);
        if (file) files.push(file);
      }
    }
    queueUpload(files, folderName);
  }

  async function beginUpload() {
    if (!chosen) return;
    const files = chosen.files;
    const label = chosen.label;
    cancelUpload.current = false;
    setChosen(null);
    setPending(true);
    setJob({
      label,
      files: files.map((file) => ({ name: file.name, status: "waiting" })),
      index: 0,
      total: files.length,
      percent: 0,
      phase: "copy",
      kind: "upload",
      error: "",
    });
    const started = await fetch("/api/portal/tax", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", label }),
    });
    const startBody = (await started.json()) as { importId?: string; error?: string };
    if (!started.ok || !startBody.importId) {
      setPending(false);
      setJob((current) => current && { ...current, phase: "error", error: startBody.error ?? "The upload could not be started." });
      return;
    }
    const importId = startBody.importId;
    const steps = files.length + 1;
    for (let index = 0; index < files.length; index += 1) {
      if (cancelUpload.current) {
        await fetch("/api/portal/tax", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "discard", importId }),
        });
        setPending(false);
        setJob((current) => current && { ...current, phase: "error", error: "Upload cancelled. The previous rate files are unchanged." });
        return;
      }
      const file = files[index];
      setJob((current) => current && {
        ...current,
        index: index + 1,
        percent: Math.round((index / steps) * 100),
        phase: "copy",
        files: current.files.map((item, itemIndex) => ({ ...item, status: itemIndex === index ? "copying" : item.status })),
      });
      const body = new FormData();
      body.set("importId", importId);
      body.set("file", file, file.name);
      const response = await fetch("/api/portal/tax", { method: "POST", body });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        await fetch("/api/portal/tax", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "discard", importId }),
        });
        setPending(false);
        setJob((current) => current && {
          ...current,
          phase: "error",
          error: data.error ?? `${file.name} could not be copied.`,
          files: current.files.map((item, itemIndex) => ({ ...item, status: itemIndex === index ? "error" : item.status })),
        });
        return;
      }
      setJob((current) => current && {
        ...current,
        percent: Math.round(((index + 1) / steps) * 100),
        files: current.files.map((item, itemIndex) => ({ ...item, status: itemIndex === index ? "done" : item.status })),
      });
    }
    if (cancelUpload.current) {
      await fetch("/api/portal/tax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "discard", importId }),
      });
      setPending(false);
      setJob((current) => current && { ...current, phase: "error", error: "Upload cancelled. The previous rate files are unchanged." });
      return;
    }
    setJob((current) => current && { ...current, phase: "update", percent: Math.round((files.length / steps) * 100) });
    const finished = await fetch("/api/portal/tax", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "finish", importId }),
    });
    const finishBody = (await finished.json()) as { error?: string };
    setPending(false);
    if (!finished.ok) {
      setJob((current) => current && { ...current, phase: "error", error: finishBody.error ?? "The tax rate table could not be updated." });
      return;
    }
    setJob((current) => current && { ...current, phase: "done", percent: 100 });
    await load();
  }

  async function refreshRates() {
    onError("");
    setRefreshing(true);
    setPending(true);
    setJob({ label: storedFolder || "Latest CSV files", files: storedFiles.map((file) => ({ name: file.name, status: "waiting" })), index: storedFiles.length, total: storedFiles.length, percent: 40, phase: "update", kind: "refresh", error: "" });
    const response = await fetch("/api/portal/tax", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "refresh" }),
    });
    const data = (await response.json()) as { error?: string };
    setPending(false);
    setRefreshing(false);
    if (!response.ok) {
      setJob((current) => current && { ...current, phase: "error", error: data.error ?? "Tax rates could not be refreshed." });
      return;
    }
    setJob((current) => current && {
      ...current,
      phase: "done",
      percent: 100,
      files: current.files.map((file) => ({ ...file, status: "done" })),
    });
    await load();
  }

  const latest = imports[0];
  const others = countries.filter((country) => country.code !== "US");

  return (
    <div>
      <h3 className="font-display text-xl">Sales tax</h3>
      <p className="mt-2 text-sm text-muted">
        Checkout looks up United States tax from the delivery ZIP code. Save a percent for each other country. Shipping and payment stay in the United States and US dollars.
      </p>
      <div className="mt-4 rounded-3xl border border-stone p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold">United States</p>
            <p className="mt-2 max-w-xl text-sm text-muted">
              Upload the Avalara CSV folder for every state. A new upload replaces the stored files, then writes those rates into the United States tax table.
            </p>
          </div>
          <a className="text-sm font-bold underline" href={AVALARA_TABLES} target="_blank" rel="noreferrer">
            Get Avalara rate tables
          </a>
        </div>
        <form className="mt-5 flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); void saveRate("US"); }}>
          <label className="text-sm">
            Default rate if the ZIP code is not found
            <Input
              className="mt-2 w-36"
              inputMode="decimal"
              value={rates.US ?? "8.25"}
              onChange={(event) => setRates((current) => ({ ...current, US: event.target.value }))}
            />
          </label>
          <Button type="submit" size="sm" disabled={pending}>Save</Button>
          <p className="w-full text-sm text-muted">Checkout uses this percent only when the delivery ZIP is not in the uploaded table. It is 8.25% until you change it.</p>
        </form>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-ink/5 px-4 py-3">
            <p className="text-xs text-muted">Tax data last updated</p>
            <p className="mt-1 text-sm font-bold">{ratesUpdatedAt ? when(ratesUpdatedAt) : "Not updated yet"}</p>
          </div>
          <div className="rounded-2xl bg-ink/5 px-4 py-3">
            <p className="text-xs text-muted">ZIP codes</p>
            <p className="mt-1 text-sm font-bold">{ready ? zipCount.toLocaleString("en-US") : "…"}</p>
          </div>
          <div className="rounded-2xl bg-ink/5 px-4 py-3">
            <p className="text-xs text-muted">Stored CSV files</p>
            <p className="mt-1 text-sm font-bold">{ready ? storedFiles.length.toLocaleString("en-US") : "…"}</p>
            {storedFolder ? <p className="mt-1 truncate text-xs text-muted">{storedFolder}</p> : null}
          </div>
        </div>
        <div
          className={`mt-5 rounded-2xl border border-dashed px-4 py-4 ${dragging ? "border-coral bg-coral/10" : "border-stone"}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => void dropFolder(event)}
        >
          <p className="text-sm">Drop the Avalara folder here, or choose it below. Every CSV in that folder is uploaded.</p>
          <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" size="sm" disabled={pending} onClick={() => void chooseFolder()}>
            Upload CSV folder
          </Button>
          <input
            ref={folderInput}
            className="sr-only"
            type="file"
            accept=".csv,text/csv"
            multiple
            tabIndex={-1}
            onChange={(event) => {
              const picked = [...(event.target.files ?? [])];
              event.target.value = "";
              const folderName = picked[0]?.webkitRelativePath.split("/").filter(Boolean)[0] ?? "";
              queueUpload(picked, folderName);
            }}
          />
          <label className={buttonClassName("secondary", "sm", pending ? "pointer-events-none opacity-50" : "cursor-pointer")}>
            Upload one CSV
            <input
              className="sr-only"
              type="file"
              accept=".csv,text/csv"
              disabled={pending}
              onChange={(event) => {
                const picked = [...(event.target.files ?? [])];
                event.target.value = "";
                queueUpload(picked, "");
              }}
            />
          </label>
          <Button type="button" size="sm" variant="secondary" onClick={() => setFilesOpen(true)}>
            View CSV files
          </Button>
          <Button type="button" size="sm" variant="secondary" disabled={pending || storedFiles.length === 0} onClick={() => void refreshRates()}>
            {refreshing ? "Refreshing tax data" : "Refresh tax data"}
          </Button>
          </div>
        </div>
        {notice ? <p className="mt-3 text-sm" role="alert">{notice}</p> : null}
        {!ready ? <p className="mt-3 text-sm text-muted">Loading tax rates.</p> : null}
        {latest ? (
          <p className="mt-3 text-sm text-muted">
            Files uploaded {when(latest.uploaded_at)}
            {latest.state_codes ? ` · ${latest.state_codes}` : ""}
            {` · ${latest.row_count.toLocaleString("en-US")} ZIP rows written to the tax table`}
          </p>
        ) : ready ? <p className="mt-3 text-sm text-muted">No Avalara file has been uploaded yet.</p> : null}
        <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={(event) => void showZip(event)}>
          <label className="text-sm">
            Look up a ZIP code
            <Input
              className="mt-2 w-40"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="00601"
              value={zipQuery}
              onChange={(event) => setZipQuery(event.target.value)}
            />
          </label>
          <Button type="submit" size="sm" variant="secondary" disabled={zipPending || zipQuery.trim().length < 5}>
            {zipPending ? "Looking up" : "Show tax rate"}
          </Button>
        </form>
        {zipNote ? <p className="mt-3 text-sm" role="alert">{zipNote}</p> : null}
        {zipRate ? (
          <div className="mt-3 rounded-2xl border border-stone p-4 text-sm">
            <p className="font-bold">{zipRate.zip} · {zipRate.state} · {zipRate.regionName}</p>
            <p className="mt-2">Combined rate {zipRate.combined}</p>
            <p className="mt-1 text-muted">
              State {zipRate.stateRate || "0.00%"} · County {zipRate.countyRate || "0.00%"} · City {zipRate.cityRate || "0.00%"} · Special {zipRate.specialRate || "0.00%"}
            </p>
          </div>
        ) : null}
      </div>
      <ul className="mt-4 space-y-3">
        {others.map((country) => (
          <li key={country.code} className="flex flex-wrap items-end gap-3">
            <label className="text-sm">
              {country.name} sales tax %
              <Input
                className="mt-2 w-36"
                inputMode="decimal"
                value={rates[country.code] ?? ""}
                onChange={(event) => setRates((current) => ({ ...current, [country.code]: event.target.value }))}
              />
            </label>
            <Button type="button" size="sm" disabled={pending} onClick={() => void saveRate(country.code)}>
              Save
            </Button>
          </li>
        ))}
      </ul>
      <Dialog.Root open={filesOpen} onOpenChange={setFilesOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/70" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[min(36rem,calc(100%-2rem))] w-[min(36rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col rounded-3xl bg-white p-6 text-ink">
            <Dialog.Title className="font-display text-xl">Stored CSV files</Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted">
              {storedFiles.length
                ? `${storedFiles.length.toLocaleString("en-US")} files${storedFolder ? ` in ${storedFolder}` : ""}. Tax data last updated ${ratesUpdatedAt ? when(ratesUpdatedAt) : "not yet"}.`
                : "No CSV files are stored yet. Upload a folder to add them."}
            </Dialog.Description>
            {storedFiles.length ? (
              <ul className="mt-4 min-h-0 flex-1 space-y-2 overflow-auto">
                {storedFiles.map((file) => (
                  <li key={file.name} className="flex items-center justify-between gap-3 rounded-2xl border border-stone px-3 py-2 text-sm">
                    <span className="min-w-0 truncate font-medium">{file.name}</span>
                    <span className="shrink-0 text-muted">{file.updatedAt ? when(file.updatedAt) : ""}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-4">
              <Dialog.Close className={buttonClassName("secondary", "sm")}>Close</Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root open={Boolean(chosen)} onOpenChange={(open) => { if (!open) setChosen(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/70" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(32rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 text-ink">
            <Dialog.Title className="font-display text-xl">Replace the stored CSV files?</Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted">
              {storedFiles.length
                ? `Upload ${chosen?.label}? This removes the ${storedFiles.length.toLocaleString("en-US")} CSV file${storedFiles.length === 1 ? "" : "s"} already stored and replaces them. The United States tax table is then rewritten from the new files.`
                : `Upload ${chosen?.label}? These files become the stored rate folder, and the United States tax table is filled from them.`}
            </Dialog.Description>
            <p className="mt-3 text-sm">{chosen?.files.length.toLocaleString("en-US")} CSV file{chosen?.files.length === 1 ? "" : "s"} will be uploaded to the tax-rates store.</p>
            <ul className="mt-3 max-h-64 space-y-1 overflow-auto text-sm text-muted">
              {chosen?.files.map((file) => <li key={file.name}>{file.name}</li>)}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Dialog.Close className={buttonClassName("secondary", "sm")}>Cancel</Dialog.Close>
              <Button type="button" size="sm" onClick={() => void beginUpload()}>Upload</Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root open={Boolean(job)} onOpenChange={(open) => { if (!open && job && (job.phase === "done" || job.phase === "error")) setJob(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/70" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-50 w-[min(36rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 text-ink"
            onPointerDownOutside={(event) => { if (job && job.phase !== "done" && job.phase !== "error") event.preventDefault(); }}
            onEscapeKeyDown={(event) => { if (job && job.phase !== "done" && job.phase !== "error") event.preventDefault(); }}
          >
            <Dialog.Title className="font-display text-xl">
              {job?.phase === "done" ? "Tax data updated" : job?.phase === "error" ? "Upload stopped" : job?.kind === "refresh" ? "Refreshing tax data" : "Uploading rate files"}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted">
              {job?.phase === "update"
                ? "Reading the stored CSV files and writing the United States tax table."
                : job?.phase === "done"
                  ? job.kind === "refresh"
                    ? "The United States tax table now matches the stored CSV files."
                    : "The previous CSV files were replaced. The United States tax table matches these files."
                  : job?.phase === "error"
                    ? job.error
                    : `Uploading ${job?.files[Math.max(0, (job?.index ?? 1) - 1)]?.name ?? "files"}.`}
            </Dialog.Description>
            <div className="mt-4" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={job?.percent ?? 0} aria-label="Upload progress">
              <div className="flex items-center justify-between text-sm">
                <span>{job?.phase === "update" ? "Updating rates" : job?.index ? `File ${job.index} of ${job.total}` : "Starting"}</span>
                <span className="font-bold">{job?.percent ?? 0}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone">
                <div className="h-full bg-ink" style={{ width: `${job?.percent ?? 0}%` }} />
              </div>
            </div>
            <ul className="mt-4 max-h-64 space-y-1 overflow-auto text-sm">
              {job?.files.map((file) => (
                <li key={file.name} className={file.status === "copying" ? "font-bold" : "text-muted"}>
                  {file.status === "done" ? "Uploaded" : file.status === "copying" ? "Uploading" : file.status === "error" ? "Failed" : "Waiting"} · {file.name}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              {job && (job.phase === "done" || job.phase === "error") ? (
                <Button type="button" size="sm" onClick={() => setJob(null)}>Close</Button>
              ) : (
                <Button type="button" size="sm" variant="secondary" disabled={job?.phase === "update"} onClick={() => { cancelUpload.current = true; }}>
                  Cancel
                </Button>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

async function csvFilesInDirectory(directory: FileSystemDirectoryHandle): Promise<File[]> {
  const files: File[] = [];
  for await (const handle of directory.values()) {
    if (handle.kind === "file") {
      if (!handle.name.toLowerCase().endsWith(".csv")) continue;
      files.push(await handle.getFile());
    } else {
      files.push(...await csvFilesInDirectory(handle));
    }
  }
  return files;
}

function fileFromEntry(entry: FileSystemEntry) {
  return new Promise<File | null>((resolve) => {
    if (!entry.isFile) {
      resolve(null);
      return;
    }
    (entry as FileSystemFileEntry).file((file) => resolve(file), () => resolve(null));
  });
}

async function csvFilesFromEntry(entry: FileSystemEntry): Promise<File[]> {
  if (entry.isFile) {
    const file = await fileFromEntry(entry);
    return file && file.name.toLowerCase().endsWith(".csv") ? [file] : [];
  }
  if (!entry.isDirectory) return [];
  const reader = (entry as FileSystemDirectoryEntry).createReader();
  const children: FileSystemEntry[] = [];
  for (;;) {
    const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => {
      reader.readEntries((entries) => resolve([...entries]), () => reject(new Error("That folder could not be read.")));
    });
    if (!batch.length) break;
    children.push(...batch);
  }
  const files: File[] = [];
  for (const child of children) files.push(...await csvFilesFromEntry(child));
  return files;
}
