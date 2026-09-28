import type { Metadata } from "next";
import { AppPreview } from "@/components/home/app-preview";
import { PhoneMockup } from "@/components/media/phone-mockup";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { appScreens } from "@/content/site";

export const metadata: Metadata = {
  title: "The Joova app",
  description:
    "Every Joova app feature is free. Your data is stored in the US and never sold.",
};

export default function AppPage() {
  return (
    <>
      <Container className="py-10 md:py-16">
        <h1
          className="font-display max-w-3xl font-extrabold"
          style={{ fontSize: "var(--text-h1)" }}
        >
          APP Download
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">
          The app is included. Your data stays yours.
        </p>
        <p className="mt-4 max-w-2xl text-muted">
          Your data is stored in the US and never sold. You can delete your
          account in the app. Supported phones: iPhone with iOS 15 or later, and
          Android 9 or later. Store links go live after App Store and Google
          Play approval.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Badge>App Store (after approval)</Badge>
          <Badge>Google Play (after approval)</Badge>
        </div>
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
