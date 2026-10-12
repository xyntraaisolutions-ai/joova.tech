import type { Metadata } from "next";
import Link from "next/link";
import { AppPreview } from "@/components/home/app-preview";
import { PhoneMockup } from "@/components/media/phone-mockup";
import { Container } from "@/components/ui/container";
import { loadContentBundle } from "@/lib/content/load";

export const metadata: Metadata = {
  title: "The Joova app",
  description:
    "Every Joova app feature is free. Tracker data is stored by the Joova app and is never sold.",
};

export default async function AppPage() {
  const { appScreens } = await loadContentBundle();
  return (
    <>
      <Container className="py-10 md:py-16">
        <h1
          className="font-display max-w-3xl font-extrabold"
          style={{ fontSize: "var(--text-h1)" }}
        >
          The Joova app
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">
          The app is included. Your data stays yours.
        </p>
        <p className="mt-4 max-w-2xl text-muted">
          Tracker data is stored by the Joova app and is never sold. See the{" "}
          <Link href="/privacy" className="text-ink underline">
            Privacy page
          </Link>
          . You can delete your account in the app. Supported phones: iPhone
          with iOS 15 or later, and Android 9 or later. Store links go live
          after App Store and Google Play approval.
        </p>
        <p className="mt-6">
          <Link href="/apps" className="font-bold text-ink underline">Download for the ring or the band</Link>
        </p>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {appScreens.map((screen) => (
            <PhoneMockup
              key={screen.id}
              title={screen.title}
              copy={screen.copy}
            />
          ))}
        </div>
      </Container>
      <AppPreview />
    </>
  );
}
