import Image from "next/image";
import Link from "next/link";
import { isExternalHref, type AppStoreId } from "@/content/apps";
import { cn } from "@/lib/utils";

export function StoreMark({ store, className }: { store: AppStoreId; className?: string }) {
  return store === "apple" ? <AppleMark className={className} /> : <PlayMark className={className} />;
}

export function StoreBadge({
  store,
  href,
  name,
  kicker,
  label,
  iconUrl,
  className,
}: {
  store: AppStoreId;
  href: string;
  name: string;
  kicker?: string;
  label?: string;
  iconUrl?: string;
  className?: string;
}) {
  const storeLabel = label || (store === "google" ? "Google Play" : "App Store");
  const storeKicker = kicker || (store === "google" ? "GET IT ON" : "Download on the");
  const classNames = cn(
    "inline-flex h-14 min-w-[11.5rem] items-center gap-3 rounded-[0.7rem] bg-[var(--fixed-ink)] px-4 text-[var(--fixed-paper)] transition hover:brightness-125",
    className,
  );
  const inner = (
    <>
      {iconUrl ? (
        <Image src={iconUrl} alt="" width={28} height={28} className="size-7 object-contain" />
      ) : (
        <StoreMark store={store} />
      )}
      <span className="text-left">
        <span className="block text-[10px] font-medium leading-none tracking-wide opacity-80">{storeKicker}</span>
        <span className="mt-1 block text-[1.05rem] font-semibold leading-none tracking-tight">{storeLabel}</span>
      </span>
      <span className="sr-only"> for the {name}</span>
    </>
  );
  if (isExternalHref(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classNames}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={classNames}>
      {inner}
    </Link>
  );
}

function AppleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-7 shrink-0", className)} aria-hidden="true">
      <path
        fill="currentColor"
        d="M16.37 12.72c-.03-2.35 1.92-3.48 2.01-3.53-1.1-1.6-2.8-1.82-3.4-1.84-1.45-.15-2.83.85-3.56.85-.74 0-1.87-.83-3.08-.81-1.58.02-3.04.92-3.86 2.34-1.65 2.86-.42 7.09 1.18 9.41.79 1.14 1.72 2.41 2.95 2.37 1.18-.05 1.63-.76 3.06-.76s1.83.76 3.08.74c1.28-.02 2.08-1.15 2.86-2.3.9-1.31 1.27-2.58 1.29-2.64-.03-.01-2.47-.95-2.5-3.76zM14.55 6.3c.65-.79 1.09-1.88.97-2.97-.94.04-2.08.63-2.75 1.41-.6.7-1.13 1.82-.99 2.89 1.05.08 2.12-.53 2.77-1.33z"
      />
    </svg>
  );
}

function PlayMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-7 shrink-0", className)} aria-hidden="true">
      <path fill="#4285F4" d="M1.6 1.5c-.4.4-.6.9-.6 1.5v18c0 .6.2 1.1.6 1.5l.1.1 10.1-10.1v-.2L1.7 1.4z" />
      <path fill="#34A853" d="M16.6 15.6 12.1 11.1 1.7 21.5c.5.5 1.2.6 1.9.1l12.9-7.1.1.1z" />
      <path fill="#FBBC04" d="M20.6 10.6 16.6 8.4 12.1 12.9l4.5 4.5 4-2.3c1-.6 1-1.9 0-2.5z" />
      <path fill="#EA4335" d="M16.6 8.4 3.6 1.1c-.7-.4-1.4-.4-1.9.3L12.1 12.9l4.5-4.5z" />
    </svg>
  );
}
