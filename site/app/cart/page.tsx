import { CartPageClient } from "@/components/shop/cart-page-client";
import { getProducts } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const products = await getProducts();
  return <CartPageClient products={products} />;
}
