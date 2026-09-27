"use client";

import type { FocusEvent, MouseEvent, ReactNode } from "react";

export function ProductTurntable({ children }: { children: ReactNode }) {
  const pause = (event: MouseEvent<HTMLDivElement> | FocusEvent<HTMLDivElement>) => {
    event.currentTarget.dataset.paused = "true";
  };

  const resume = (event: MouseEvent<HTMLDivElement> | FocusEvent<HTMLDivElement>) => {
    if ("relatedTarget" in event && event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }
    delete event.currentTarget.dataset.paused;
  };

  return (
    <div
      className="product-turntable"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
    >
      <div className="product-turntable-spin">{children}</div>
      <span className="sr-only">
        This product view turns slowly in 3D and stops while the pointer is over it.
      </span>
    </div>
  );
}
