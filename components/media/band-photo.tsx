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
      <Image
        src="/brand/joova-wordmark-white.svg"
        alt=""
        width={1126}
        height={257}
        unoptimized
        className="band-mark"
      />
    </span>
  );
}
