import Link from "next/link";
import { announcement } from "@/content/site";

export function AnnouncementBar() {
  return (
    <div className="cinematic px-4 py-2.5 text-center text-sm font-medium tracking-wide">
      <Link href="/band" className="underline-offset-4 hover:underline">
        {announcement}
      </Link>
    </div>
  );
}
