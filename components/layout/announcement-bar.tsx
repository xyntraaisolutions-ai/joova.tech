import Link from "next/link";
import { announcement } from "@/content/site";

export function AnnouncementBar() {
  return (
    <div className="cinematic px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 text-center text-[13px] font-medium leading-snug tracking-wide sm:text-sm">
      <Link href="/shop" className="underline-offset-4 hover:underline">
        {announcement}
      </Link>
    </div>
  );
}
