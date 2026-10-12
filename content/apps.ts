export type AppStoreId = "google" | "apple";

export type AppStoreButton = {
  id: string;
  store: AppStoreId;
  kicker: string;
  label: string;
  href: string;
  iconUrl: string;
};

export type AppCard = {
  id: string;
  eyebrow: string;
  title: string;
  lead: string;
  href: string;
  hrefLabel: string;
  steps: string[];
  stores: AppStoreButton[];
};

export type AppNote = {
  id: string;
  title: string;
  body: string;
};

export type AppsContent = {
  kicker: string;
  title: string;
  lead: string;
  phoneTitle: string;
  phoneCopy: string;
  note: string;
  includesHref: string;
  includesLabel: string;
  privacyHref: string;
  privacyLabel: string;
  notes: AppNote[];
  cards: AppCard[];
};

const google = (id: string): AppStoreButton => ({
  id: `${id}-google`,
  store: "google",
  kicker: "GET IT ON",
  label: "Google Play",
  href: "",
  iconUrl: "",
});

const apple = (id: string): AppStoreButton => ({
  id: `${id}-apple`,
  store: "apple",
  kicker: "Download on the",
  label: "App Store",
  href: "",
  iconUrl: "",
});

export const appsContent: AppsContent = {
  kicker: "Download",
  title: "The Joova app",
  lead: "One app for the Activity Tracker Ring and the Activity Tracker Band. It comes with the product. No subscription.",
  phoneTitle: "Joova",
  phoneCopy: "Activity, sleep, and heart-rate trends. No monthly plan.",
  note: "The store buttons open a stand-in listing until the apps are on Google Play and the App Store. On a phone, that same tap will open the store.",
  includesHref: "/app",
  includesLabel: "See what the app includes",
  privacyHref: "/privacy",
  privacyLabel: "Privacy",
  notes: [
    { id: "phone", title: "Your phone", body: "iPhone with iOS 15 or later, or Android 9 or later." },
    { id: "pair", title: "Before you pair", body: "Turn Bluetooth on, then keep the phone close to the device." },
    { id: "data", title: "Your data", body: "Tracker data stays in the Joova app and is never sold." },
  ],
  cards: [
    {
      id: "ring",
      eyebrow: "Joova Smart Ring",
      title: "Activity Tracker Ring",
      lead: "The ring has no screen. Activity, sleep, and heart-rate trends show in the Joova app.",
      href: "/ring",
      hrefLabel: "See the Joova Smart Ring",
      steps: [
        "Use the phone you will keep near the ring.",
        "Choose Google Play on Android, or the App Store on iPhone.",
        "Install Joova, open it, and follow the pairing steps. Leave Bluetooth on.",
      ],
      stores: [google("ring"), apple("ring")],
    },
    {
      id: "band",
      eyebrow: "Joova Fitness Band",
      title: "Activity Tracker Band",
      lead: "The band has no display. Open the Joova app when you want steps, sleep, and heart-rate trends.",
      href: "/band",
      hrefLabel: "See the Joova Fitness Band",
      steps: [
        "Use the phone you will pair with the band.",
        "Choose Google Play on Android, or the App Store on iPhone.",
        "Install Joova, open it, and follow the pairing steps. Leave Bluetooth on.",
      ],
      stores: [google("band"), apple("band")],
    },
  ],
};

export function storeTarget(cardId: string, button: Pick<AppStoreButton, "store" | "href">) {
  const href = button.href.trim();
  if (href) return href;
  return `/apps/store?store=${button.store}&product=${encodeURIComponent(cardId)}`;
}

export function isExternalHref(href: string) {
  return href.startsWith("https://") || href.startsWith("http://");
}

function text(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function stepsOf(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const steps = value.filter((step): step is string => typeof step === "string" && step.trim().length > 0);
  return steps.length ? steps : fallback;
}

export function appsFromRows(
  page: Record<string, unknown> | null,
  notes: Record<string, unknown>[],
  cards: Record<string, unknown>[],
  buttons: Record<string, unknown>[],
  fallback: AppsContent,
): AppsContent {
  const visibleCards = cards.filter((row) => row.deleted_at == null);
  if (!page && visibleCards.length === 0) return fallback;
  const source = page ?? {};
  const visibleNotes = notes.filter((row) => row.deleted_at == null);
  const visibleButtons = buttons.filter((row) => row.deleted_at == null && (row.store === "google" || row.store === "apple"));
  const cardsOut: AppCard[] = visibleCards.length
    ? visibleCards
        .sort((a, b) => Number(a.sort ?? 0) - Number(b.sort ?? 0))
        .map((card) => {
          const id = String(card.id);
          const preset = fallback.cards.find((item) => item.id === id);
          return {
            id,
            eyebrow: text(card.eyebrow, preset?.eyebrow ?? ""),
            title: text(card.title, preset?.title ?? "App"),
            lead: text(card.lead, preset?.lead ?? ""),
            href: text(card.href, preset?.href ?? "/apps"),
            hrefLabel: text(card.href_label, preset?.hrefLabel ?? "Learn more"),
            steps: stepsOf(card.steps, preset?.steps ?? []),
            stores: visibleButtons
              .filter((button) => button.card_id === id)
              .sort((a, b) => Number(a.sort ?? 0) - Number(b.sort ?? 0))
              .map((button) => ({
                id: String(button.id),
                store: button.store as AppStoreId,
                kicker: text(button.kicker, button.store === "google" ? "GET IT ON" : "Download on the"),
                label: text(button.label, button.store === "google" ? "Google Play" : "App Store"),
                href: typeof button.href === "string" ? button.href : "",
                iconUrl: typeof button.icon_url === "string" ? button.icon_url : "",
              })),
          };
        })
    : fallback.cards;
  return {
    kicker: text(source.kicker, fallback.kicker),
    title: text(source.title, fallback.title),
    lead: text(source.lead, fallback.lead),
    phoneTitle: text(source.phone_title, fallback.phoneTitle),
    phoneCopy: text(source.phone_copy, fallback.phoneCopy),
    note: text(source.note, fallback.note),
    includesHref: text(source.includes_href, fallback.includesHref),
    includesLabel: text(source.includes_label, fallback.includesLabel),
    privacyHref: text(source.privacy_href, fallback.privacyHref),
    privacyLabel: text(source.privacy_label, fallback.privacyLabel),
    notes: visibleNotes
      .sort((a, b) => Number(a.sort ?? 0) - Number(b.sort ?? 0))
      .map((note) => ({
        id: String(note.id),
        title: text(note.title, "Note"),
        body: text(note.body, ""),
      }))
      .filter((note) => note.body),
    cards: cardsOut,
  };
}
