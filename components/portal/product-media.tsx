"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ResourceDelete } from "@/components/portal/resource-delete";
import { Button } from "@/components/ui/button";
import { FilePicker } from "@/components/ui/file-picker";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type GalleryImage = {
  id: string;
  product_id: string;
  src: string;
  alt: string;
  width?: number;
  height?: number;
  sort?: number;
  focused?: boolean;
  enabled?: boolean;
  deleted_at?: string | null;
};

export type GalleryVideo = {
  id: string;
  product_id: string;
  title: string;
  youtube_id?: string;
  src?: string;
  published?: boolean;
  deleted_at?: string | null;
};

type MediaNoun = "picture" | "video";

type PendingAction =
  | { action: "focus"; imageId: string }
  | { action: "replace"; noun: MediaNoun; id: string }
  | { action: "toggle"; noun: MediaNoun; id: string; enabled: boolean }
  | { action: "remove"; noun: MediaNoun; id: string }
  | { action: "recover"; noun: MediaNoun; id: string };

async function postMedia(body: unknown) {
  const response = await fetch("/api/portal/inventory", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as { error?: string };
  return response.ok ? "" : data.error ?? "That media could not be saved.";
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

function livePictures(images: GalleryImage[]) {
  return images
    .filter((image) => !image.deleted_at && image.enabled !== false)
    .sort((left, right) => Number(left.sort ?? 0) - Number(right.sort ?? 0));
}

function focusId(images: GalleryImage[], chosenId: string | null) {
  const live = livePictures(images);
  if (chosenId && live.some((image) => image.id === chosenId)) return chosenId;
  const marked = live.find((image) => image.focused);
  return marked?.id ?? live[0]?.id ?? "";
}

function confirmCopy(pending: PendingAction) {
  if (pending.action === "focus") return { title: "Use this focused image?", detail: "This picture becomes the one shown on the shop." };
  if (pending.action === "replace") {
    return {
      title: pending.noun === "picture" ? "Replace this picture?" : "Replace this video?",
      detail: "Confirm, then choose the new file.",
    };
  }
  if (pending.action === "toggle") {
    return pending.enabled
      ? { title: pending.noun === "picture" ? "Show this picture?" : "Show this video?", detail: "It will appear on the shop again." }
      : { title: pending.noun === "picture" ? "Hide this picture?" : "Hide this video?", detail: "It stays in inventory and stays off the shop." };
  }
  if (pending.action === "remove") {
    return {
      title: pending.noun === "picture" ? "Remove this picture?" : "Remove this video?",
      detail: "It stays off the shop until you recover it.",
    };
  }
  return {
    title: pending.noun === "picture" ? "Recover this picture?" : "Recover this video?",
    detail: "It goes back on this product.",
  };
}

export function ProductMedia({
  productId,
  productName,
  images,
  videos,
  onDone,
}: {
  productId: string;
  productName: string;
  images: GalleryImage[];
  videos: GalleryVideo[];
  onDone: () => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const replaceRef = useRef<PendingAction | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const activeFocusId = focusId(images, focusedId);
  const focusedSrc = images.find((image) => image.id === activeFocusId)?.src ?? "";
  const serverFocus = images.find((image) => image.focused && !image.deleted_at && image.enabled !== false)?.id ?? "";

  useEffect(() => {
    setFocusedId(null);
  }, [productId, serverFocus]);

  function isFocused(image: GalleryImage) {
    return image.id === activeFocusId;
  }

  async function addImages(list: FileList | null) {
    if (!list?.length) return;
    setBusy(true);
    setError("");
    for (const file of list) {
      const uploaded = await uploadFile(file);
      if (!uploaded.url) {
        setError(uploaded.error ?? "The picture could not be uploaded.");
        setBusy(false);
        return;
      }
      const size = await imageSize(file);
      const message = await postMedia({
        kind: "image",
        productId,
        src: uploaded.url,
        alt: productName || file.name,
        width: size.width,
        height: size.height,
      });
      if (message) {
        setError(message);
        setBusy(false);
        return;
      }
    }
    setBusy(false);
    onDone();
  }

  async function addVideos(list: FileList | null) {
    if (!list?.length) return;
    setBusy(true);
    setError("");
    for (const file of list) {
      const uploaded = await uploadFile(file);
      if (!uploaded.url) {
        setError(uploaded.error ?? "The video could not be uploaded.");
        setBusy(false);
        return;
      }
      const title = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || productName;
      const message = await postMedia({
        kind: "video",
        productId,
        title,
        src: uploaded.url,
        poster: focusedSrc,
      });
      if (message) {
        setError(message);
        setBusy(false);
        return;
      }
    }
    setBusy(false);
    onDone();
  }

  async function replaceImage(imageId: string, file: File) {
    setBusy(true);
    setError("");
    const uploaded = await uploadFile(file);
    if (!uploaded.url) {
      setError(uploaded.error ?? "The picture could not be replaced.");
      setBusy(false);
      return;
    }
    const size = await imageSize(file);
    const message = await postMedia({
      kind: "imageReplace",
      imageId,
      src: uploaded.url,
      width: size.width,
      height: size.height,
    });
    setError(message);
    setBusy(false);
    if (!message) onDone();
  }

  async function replaceVideo(videoId: string, file: File) {
    setBusy(true);
    setError("");
    const uploaded = await uploadFile(file);
    if (!uploaded.url) {
      setError(uploaded.error ?? "The video could not be replaced.");
      setBusy(false);
      return;
    }
    const message = await postMedia({ kind: "videoReplace", videoId, src: uploaded.url });
    setError(message);
    setBusy(false);
    if (!message) onDone();
  }

  async function removeMedia(noun: MediaNoun, id: string) {
    setBusy(true);
    setError("");
    const response = await fetch("/api/portal/lifecycle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: noun === "picture" ? "product_images" : "videos", id, confirm: "SOFT DELETE" }),
    });
    const data = (await response.json()) as { error?: string };
    const message = response.ok ? "" : data.error ?? "That could not be removed.";
    setError(message);
    setBusy(false);
    if (!message) onDone();
  }

  async function run(action: PendingAction) {
    if (action.action === "focus") {
      setFocusedId(action.imageId);
      setBusy(true);
      setError("");
      const message = await postMedia({ kind: "focus", productId, imageId: action.imageId });
      setBusy(false);
      setError(message);
      if (message) setFocusedId(null);
      else onDone();
      return;
    }
    if (action.action === "toggle") {
      const message = action.noun === "picture"
        ? await postMedia({ kind: "imageEnabled", imageId: action.id, enabled: action.enabled })
        : await postMedia({ kind: "videoEnabled", videoId: action.id, enabled: action.enabled });
      setError(message);
      if (!message) onDone();
      return;
    }
    if (action.action === "remove") {
      await removeMedia(action.noun, action.id);
      return;
    }
    if (action.action === "recover") {
      const message = action.noun === "picture"
        ? await postMedia({ kind: "imageRestore", imageId: action.id })
        : await postMedia({ kind: "videoRestore", videoId: action.id });
      setError(message);
      if (!message) onDone();
    }
  }

  function confirmPending() {
    if (!pending) return;
    if (pending.action === "replace") {
      replaceRef.current = pending;
      const input = fileRef.current;
      if (input) {
        input.accept = pending.noun === "picture" ? "image/jpeg,image/png,image/webp,image/gif" : "video/mp4";
        input.click();
      }
      setPending(null);
      return;
    }
    const action = pending;
    setPending(null);
    void run(action);
  }

  const prompt = pending ? confirmCopy(pending) : null;

  return (
    <div className="grid gap-6 md:col-span-2">
      <input
        ref={fileRef}
        className="hidden"
        type="file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          const action = replaceRef.current;
          event.target.value = "";
          replaceRef.current = null;
          if (!file || !action || action.action !== "replace") return;
          if (action.noun === "picture") void replaceImage(action.id, file);
          else void replaceVideo(action.id, file);
        }}
      />
      <fieldset className="grid gap-4">
        <legend className="font-display text-xl">Pictures</legend>
        <p className="text-sm text-muted">Upload more than one picture. The focused image is the one shown on the shop. If none is marked, the first picture is used.</p>
        <div>
          <p className="text-sm">Add pictures</p>
          <FilePicker
            className="mt-2"
            label="Add pictures"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            disabled={busy}
            onChange={(event) => {
              void addImages(event.target.files);
              event.target.value = "";
            }}
          />
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {[...images].sort((left, right) => Number(left.sort ?? 0) - Number(right.sort ?? 0)).map((image) => (
            <li key={image.id} className={cn("rounded-2xl border border-stone p-3", (image.enabled === false || image.deleted_at) && "opacity-70")}>
              {image.src ? (
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={image.width || 1600}
                  height={image.height || 1600}
                  className="aspect-square w-full rounded-xl bg-stone/40 object-contain"
                />
              ) : null}
              <label className="mt-3 block text-sm">
                Description
                <Input
                  className="mt-2"
                  defaultValue={image.alt}
                  onBlur={async (event) => {
                    if (event.target.value.trim() === image.alt) return;
                    setError(await postMedia({ kind: "imageAlt", imageId: image.id, alt: event.target.value }));
                    onDone();
                  }}
                />
              </label>
              {isFocused(image) ? <p className="mt-3 text-sm">This is the focused image</p> : null}
              {image.deleted_at ? (
                <div className="mt-3">
                  <p className="text-sm text-muted">This picture is removed.</p>
                  <Button className="mt-3" type="button" size="sm" variant="secondary" disabled={busy} onClick={() => setPending({ action: "recover", noun: "picture", id: image.id })}>
                    Recover
                  </Button>
                  <ResourceDelete table="product_images" id={image.id} removed onDone={onDone} />
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {isFocused(image) ? null : (
                    <Button type="button" size="sm" variant="secondary" disabled={busy || image.enabled === false} onClick={() => setPending({ action: "focus", imageId: image.id })}>
                      Make focused
                    </Button>
                  )}
                  <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => setPending({ action: "replace", noun: "picture", id: image.id })}>
                    Replace
                  </Button>
                  <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => setPending({ action: "toggle", noun: "picture", id: image.id, enabled: image.enabled === false })}>
                    {image.enabled === false ? "Enable" : "Disable"}
                  </Button>
                  <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => setPending({ action: "remove", noun: "picture", id: image.id })}>
                    Remove
                  </Button>
                </div>
              )}
              {image.enabled === false && !image.deleted_at ? <p className="mt-2 text-sm text-muted">Hidden on the shop. Enable it to show it again.</p> : null}
            </li>
          ))}
        </ul>
      </fieldset>
      <fieldset className="grid gap-4">
        <legend className="font-display text-xl">Videos</legend>
        <p className="text-sm text-muted">Upload more than one MP4. YouTube videos already on this product stay in the list until you replace or remove them.</p>
        <div>
          <p className="text-sm">Add videos</p>
          <FilePicker
            className="mt-2"
            label="Add videos"
            accept="video/mp4"
            multiple
            disabled={busy}
            onChange={(event) => {
              void addVideos(event.target.files);
              event.target.value = "";
            }}
          />
        </div>
        <ul className="grid gap-4">
          {videos.map((video) => (
            <li key={video.id} className={cn("rounded-2xl border border-stone p-3", (video.published === false || video.deleted_at) && "opacity-70")}>
              {video.src ? (
                <video className="aspect-video w-full rounded-xl bg-stone/40" src={video.src} controls preload="metadata" />
              ) : (
                <p className="text-sm text-muted">YouTube {video.youtube_id}</p>
              )}
              <label className="mt-3 block text-sm">
                Title
                <Input
                  className="mt-2"
                  defaultValue={video.title}
                  onBlur={async (event) => {
                    if (event.target.value.trim() === video.title) return;
                    setError(await postMedia({ kind: "videoTitle", videoId: video.id, title: event.target.value }));
                    onDone();
                  }}
                />
              </label>
              {video.deleted_at ? (
                <div className="mt-3">
                  <p className="text-sm text-muted">This video is removed.</p>
                  <Button className="mt-3" type="button" size="sm" variant="secondary" disabled={busy} onClick={() => setPending({ action: "recover", noun: "video", id: video.id })}>
                    Recover
                  </Button>
                  <ResourceDelete table="videos" id={video.id} removed onDone={onDone} />
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => setPending({ action: "replace", noun: "video", id: video.id })}>
                    Replace
                  </Button>
                  <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => setPending({ action: "toggle", noun: "video", id: video.id, enabled: video.published === false })}>
                    {video.published === false ? "Enable" : "Disable"}
                  </Button>
                  <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => setPending({ action: "remove", noun: "video", id: video.id })}>
                    Remove
                  </Button>
                </div>
              )}
              {video.published === false && !video.deleted_at ? <p className="mt-2 text-sm text-muted">Hidden on the shop. Enable it to show it again.</p> : null}
            </li>
          ))}
        </ul>
      </fieldset>
      {error ? <p className="text-band-red" role="alert">{error}</p> : null}
      {prompt ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[var(--fixed-ink)]/45 p-4 sm:items-center">
          <div role="dialog" aria-modal="true" aria-labelledby="media-confirm-title" className="w-full max-w-md rounded-3xl bg-white p-6 text-ink shadow-lg">
            <h2 id="media-confirm-title" className="font-display text-2xl">{prompt.title}</h2>
            <p className="mt-2 text-sm text-muted">{prompt.detail}</p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="secondary" disabled={busy} onClick={() => setPending(null)}>
                Go back
              </Button>
              <Button type="button" disabled={busy} onClick={confirmPending}>
                Confirm
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
