"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

export function VideoPlayer({
  posterClassName,
  title,
  autoPlay = false,
}: {
  posterClassName?: string;
  title: string;
  autoPlay?: boolean;
}) {
  const [reduce, setReduce] = useState(false);
  const [playing, setPlaying] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
  }, []);

  const showMotion = autoPlay && !reduce;

  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden rounded-[24px] bg-ink",
        posterClassName,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#2a2d34,transparent_55%),radial-gradient(circle_at_80%_80%,#f26b4e33,transparent_45%)]" />
      <p className="absolute bottom-6 left-6 max-w-sm text-paper">
        {title}
        <span className="mt-1 block text-sm text-paper/70">
          Placeholder film. Real footage ships with golden samples.
        </span>
      </p>
      {!showMotion || !playing ? (
        <button
          className="absolute inset-0 flex items-center justify-center"
          onClick={() => setPlaying(true)}
          aria-label={`Play ${title}`}
        >
          <span className="flex size-16 items-center justify-center rounded-full bg-paper text-ink">
            <Play className="ml-1 size-6 fill-current" />
          </span>
        </button>
      ) : null}
    </div>
  );
}
