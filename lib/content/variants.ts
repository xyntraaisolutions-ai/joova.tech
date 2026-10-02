type Loose = Record<string, unknown>;

export const optionAxes = ["color", "type", "size", "custom"] as const;
export type OptionAxis = (typeof optionAxes)[number];

export const optionAxisLabel: Record<OptionAxis, string> = {
  color: "Color",
  type: "Type",
  size: "Size",
  custom: "Custom",
};

export type GalleryPicture = { src: string; alt: string; width: number; height: number };
export type GalleryClip = { src: string; title: string; poster: string };

export type StoreVariant = {
  id: string;
  axis: OptionAxis;
  name: string;
  available: boolean;
  isDefault: boolean;
  pictures: GalleryPicture[];
  videos: GalleryClip[];
  sku: string;
  color: string;
  type: string;
  size: string;
  custom: string;
  labels: Partial<Record<OptionAxis, string>>;
};

export type PurchaseSelection = {
  color?: string;
  type?: string;
  size?: string;
  custom?: string;
  sku?: string;
  labels?: Partial<Record<OptionAxis, string>>;
};

function text(attrs: Loose, key: string) {
  const value = attrs[key];
  return typeof value === "string" ? value.trim() : "";
}

export function variantLabel(attrs: Loose) {
  const named = optionName(attrs);
  if (named) return named;
  const custom = text(attrs, "customName");
  if (custom) return custom;
  const parts = [text(attrs, "color"), text(attrs, "type"), text(attrs, "size")].filter(Boolean);
  if (parts.length) return parts.join(" · ");
  return text(attrs, "name");
}

export function optionAxis(attrs: Loose): OptionAxis {
  const axis = text(attrs, "axis");
  if (axis === "color" || axis === "type" || axis === "size" || axis === "custom") return axis;
  if (text(attrs, "customName")) return "custom";
  if (text(attrs, "type") && !text(attrs, "color") && !text(attrs, "size")) return "type";
  if (text(attrs, "size") && !text(attrs, "color") && !text(attrs, "type")) return "size";
  return "color";
}

export function optionName(attrs: Loose) {
  const axis = optionAxis(attrs);
  if (axis === "custom") return text(attrs, "name") || text(attrs, "customName");
  return text(attrs, "name") || text(attrs, axis) || text(attrs, "color");
}

export function optionAvailable(attrs: Loose) {
  return attrs.available !== false && attrs.available !== "false";
}

export function optionDimensions(attrs: Loose) {
  const style = text(attrs, "style");
  const typed = text(attrs, "type");
  const sized = text(attrs, "size");
  const custom = text(attrs, "customName");
  const axis = text(attrs, "axis");
  const named = text(attrs, "name");
  const single = (axis === "color" || axis === "type" || axis === "size" || axis === "custom") && !style && !typed && !sized && !custom;
  if (single) {
    return {
      color: axis === "color" ? named : "",
      type: axis === "type" ? named : "",
      size: axis === "size" ? named : "",
      custom: axis === "custom" ? named : "",
    };
  }
  return {
    color: text(attrs, "finish") || text(attrs, "color") || named,
    type: style || typed,
    size: sized,
    custom,
  };
}

export function purchaseDetails(selection?: PurchaseSelection | null, color?: string) {
  const rows: { label: string; value: string }[] = [];
  const labels = selection?.labels;
  const colorName = selection?.color || color || "";
  if (colorName) rows.push({ label: labels?.color || "Color", value: colorName });
  if (selection?.type) rows.push({ label: labels?.type || "Type", value: selection.type });
  if (selection?.size) rows.push({ label: labels?.size || "Size", value: selection.size });
  if (selection?.custom) rows.push({ label: labels?.custom || "Custom", value: selection.custom });
  if (selection?.sku) rows.push({ label: "SKU", value: selection.sku });
  return rows;
}

export function purchaseText(selection?: PurchaseSelection | null, color?: string) {
  return purchaseDetails(selection, color).map((row) => `${row.label} ${row.value}`).join(" · ");
}

export function cartLineId(productId: string, selection: PurchaseSelection) {
  return [productId, selection.color ?? "", selection.type ?? "", selection.size ?? "", selection.custom ?? ""].join("|");
}

function picture(row: Loose): GalleryPicture | null {
  const src = typeof row.src === "string" ? row.src : "";
  if (!src || row.deleted_at != null || row.enabled === false) return null;
  return {
    src,
    alt: typeof row.alt === "string" ? row.alt : "",
    width: Number(row.width) || 1600,
    height: Number(row.height) || 1600,
  };
}

function clip(row: Loose): GalleryClip | null {
  if (row.deleted_at != null || row.published === false) return null;
  const src = typeof row.src === "string" ? row.src : "";
  if (!src) return null;
  return {
    src,
    title: typeof row.title === "string" && row.title ? row.title : "Video",
    poster: typeof row.poster === "string" ? row.poster : "",
  };
}

function bySort(left: Loose, right: Loose) {
  const focus = Number(right.focused === true) - Number(left.focused === true);
  if (focus) return focus;
  return Number(left.sort ?? 0) - Number(right.sort ?? 0);
}

export function arrangeProductMedia(variants: Loose[], images: Loose[], videos: Loose[] = []) {
  const liveVariants = variants
    .filter((row) => row.deleted_at == null)
    .sort((left, right) => Number(left.sort ?? 0) - Number(right.sort ?? 0));
  const liveImages = images.filter((row) => picture(row));
  const liveVideos = videos.filter((row) => clip(row));
  const rowsFor = (id: string, rows: Loose[]) => rows.filter((row) => row.variant_id === id).sort(bySort);
  const claimed = new Set<string>();
  const sharedVideos = liveVideos.filter((row) => !row.variant_id).sort(bySort).map((row) => clip(row)!);
  const views: StoreVariant[] = liveVariants.flatMap((row) => {
    const attrs = row.attrs && typeof row.attrs === "object" ? (row.attrs as Loose) : {};
    const dimensions = optionDimensions(attrs);
    const name = [dimensions.color, dimensions.type, dimensions.size, dimensions.custom].filter(Boolean).join(" · ") || optionName(attrs) || variantLabel(attrs);
    const id = String(row.id ?? "");
    if (!name || !id) return [];
    const own = rowsFor(id, liveImages).map((item) => picture(item)!);
    const linked = text(attrs, "image");
    const match = linked ? liveImages.find((item) => item.src === linked && !item.variant_id) : undefined;
    const linkedPicture = match ? picture(match) : null;
    if (linkedPicture) claimed.add(linkedPicture.src);
    const pictures = linkedPicture && !own.some((item) => item.src === linkedPicture.src) ? [linkedPicture, ...own] : own;
    return [{
      id,
      axis: optionAxis(attrs),
      name,
      available: optionAvailable(attrs),
      isDefault: row.is_default === true,
      pictures,
      videos: rowsFor(id, liveVideos).map((item) => clip(item)!),
      sku: typeof row.sku === "string" ? row.sku : "",
      labels: {
        ...(text(attrs, "colorLabel") ? { color: text(attrs, "colorLabel") } : {}),
        ...(text(attrs, "typeLabel") ? { type: text(attrs, "typeLabel") } : {}),
        ...(text(attrs, "sizeLabel") ? { size: text(attrs, "sizeLabel") } : {}),
        ...(text(attrs, "customLabel") ? { custom: text(attrs, "customLabel") } : {}),
      },
      ...dimensions,
    }];
  });
  const sharedPictures = liveImages
    .filter((row) => !row.variant_id && !claimed.has(String(row.src ?? "")))
    .sort(bySort)
    .map((row) => picture(row)!);
  const open = views.filter((item) => item.available);
  const chosen = open.find((item) => item.isDefault && item.pictures.length)
    ?? open.find((item) => item.pictures.length)
    ?? open.find((item) => item.isDefault)
    ?? open[0];
  const pictures = [...(chosen?.pictures ?? []), ...sharedPictures];
  return {
    variants: views,
    defaultVariantId: chosen?.id ?? "",
    sharedPictures,
    videos: sharedVideos,
    pictures,
  };
}
