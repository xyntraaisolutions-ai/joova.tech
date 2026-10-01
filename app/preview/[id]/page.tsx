import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPageView } from "@/components/product/product-page-view";
import { loadStaffProduct } from "@/lib/content/product-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Product preview",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ id: string }> };

export default async function ProductPreviewPage({ params }: Props) {
  const { id } = await params;
  const page = await loadStaffProduct(decodeURIComponent(id));
  if (!page) notFound();
  return <ProductPageView {...page} />;
}
