import Link from "next/link";
import { cn } from "@/lib/utils";

const groups = [
  {
    id: "site",
    label: "Site",
    items: [
      { id: "settings", label: "Settings" },
      { id: "policies", label: "Policies" },
    ],
  },
  {
    id: "menus",
    label: "Menus",
    items: [
      { id: "header", label: "Header" },
      { id: "footer", label: "Footer" },
    ],
  },
  {
    id: "pages",
    label: "Pages",
    items: [
      { id: "page:about", label: "About" },
      { id: "page:privacy", label: "Privacy" },
      { id: "page:terms", label: "Terms" },
      { id: "page:accessibility", label: "Accessibility" },
      { id: "page:returns", label: "Returns" },
      { id: "page:warranty", label: "Warranty page" },
    ],
  },
  { id: "blogs", label: "Blogs", items: [{ id: "blogs", label: "Blogs" }] },
  {
    id: "library",
    label: "Library",
    items: [
      { id: "videos", label: "Videos" },
      { id: "help", label: "Help" },
    ],
  },
  { id: "warranty", label: "Warranty", items: [{ id: "warranty", label: "Devices" }] },
  { id: "media", label: "Media", items: [{ id: "media", label: "Files" }] },
  {
    id: "channels",
    label: "Channels",
    items: [
      { id: "support-menu", label: "Support menu" },
      { id: "support-channels", label: "Reply times" },
    ],
  },
  { id: "blocks", label: "Blocks", items: [{ id: "blocks", label: "Blocks" }] },
  {
    id: "reviews",
    label: "Reviews",
    items: [
      { id: "reviews", label: "Reviews" },
    ],
  },
] as const;

function groupCount(id: string, counts: ContentCounts) {
  const parts: Record<string, string[]> = {
    menus: ["header", "footer"],
    blogs: ["blogs"],
    library: ["videos", "help"],
    warranty: ["warranty"],
    media: ["media"],
    channels: ["support-menu", "support-channels"],
    blocks: ["blocks"],
    reviews: ["reviews"],
  };
  const keys = parts[id];
  if (!keys || keys.some((key) => counts[key] === undefined)) return undefined;
  return keys.reduce((sum, key) => sum + (counts[key] ?? 0), 0);
}

export function contentSection(tab: string | undefined, section: string | undefined) {
  if (tab === "blogs" || tab === "blog" || section === "blogs" || section === "blog") {
    return { tab: "blogs", section: "blogs" };
  }
  const group = groups.find((entry) => entry.id === tab) ?? groups[0];
  const active = group.items.some((item) => item.id === section) ? section! : group.items[0].id;
  return { tab: group.id, section: active };
}

export type ContentCounts = Partial<Record<string, number>>;

function counted(label: string, count: number | undefined) {
  return count === undefined ? label : `${label} (${count})`;
}

export function ContentTabs({ tab, section, counts = {} }: { tab: string; section: string; counts?: ContentCounts }) {
  const group = groups.find((entry) => entry.id === tab) ?? groups[0];
  return (
    <div className="mt-6">
      <nav className="flex flex-wrap gap-2" aria-label="Content categories">
        {groups.map((entry) => {
          const selected = entry.id === group.id;
          return (
            <Link
              key={entry.id}
              href={`/portal/content?tab=${entry.id}&section=${entry.items[0].id}`}
              aria-current={selected ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold",
                selected ? "bg-ink text-paper" : "border border-stone text-ink",
              )}
            >
              {counted(entry.label, groupCount(entry.id, counts))}
            </Link>
          );
        })}
      </nav>
      {group.items.length > 1 ? (
        <nav className="mt-3 flex flex-wrap gap-2" aria-label={group.label}>
          {group.items.map((item) => {
            const selected = item.id === section;
            return (
              <Link
                key={item.id}
                href={`/portal/content?tab=${group.id}&section=${item.id}`}
                aria-current={selected ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full px-4 text-sm",
                  selected ? "border border-ink font-bold text-ink" : "text-muted",
                )}
              >
                {counted(item.label, counts[item.id])}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
