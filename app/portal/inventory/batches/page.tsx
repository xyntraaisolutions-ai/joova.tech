import { requirePortalPage } from "@/lib/portal/session";
import { BatchRequests } from "@/components/portal/batch-requests";
import { InventorySections } from "@/components/portal/inventory-sections";

export default async function BatchRequestsPage() {
  await requirePortalPage("inventory");
  return (
    <>
      <h1 className="font-display text-3xl">Batch requests</h1>
      <p className="mt-2 text-muted">Track what we order from a manufacturer or vendor. Each batch keeps the items, models, quantity, unit price, discount, and any documents.</p>
      <InventorySections current="batches" />
      <BatchRequests />
    </>
  );
}
