const PREFIX = "SKU";

function skuBody(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^A-Z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .replace(/^SKU-?/, "");
}

export function skuFromModel(model: string) {
  const body = skuBody(model);
  if (!body) return "";
  return `${PREFIX}${body}`.slice(0, 40);
}

export function skuFromVariant(productSku: string, color: string) {
  const body = skuBody(productSku);
  const tone = color.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!body || !tone) return "";
  return `${PREFIX}${body}${tone}`.slice(0, 40);
}

function firstWord(value: string) {
  const word = value.trim().split(/[\s/_-]+/).find(Boolean) ?? "";
  return word.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function choiceNamePart(value: string) {
  const sides = value.split("&").map((side) => side.trim()).filter(Boolean);
  if (sides.length > 1) {
    const initials = sides.map((side) => firstWord(side).charAt(0)).join("");
    if (initials.length === sides.length) return initials;
  }
  return firstWord(value);
}

export function skuFromChoice(parentSku: string, choiceType: string, choiceName: string) {
  const parent = parentSku.trim().toUpperCase().replace(/\s+/g, "").replace(/-+$/, "");
  const typeWord = firstWord(choiceType);
  const nameWord = choiceNamePart(choiceName);
  if (!parent || !typeWord || !nameWord) return "";
  return `${parent}-${typeWord}-${nameWord}`.slice(0, 40);
}

export function uniqueSku(base: string, taken: Iterable<string>) {
  const used = new Set([...taken].map((item) => item.trim().toUpperCase()).filter(Boolean));
  const root = base.trim().toUpperCase().slice(0, 40);
  if (!root) return "";
  if (!used.has(root)) return root;
  for (let number = 1; number < 1000; number += 1) {
    const suffix = String(number);
    const next = `${root.slice(0, Math.max(0, 40 - suffix.length))}${suffix}`;
    if (next && !used.has(next)) return next;
  }
  return "";
}
