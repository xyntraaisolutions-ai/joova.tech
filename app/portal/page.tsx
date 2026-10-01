import { redirect } from "next/navigation";
import { portalHome } from "@/lib/portal/roles";
import { readPortalProfile, readViewAs } from "@/lib/portal/session";

export default async function PortalIndex() {
  const session = await readPortalProfile();
  if (!session) redirect("/account?mode=sign-in&next=/portal");
  if (session.profile.role === "customer") redirect("/account");
  redirect(portalHome(session.profile.role, await readViewAs(session.profile.role)));
}
