import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

type BandPhotoProps = Omit<ImageProps, "src" | "alt"> & {
  src: string;
  alt: string;
  frameClassName?: string;
  /** Where the engraved wordmark sits on this photo. */
  mark?: "strap" | "box";
};

function bandId(src: string) {
  const match = src.match(/(?:band|box)-(black|blue|green|orange|red)/);
  return match?.[1] ?? "black";
}

export function BandPhoto({
  className,
  frameClassName,
  alt,
  src,
  mark = "strap",
  ...props
}: BandPhotoProps) {
  return (
    <span className={cn("relative inline-block max-w-full align-middle", frameClassName)}>
      <Image
        {...props}
        key={src}
        src={src}
        alt={alt}
        unoptimized
        className={cn("block", className)}
      />
      {mark === "box" ? (
        <span className="band-mark band-mark-box" data-band={bandId(src)} aria-hidden="true">
          <span className="band-mark-cut band-mark-shadow" />
          <span className="band-mark-cut band-mark-letters" />
          <span className="band-mark-cut band-mark-dot" />
        </span>
      ) : null}
    </span>
  );
}
