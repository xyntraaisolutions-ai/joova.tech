import { requirePortalPage } from "@/lib/portal/session";
import { InventorySections } from "@/components/portal/inventory-sections";
import { LowStockList } from "@/components/portal/low-stock";

export default async function LowStockPage() {
  await requirePortalPage("inventory");
  return (
    <>
      <h1 className="font-display text-3xl">Low level stock</h1>
      <p className="mt-2 text-muted">Products that match the low stock rule set on their inventory details.</p>
      <InventorySections current="low-stock" />
      <LowStockList />
    </>
  );
}
