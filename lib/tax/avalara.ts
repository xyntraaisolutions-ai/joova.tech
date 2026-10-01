export type AvalaraZipRate = {
  zip: string;
  state: string;
  regionName: string;
  combinedRate: number;
  stateRate: number | null;
  countyRate: number | null;
  cityRate: number | null;
  specialRate: number | null;
  riskLevel: number | null;
};

const HEADER: Record<string, keyof AvalaraZipRate | "skip"> = {
  state: "state",
  zipcode: "zip",
  zip: "zip",
  taxregionname: "regionName",
  estimatedcombinedrate: "combinedRate",
  staterate: "stateRate",
  estimatedcountyrate: "countyRate",
  estimatedcityrate: "cityRate",
  estimatedspecialrate: "specialRate",
  risklevel: "riskLevel",
};

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
      continue;
    }
    if (char === ",") {
      row.push(cell.trim());
      cell = "";
      continue;
    }
    if (char === "\n" || char === "\r") {
      if (char === "\r" && source[index + 1] === "\n") index += 1;
      row.push(cell.trim());
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }
  row.push(cell.trim());
  if (row.some((value) => value.length > 0)) rows.push(row);
  return rows;
}

function decimalRate(value: string, line: number, name: string) {
  if (!value) return null;
  const rate = Number(value);
  if (!Number.isFinite(rate) || rate < 0 || rate > 0.3) {
    throw new Error(`Line ${line}: ${name} must be an Avalara decimal such as 0.0825.`);
  }
  return rate;
}

export function parseAvalaraRates(text: string) {
  const rows = parseCsv(text);
  const header = rows[0]?.map((cell) => cell.toLowerCase().replace(/[^a-z]/g, "")) ?? [];
  const columns = header.map((name) => HEADER[name] ?? "skip");
  if (!columns.includes("zip") || !columns.includes("state") || !columns.includes("combinedRate")) {
    throw new Error("Use an Avalara free rate table CSV with State, ZipCode, and EstimatedCombinedRate.");
  }
  const byZip = new Map<string, AvalaraZipRate>();
  for (let index = 1; index < rows.length; index += 1) {
    const cells = rows[index];
    const draft: Partial<AvalaraZipRate> = {};
    columns.forEach((column, columnIndex) => {
      if (column === "skip") return;
      const value = cells[columnIndex] ?? "";
      if (column === "zip" || column === "state" || column === "regionName") {
        draft[column] = value;
        return;
      }
      if (column === "riskLevel") {
        draft.riskLevel = value ? Number(value) : null;
        return;
      }
      const rate = decimalRate(value, index + 1, column);
      if (column === "combinedRate") draft.combinedRate = rate ?? undefined;
      else draft[column] = rate;
    });
    const zip = (draft.zip ?? "").padStart(5, "0");
    const state = (draft.state ?? "").toUpperCase();
    if (!/^[0-9]{5}$/.test(zip) || !/^[A-Z]{2}$/.test(state) || draft.combinedRate === undefined) {
      throw new Error(`Line ${index + 1}: each row needs a state, a 5-digit ZIP code, and a combined rate.`);
    }
    byZip.set(zip, {
      zip,
      state,
      regionName: draft.regionName ?? "",
      combinedRate: draft.combinedRate,
      stateRate: draft.stateRate ?? null,
      countyRate: draft.countyRate ?? null,
      cityRate: draft.cityRate ?? null,
      specialRate: draft.specialRate ?? null,
      riskLevel: Number.isFinite(draft.riskLevel) ? draft.riskLevel ?? null : null,
    });
  }
  if (byZip.size === 0) throw new Error("That CSV has no tax rates.");
  return [...byZip.values()];
}

export function taxPercentLabel(percent: number) {
  const fixed = percent.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  const [whole, fraction = ""] = fixed.split(".");
  return `${whole}.${(fraction + "00").slice(0, Math.max(2, fraction.length))}%`;
}

export function percentFromRate(rate: number) {
  return Math.round(rate * 1_000_000) / 10_000;
}

export function taxAmount(taxableCents: number, rate: number) {
  return Math.round(taxableCents * rate) / 100;
}
