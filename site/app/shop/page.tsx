import { ShopPageClient } from "@/components/shop/shop-page-client";
import { getProducts } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const products = await getProducts();
  return <ShopPageClient products={products} />;
}
