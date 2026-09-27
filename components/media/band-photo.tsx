import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

type BandPhotoProps = Omit<ImageProps, "src" | "alt"> & {
  src: string;
  alt: string;
  frameClassName?: string;
};

export function BandPhoto({
  className,
  frameClassName,
  alt,
  ...props
}: BandPhotoProps) {
  return (
    <span className={cn("relative inline-block max-w-full align-middle", frameClassName)}>
      <Image {...props} alt={alt} className={cn("block", className)} />
      <span className="band-mark" aria-hidden="true">
        <span className="band-mark-cut band-mark-shadow" />
        <span className="band-mark-cut band-mark-lip" />
        <span className="band-mark-cut band-mark-groove" />
      </span>
    </span>
  );
}
