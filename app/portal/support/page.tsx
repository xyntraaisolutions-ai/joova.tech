import { requirePortalPage } from "@/lib/portal/session";
import { SupportDesk } from "@/components/portal/support-desk";

export default async function SupportPage() {
  await requirePortalPage("support");
  return (
    <>
      <h1 className="font-display text-3xl">Customer support</h1>
      <p className="mt-2 text-muted">Customer accounts, messages, orders, returns, and warranty.</p>
      <SupportDesk />
    </>
  );
}
