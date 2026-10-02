"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FilePicker } from "@/components/ui/file-picker";
import { Input } from "@/components/ui/input";
import { optionAxes, optionAxisLabel, type OptionAxis } from "@/lib/content/variants";

export type DraftPicture = {
  key: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  file?: File;
  savedId?: string;
};

export type DraftVideo = {
  key: string;
  src: string;
  title: string;
  file?: File;
  savedId?: string;
};

export type DraftVariant = {
  id: string;
  axis: OptionAxis;
  name: string;
  available: boolean;
  ownMedia: boolean;
  ownSku: boolean;
  sku: string;
  isDefault: boolean;
  pictures: DraftPicture[];
  videos: DraftVideo[];
  source?: Record<string, unknown>;
};

export function draftLabel(draft: Pick<DraftVariant, "name">) {
  return draft.name.trim();
}

async function uploadFile(file: File) {
  const form = new FormData();
  form.set("file", file);
  const response = await fetch("/api/portal/media", { method: "POST", body: form });
  const data = (await response.json()) as { error?: string; url?: string };
  if (!response.ok || !data.url) return { error: data.error ?? "The file could not be uploaded." };
  return { url: data.url };
}

function imageSize(file: File) {
  return new Promise<{ width: number; height: number }>((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth || 1600, height: image.naturalHeight || 1600 });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      resolve({ width: 1600, height: 1600 });
      URL.revokeObjectURL(url);
    };
    image.src = url;
  });
}

async function postMedia(body: unknown) {
  const response = await fetch("/api/portal/inventory", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as { error?: string };
  return response.ok ? "" : data.error ?? "That media could not be saved.";
}

export async function saveVariantMedia(productId: string, productName: string, drafts: DraftVariant[]) {
  for (const draft of drafts) {
    if (!draft.ownMedia) continue;
    const label = draftLabel(draft) || productName;
    for (const picture of draft.pictures) {
      if (!picture.file) continue;
      const uploaded = await uploadFile(picture.file);
      if (!uploaded.url) return uploaded.error ?? "The picture could not be uploaded.";
      const size = picture.width ? { width: picture.width, height: picture.height } : await imageSize(picture.file);
      const message = await postMedia({
        kind: "image",
        productId,
        variantId: draft.id,
        src: uploaded.url,
        alt: `${productName} ${label}`.trim(),
        width: size.width,
        height: size.height,
      });
      if (message) return message;
      picture.src = uploaded.url;
      delete picture.file;
    }
    for (const video of draft.videos) {
      if (!video.file) continue;
      const uploaded = await uploadFile(video.file);
      if (!uploaded.url) return uploaded.error ?? "The video could not be uploaded.";
      const message = await postMedia({
        kind: "video",
        productId,
        variantId: draft.id,
        title: video.title || label,
        src: uploaded.url,
        poster: "",
      });
      if (message) return message;
      video.src = uploaded.url;
      delete video.file;
    }
  }
  return "";
}

export function ProductVariants({
  productName,
  productSku,
  productId,
  previousId,
  drafts,
  onChange,
}: {
  productName: string;
  productSku: string;
  productId: string;
  previousId: string;
  drafts: DraftVariant[];
  onChange: (next: DraftVariant[]) => void;
}) {
  const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState("");
  const [mediaConfirm, setMediaConfirm] = useState<{ draftId: string; kind: "picture" | "video"; key: string } | null>(null);
  const [removing, setRemoving] = useState(false);

  function update(id: string, patch: Partial<DraftVariant>) {
    onChange(drafts.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)));
  }

  function addOption(axis: OptionAxis) {
    onChange([
      ...drafts,
      {
        id: `option-${axis}-${Date.now()}`,
        axis,
        name: "",
        available: true,
        ownMedia: false,
        ownSku: false,
        sku: "",
        isDefault: drafts.length === 0,
        pictures: [],
        videos: [],
      },
    ]);
  }

  function makeDefault(id: string) {
    onChange(drafts.map((draft) => ({ ...draft, isDefault: draft.id === id })));
  }

  function removeOption(id: string) {
    const next = drafts.filter((item) => item.id !== id);
    if (next.length && !next.some((item) => item.isDefault)) next[0] = { ...next[0], isDefault: true };
    onChange(next);
    setConfirmId("");
  }

  async function addPictures(id: string, list: FileList | null) {
    if (!list?.length) return;
    const pictures = await Promise.all([...list].map(async (file) => {
      const size = await imageSize(file);
      return {
        key: `${id}-${file.name}-${file.size}-${Date.now()}`,
        src: URL.createObjectURL(file),
        alt: file.name,
        width: size.width,
        height: size.height,
        file,
      } satisfies DraftPicture;
    }));
    const draft = drafts.find((item) => item.id === id);
    if (!draft) return;
    update(id, { pictures: [...draft.pictures, ...pictures], ownMedia: true });
  }

  function addVideos(id: string, list: FileList | null) {
    if (!list?.length) return;
    const draft = drafts.find((item) => item.id === id);
    if (!draft) return;
    const videos = [...list].map((file) => ({
      key: `${id}-${file.name}-${file.size}-${Date.now()}`,
      src: URL.createObjectURL(file),
      title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || productName,
      file,
    }));
    update(id, { videos: [...draft.videos, ...videos], ownMedia: true });
  }

  async function confirmMediaRemove() {
    if (!mediaConfirm) return;
    const draft = drafts.find((item) => item.id === mediaConfirm.draftId);
    if (!draft) {
      setMediaConfirm(null);
      return;
    }
    setRemoving(true);
    setError("");
    if (mediaConfirm.kind === "picture") {
      const picture = draft.pictures.find((item) => item.key === mediaConfirm.key);
      if (picture?.savedId) {
        const message = await removeSaved("product_images", picture.savedId);
        if (message) {
          setError(message);
          setRemoving(false);
          return;
        }
      }
      update(draft.id, { pictures: draft.pictures.filter((item) => item.key !== mediaConfirm.key) });
    } else {
      const video = draft.videos.find((item) => item.key === mediaConfirm.key);
      if (video?.savedId) {
        const message = await removeSaved("videos", video.savedId);
        if (message) {
          setError(message);
          setRemoving(false);
          return;
        }
      }
      update(draft.id, { videos: draft.videos.filter((item) => item.key !== mediaConfirm.key) });
    }
    setRemoving(false);
    setMediaConfirm(null);
  }

  async function generateSku(draft: DraftVariant) {
    const name = draftLabel(draft);
    if (!name) {
      setError("Add a name before generating a SKU.");
      return;
    }
    if (!productSku.trim()) {
      setError("Add a product SKU before generating a variant SKU.");
      return;
    }
    setError("");
    const response = await fetch("/api/portal/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "suggestSku",
        productId,
        previousId,
        productSku,
        choiceType: optionAxisLabel[draft.axis],
        choiceName: name,
        variant: true,
        ignore: draft.sku,
        extra: [productSku, ...drafts.filter((item) => item.id !== draft.id).map((item) => item.sku)].filter((item) => item.trim()),
      }),
    });
    const data = (await response.json()) as { sku?: string; error?: string };
    if (!response.ok || !data.sku) {
      setError(data.error ?? "A SKU could not be generated.");
      return;
    }
    const next = data.sku.toUpperCase();
    update(draft.id, { sku: next, ownSku: true });
  }

  async function removeSaved(table: "product_images" | "videos", id: string) {
    const response = await fetch("/api/portal/lifecycle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table, id, confirm: "SOFT DELETE" }),
    });
    const data = (await response.json()) as { error?: string };
    return response.ok ? "" : data.error ?? "That could not be removed.";
  }

  return (
    <div className="mt-4 grid gap-8">
      <p className="text-sm text-muted">
        Add colors, types, sizes, or custom names. Shoppers pick one of each. A choice can keep this product’s SKU or use its own. A choice marked not available is hidden on the website.
      </p>
      {error ? <p className="text-sm text-band-red" role="alert">{error}</p> : null}
      {optionAxes.map((axis) => {
        const rows = drafts.filter((draft) => draft.axis === axis);
        return (
          <section key={axis} className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-2xl">{optionAxisLabel[axis]}</h3>
              <Button type="button" size="sm" onClick={() => addOption(axis)}>Add {optionAxisLabel[axis].toLowerCase()}</Button>
            </div>
            {rows.length === 0 ? <p className="text-sm text-muted">None yet.</p> : null}
            <ul className="grid gap-3">
              {rows.map((draft) => {
                const label = draftLabel(draft) || `New ${optionAxisLabel[axis].toLowerCase()}`;
                return (
                  <li key={draft.id} className="rounded-3xl border border-stone p-4">
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                      <label className="text-sm">
                        Name
                        <Input className="mt-2" value={draft.name} onChange={(event) => update(draft.id, { name: event.target.value })} />
                        {typeof draft.source?.style === "string" && draft.source.style ? (
                          <span className="mt-1 block text-xs text-muted">Type {draft.source.style}. Shoppers pick this with the color.</span>
                        ) : null}
                      </label>
                      <label className="inline-flex min-h-11 items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={draft.available}
                          onChange={(event) => update(draft.id, { available: event.target.checked })}
                        />
                        Available on the website
                      </label>
                    </div>
                    <label className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm">
                      <input type="radio" name="default-option" checked={draft.isDefault} onChange={() => makeDefault(draft.id)} />
                      Show this choice first
                    </label>
                    <fieldset className="mt-4">
                      <legend className="text-sm font-bold">Separate SKU for {label}?</legend>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={draft.ownSku ? "primary" : "secondary"}
                          onClick={() => update(draft.id, { ownSku: true })}
                        >
                          Yes
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={draft.ownSku ? "secondary" : "primary"}
                          onClick={() => update(draft.id, { ownSku: false, sku: "" })}
                        >
                          No
                        </Button>
                      </div>
                      {draft.ownSku ? (
                        <div className="mt-3">
                          <label className="text-sm">
                            SKU
                            <Input className="mt-2" value={draft.sku} maxLength={40} onChange={(event) => update(draft.id, { sku: event.target.value })} />
                          </label>
                          <Button className="mt-3" type="button" size="sm" variant="secondary" onClick={() => void generateSku(draft)}>
                            Auto Generate
                          </Button>
                          <p className="mt-2 text-sm text-muted">Uses the product SKU, then the first word of the choice type and the first word of the name. A name like Black &amp; Blue uses the initial of each word. If that SKU is already used, 1, 2, or 3 is added at the end.</p>
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-muted">This choice uses the product SKU.</p>
                      )}
                    </fieldset>
                    <fieldset className="mt-4">
                      <legend className="text-sm font-bold">Different pictures or videos for {label}?</legend>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant={draft.ownMedia ? "primary" : "secondary"} onClick={() => update(draft.id, { ownMedia: true })}>
                          Yes
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={draft.ownMedia ? "secondary" : "primary"}
                          onClick={() => {
                            if (draft.pictures.some((picture) => picture.savedId) || draft.videos.some((video) => video.savedId)) {
                              setError("Remove the pictures and videos first.");
                              return;
                            }
                            setError("");
                            update(draft.id, { ownMedia: false, pictures: [], videos: [] });
                          }}
                        >
                          No
                        </Button>
                      </div>
                      <p className="mt-2 text-sm text-muted">When a shopper picks this choice, these pictures and videos show first. The main product media stays after them.</p>
                    </fieldset>
                    {draft.ownMedia ? (
                      <div className="mt-4 grid gap-4">
                        <div>
                          <p className="text-sm font-bold">Pictures</p>
                          <ul className="mt-3 grid gap-3 sm:grid-cols-3">
                            {draft.pictures.map((picture) => (
                              <li key={picture.key} className="rounded-2xl border border-stone p-2">
                                {picture.src.startsWith("blob:") ? (
                                  // Local preview of a file that is not saved yet.
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={picture.src} alt={picture.alt} className="aspect-square w-full rounded-xl object-contain" />
                                ) : (
                                  <Image src={picture.src} alt={picture.alt} width={picture.width || 1600} height={picture.height || 1600} className="aspect-square w-full rounded-xl object-contain" />
                                )}
                                {mediaConfirm?.draftId === draft.id && mediaConfirm.kind === "picture" && mediaConfirm.key === picture.key ? (
                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <p className="text-sm">Remove this picture?</p>
                                    <Button type="button" size="sm" disabled={removing} onClick={() => void confirmMediaRemove()}>Remove</Button>
                                    <Button type="button" size="sm" variant="secondary" disabled={removing} onClick={() => setMediaConfirm(null)}>Cancel</Button>
                                  </div>
                                ) : (
                                  <Button className="mt-2" type="button" size="sm" variant="secondary" disabled={removing} onClick={() => setMediaConfirm({ draftId: draft.id, kind: "picture", key: picture.key })}>
                                    Remove
                                  </Button>
                                )}
                              </li>
                            ))}
                          </ul>
                          <div className="mt-3">
                            <p className="text-sm">Add pictures</p>
                            <FilePicker
                              className="mt-2"
                              label="Add pictures"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              multiple
                              onChange={(event) => {
                                void addPictures(draft.id, event.target.files);
                                event.target.value = "";
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-bold">Videos</p>
                          <ul className="mt-3 grid gap-3">
                            {draft.videos.map((video) => (
                              <li key={video.key} className="rounded-2xl border border-stone p-2">
                                <video className="aspect-video w-full rounded-xl bg-stone/40" src={video.src} controls preload="metadata" />
                                <p className="mt-2 text-sm">{video.title}</p>
                                {mediaConfirm?.draftId === draft.id && mediaConfirm.kind === "video" && mediaConfirm.key === video.key ? (
                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <p className="text-sm">Remove this video?</p>
                                    <Button type="button" size="sm" disabled={removing} onClick={() => void confirmMediaRemove()}>Remove</Button>
                                    <Button type="button" size="sm" variant="secondary" disabled={removing} onClick={() => setMediaConfirm(null)}>Cancel</Button>
                                  </div>
                                ) : (
                                  <Button className="mt-2" type="button" size="sm" variant="secondary" disabled={removing} onClick={() => setMediaConfirm({ draftId: draft.id, kind: "video", key: video.key })}>
                                    Remove
                                  </Button>
                                )}
                              </li>
                            ))}
                          </ul>
                          <div className="mt-3">
                            <p className="text-sm">Add videos</p>
                            <FilePicker
                              className="mt-2"
                              label="Add videos"
                              accept="video/mp4"
                              multiple
                              onChange={(event) => {
                                addVideos(draft.id, event.target.files);
                                event.target.value = "";
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : null}
                    {confirmId === draft.id ? (
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <p className="text-sm">Remove {label}?</p>
                        <Button type="button" size="sm" onClick={() => removeOption(draft.id)}>Remove</Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => setConfirmId("")}>Cancel</Button>
                      </div>
                    ) : (
                      <Button className="mt-4" type="button" size="sm" variant="secondary" onClick={() => setConfirmId(draft.id)}>Remove</Button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
