import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPageView } from "@/components/product/product-page-view";
import { loadProductPage } from "@/lib/content/product-page";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadProductPage(slug);
  if (!page) return { title: "Page not found" };
  return {
    title: page.product.name,
    description: page.product.summary,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const page = await loadProductPage(slug);
  if (!page) notFound();

  return <ProductPageView {...page} />;
}
