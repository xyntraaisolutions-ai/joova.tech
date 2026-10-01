import { requirePortalPage } from "@/lib/portal/session";
import { FulfillmentDesk } from "@/components/portal/fulfillment-desk";
import { InventorySections } from "@/components/portal/inventory-sections";

export default async function FulfillmentPage() {
  await requirePortalPage("inventory");
  return (
    <>
      <h1 className="font-display text-3xl">Fulfillment</h1>
      <p className="mt-2 text-muted">Move each order from placed to delivered. Add the carrier and tracking number when it ships. Stock on hand drops at that step.</p>
      <InventorySections current="fulfillment" />
      <FulfillmentDesk />
    </>
  );
}
