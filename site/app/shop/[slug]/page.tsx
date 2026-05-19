import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/shop/add-to-cart-button";
import { formatCurrency } from "@/lib/format";
import { getProducts } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const products = await getProducts();
  const product = products.find((item) => item.slug === slug);

  if (!product) {
    notFound();
  }

  return (
    <section className="container-page py-16">
      <Link href="/shop" className="text-sm text-[#8e5e01] underline">
        Back to shop
      </Link>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-[#eadfce] bg-white">
          <Image
            src={product.image_url ?? "/images/products-safe-1.jpg"}
            alt={product.name_fr}
            width={900}
            height={900}
            className="h-full w-full object-cover"
          />
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Mocha Shop</p>
          <h1 className="mt-2 font-display text-4xl text-[#6e4800]">{product.name_fr}</h1>
          <p className="mt-2 text-zinc-600">{product.description_fr}</p>
          <p className="mt-4 text-2xl font-bold text-[#8e5e01]">{formatCurrency(product.price_cents)}</p>
          <div className="mt-6">
            <AddToCartButton productId={product.id} />
          </div>
        </div>
      </div>
    </section>
  );
}
