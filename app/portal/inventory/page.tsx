import { requirePortalPage } from "@/lib/portal/session";
import { InventoryDesk } from "@/components/portal/inventory-desk";
import { InventorySections } from "@/components/portal/inventory-sections";

export default async function InventoryPage() {
  await requirePortalPage("inventory");
  return (
    <>
      <h1 className="font-display text-3xl">Inventory</h1>
      <p className="mt-2 text-muted">Every product on the site, with pictures, videos, price, shipping, warranty, and sale details. Stock counts stay off the public site. Inactive products stay off the shop.</p>
      <InventorySections current="products" />
      <InventoryDesk />
    </>
  );
}
