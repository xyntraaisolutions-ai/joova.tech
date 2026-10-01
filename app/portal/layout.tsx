import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PortalFrame } from "@/components/portal/portal-frame";
import { readPortalProfile, readViewAs } from "@/lib/portal/session";
import { portalClock } from "@/lib/portal/timeout";
import { portalEnvironmentLabel } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Portal",
  robots: { index: false, follow: false },
};

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await readPortalProfile();
  if (!session) redirect("/account?mode=sign-in&next=/portal");
  if (session.profile.role === "customer") redirect("/account");
  const clock = await portalClock();
  if (clock.state === "expired") redirect("/api/auth/portal-signout");
  if (clock.state === "missing") redirect("/api/portal/session?next=/portal");
  const viewAs = await readViewAs(session.profile.role);
  return (
    <PortalFrame role={session.profile.role} viewAs={viewAs} name={session.profile.name} environment={portalEnvironmentLabel()}>
      {children}
    </PortalFrame>
  );
}
