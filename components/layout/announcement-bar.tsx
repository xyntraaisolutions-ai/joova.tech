import Link from "next/link";
import { announcement } from "@/content/site";

export function AnnouncementBar() {
  return (
    <div className="cinematic flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 text-center text-[13px] font-medium leading-snug tracking-wide sm:text-sm">
      <Link href="/shop" className="underline-offset-4 hover:underline">
        {announcement}
      </Link>
      <span className="joova-focus-blink font-bold text-coral">
        This Website is in Development Phase
      </span>
    </div>
  );
}
