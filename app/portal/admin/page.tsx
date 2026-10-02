import { redirect } from "next/navigation";
import { AdminDesk } from "@/components/portal/admin-desk";
import { requirePortalPage } from "@/lib/portal/session";

export default async function AdminPage() {
  const session = await requirePortalPage("admin");
  if (session.viewAs) redirect("/api/portal/view-as?next=/portal/admin");
  return (
    <>
      <h1 className="font-display text-3xl">Super Admin</h1>
      <p className="mt-2 text-muted">People on Joova, plus the settings only a Super Admin changes.</p>
      <AdminDesk />
    </>
  );
}
