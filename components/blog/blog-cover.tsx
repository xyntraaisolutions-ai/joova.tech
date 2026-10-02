import Image from "next/image";
import type { CatalogImage } from "@/content/catalog";

export function BlogCover({
  bannerUrl,
  bannerAlt,
  fallback,
  priority = false,
  sizes,
  className = "",
}: {
  bannerUrl?: string;
  bannerAlt?: string;
  fallback?: CatalogImage;
  priority?: boolean;
  sizes: string;
  className?: string;
}) {
  if (bannerUrl) {
    return (
      <div className={`relative w-full overflow-hidden bg-[var(--joova-white)] ${className}`}>
        <Image src={bannerUrl} alt={bannerAlt || ""} fill priority={priority} sizes={sizes} className="object-cover" />
      </div>
    );
  }
  if (fallback) {
    return (
      <div className={`stage relative w-full overflow-hidden ${className}`}>
        <Image src={fallback.src} alt={fallback.alt} fill priority={priority} sizes={sizes} className="object-contain p-6 sm:p-10" />
      </div>
    );
  }
  return (
    <div className={`relative w-full overflow-hidden bg-ink ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,var(--joova-coral),transparent_42%)] opacity-80" />
      <p className="absolute bottom-6 left-6 font-display text-3xl font-extrabold text-[var(--fixed-paper)]">Joova</p>
    </div>
  );
}
