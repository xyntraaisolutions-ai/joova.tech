import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StoreMark } from "@/components/apps/store-badge";
import { Container } from "@/components/ui/container";
import { buttonClassName } from "@/components/ui/button";
import { loadContentBundle } from "@/lib/content/load";

const stores = {
  google: { id: "google" as const, name: "Google Play", action: "Install" },
  apple: { id: "apple" as const, name: "App Store", action: "Get" },
};

export const metadata: Metadata = {
  title: "App download",
  robots: { index: false, follow: false },
};

export default async function StorePreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ store?: string; product?: string }>;
}) {
  const params = await searchParams;
  const store = params.store === "apple" || params.store === "google" ? stores[params.store] : null;
  const { apps } = await loadContentBundle();
  const card = apps.cards.find((item) => item.id === params.product);
  if (!store || !card) notFound();
  const button = card.stores.find((item) => item.store === store.id);

  return (
    <Container className="py-10 md:py-16">
      <article className="mx-auto max-w-lg rounded-[2rem] border border-stone bg-white p-6 md:p-8">
        <p className="flex items-center gap-2 text-sm font-bold text-muted">
          <StoreMark store={store.id} className="size-5" />
          {button?.label || store.name}
        </p>
        <h1 className="mt-2 font-display text-4xl font-extrabold">{card.title}</h1>
        <p className="mt-3 text-muted">
          Stand-in listing for the {card.title}. The real {button?.label || store.name} page will open here when the app is approved.
        </p>
        <div className="mt-8 flex items-start gap-4">
          <div className="flex size-20 shrink-0 items-center justify-center rounded-[1.4rem] bg-[var(--fixed-ink)] font-display text-3xl font-bold text-[var(--fixed-paper)]" aria-hidden="true">
            J
          </div>
          <div>
            <h2 className="font-display text-2xl">{card.eyebrow || card.title}</h2>
            <p className="text-sm text-muted">Joova Tech LLC</p>
            <p className="mt-3 text-sm">{card.lead}</p>
          </div>
        </div>
        <p className="mt-6 rounded-2xl bg-stone/40 p-4 text-sm" role="status">
          {store.action} is not live yet. Nothing is installed from this page.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <span className="inline-flex h-12 items-center rounded-full bg-[var(--fixed-ink)] px-6 font-bold text-[var(--fixed-paper)]">{store.action}</span>
          <Link href="/apps" className={buttonClassName("secondary", "sm")}>Back to Apps</Link>
        </div>
      </article>
    </Container>
  );
}
