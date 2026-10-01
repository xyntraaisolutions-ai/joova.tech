"use client";

import Link from "next/link";
import { useSiteContent } from "@/components/layout/site-content";
import { noticeBackgrounds, noticeFontColors, type NoticeBackground, type NoticeFontColor } from "@/content/site";

function paint(color: NoticeFontColor, background: NoticeBackground) {
  return {
    color: noticeFontColors.find((item) => item.id === color)?.value,
    backgroundColor: noticeBackgrounds.find((item) => item.id === background)?.value,
  };
}

export function AnnouncementBar() {
  const { notices } = useSiteContent();
  const development = notices.development.enabled && notices.development.text;
  const shipping = notices.shipping.enabled && notices.shipping.text;
  if (!development && !shipping) return null;

  return (
    <div className="pt-[env(safe-area-inset-top)]">
      {development ? (
        <p
          className="joova-focus-blink px-4 py-2 text-center text-[13px] font-bold leading-snug tracking-wide sm:text-sm"
          style={paint(notices.development.color, notices.development.background)}
        >
          {notices.development.text}
        </p>
      ) : null}
      {shipping ? (
        <p
          className="px-4 py-2 text-center text-[13px] font-medium leading-snug tracking-wide sm:text-sm"
          style={paint(notices.shipping.color, notices.shipping.background)}
        >
          <Link href="/shop" className="underline-offset-4 hover:underline">
            {notices.shipping.text}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
