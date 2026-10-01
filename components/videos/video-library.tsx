"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, VolumeX } from "lucide-react";
import { useState } from "react";
import { useSiteContent } from "@/components/layout/site-content";
import type { CatalogProduct } from "@/content/catalog";
import type { ProductVideo } from "@/content/videos";
import { cn } from "@/lib/utils";

export function VideoLibrary() {
  const { catalog, productVideos } = useSiteContent();
  const [productId, setProductId] = useState("all");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const videos =
    productId === "all"
      ? productVideos
      : productVideos.filter((video) => video.productId === productId);
  const selected = catalog.find((product) => product.id === productId);
  const posted = catalog.filter((product) =>
    productVideos.some((video) => video.productId === product.id),
  );
  const waiting = catalog.filter(
    (product) => !productVideos.some((video) => video.productId === product.id),
  );

  function selectProduct(id: string) {
    setProductId(id);
    setPlayingId(null);
  }

  return (
    <div className="mt-10 grid items-start gap-8 lg:grid-cols-[16.5rem_minmax(0,1fr)] lg:gap-12">
      <nav aria-label="Filter videos by product" className="lg:sticky lg:top-28">
        <p className="text-xs font-bold uppercase tracking-[2.5px] text-muted">Products</p>
        <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
          <FilterButton
            pressed={productId === "all"}
            count={productVideos.length}
            onClick={() => selectProduct("all")}
          >
            All
          </FilterButton>
          {posted.map((product) => (
            <FilterButton
              key={product.id}
              pressed={productId === product.id}
              count={productVideos.filter((video) => video.productId === product.id).length}
              onClick={() => selectProduct(product.id)}
            >
              {product.menuLabel}
            </FilterButton>
          ))}
        </div>
        {waiting.length > 0 ? (
          <div className="mt-6 hidden lg:block">
            <p className="text-xs font-bold uppercase tracking-[2.5px] text-muted">No videos yet</p>
            <div className="mt-3 flex flex-col gap-1">
              {waiting.map((product) => (
                <FilterButton
                  key={product.id}
                  pressed={productId === product.id}
                  count={0}
                  onClick={() => selectProduct(product.id)}
                >
                  {product.menuLabel}
                </FilterButton>
              ))}
            </div>
          </div>
        ) : null}
        {waiting.length > 0 ? (
          <div className="mt-5 lg:hidden">
            <p className="text-xs font-bold uppercase tracking-[2.5px] text-muted">No videos yet</p>
            <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1">
              {waiting.map((product) => (
                <FilterButton
                  key={product.id}
                  pressed={productId === product.id}
                  count={0}
                  onClick={() => selectProduct(product.id)}
                >
                  {product.menuLabel}
                </FilterButton>
              ))}
            </div>
          </div>
        ) : null}
      </nav>

      {videos.length === 0 ? (
        <EmptyProduct product={selected} />
      ) : (
        <ul className={cn("grid gap-8", videos.length > 1 && "sm:grid-cols-2")}>
          {videos.map((video) => (
            <li key={video.id}>
              <VideoCard
                video={video}
                product={catalog.find((item) => item.id === video.productId)}
                playing={playingId === video.id}
                featured={videos.length === 1}
                onPlay={() => setPlayingId(video.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function VideoCard({
  video,
  product,
  playing,
  featured,
  onPlay,
}: {
  video: ProductVideo;
  product: CatalogProduct | undefined;
  playing: boolean;
  featured: boolean;
  onPlay: () => void;
}) {
  return (
    <article>
      <div className="stage overflow-hidden rounded-[28px] shadow-[0_24px_80px_rgba(12,18,28,0.08)]">
        <div className="relative aspect-video">
          {playing && video.src ? (
            <video
              className="absolute inset-0 h-full w-full bg-[var(--fixed-ink)]"
              src={video.src}
              poster={video.poster || product?.image.src || undefined}
              controls
              autoPlay
              muted
              playsInline
            />
          ) : playing && video.youtubeId ? (
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?rel=0&autoplay=1&mute=1&playsinline=1`}
              title={`${video.title}. Playback starts muted.`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <button type="button" className="absolute inset-0" onClick={onPlay} aria-label={`Play ${video.title}, muted`}>
              <Poster youtubeId={video.youtubeId} poster={video.poster || product?.image.src} featured={featured} />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex size-16 items-center justify-center rounded-full bg-coral text-[var(--fixed-ink)] shadow-[0_12px_40px_rgba(12,18,28,0.28)] sm:size-20">
                  <Play className="ml-1 size-7 fill-current sm:size-8" aria-hidden />
                </span>
              </span>
            </button>
          )}
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          {product ? (
            <p className="text-xs font-bold uppercase tracking-[2.5px] text-muted">{product.menuLabel}</p>
          ) : null}
          <h2
            className={cn("mt-2 font-display font-extrabold", featured ? "text-3xl sm:text-4xl" : "text-2xl")}
          >
            {video.title}
          </h2>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted">
            <VolumeX className="size-4" aria-hidden />
            Playback starts muted.
          </p>
        </div>
        {product ? (
          <Link
            href={product.href}
            className="inline-flex min-h-11 items-center text-sm font-bold text-ink underline underline-offset-4"
          >
            Shop {product.menuLabel}
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function Poster({ youtubeId, poster, featured }: { youtubeId: string; poster?: string; featured: boolean }) {
  const [src, setSrc] = useState(poster || (youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/sddefault.jpg` : ""));
  if (!src) return <span className="absolute inset-0 bg-stone" />;

  return (
    <Image
      src={src}
      alt=""
      fill
      sizes={featured ? "(min-width: 1024px) 900px, 100vw" : "(min-width: 1024px) 440px, 100vw"}
      className="object-cover"
      onError={() => {
        if (youtubeId) setSrc(`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`);
      }}
    />
  );
}

function EmptyProduct({ product }: { product: CatalogProduct | undefined }) {
  if (!product) {
    return <p className="text-muted">No videos yet.</p>;
  }

  return (
    <div className="grid items-center gap-6 rounded-[28px] border border-stone bg-white p-6 sm:grid-cols-[11rem_minmax(0,1fr)] sm:p-8">
      <div className="stage relative mx-auto aspect-square w-full max-w-44 overflow-hidden rounded-3xl">
        <Image
          src={product.image.src}
          alt={product.image.alt}
          fill
          sizes="176px"
          className="object-contain p-3"
        />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-[2.5px] text-muted">No videos yet</p>
        <h2 className="mt-2 font-display text-3xl font-extrabold">{product.menuLabel}</h2>
        <p className="mt-3 max-w-md text-muted">
          Videos for the {product.menuLabel} will be posted here.
        </p>
        <Link
          href={product.href}
          className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-ink underline underline-offset-4"
        >
          Shop {product.menuLabel}
        </Link>
      </div>
    </div>
  );
}

function FilterButton({
  pressed,
  count,
  onClick,
  children,
}: {
  pressed: boolean;
  count: number;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center justify-between gap-3 rounded-full px-4 text-left text-sm font-bold lg:w-full lg:rounded-2xl",
        pressed ? "bg-ink text-paper" : "text-ink hover:bg-white",
      )}
    >
      <span>{children}</span>
      <span className={cn("text-xs", pressed ? "text-paper/70" : "text-muted")}>{count}</span>
    </button>
  );
}
