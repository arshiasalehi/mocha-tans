"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/providers/cart-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { formatCurrency } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ShopPageClient({ products }: { products: Product[] }) {
  const { addItem } = useCart();
  const { locale } = useLocale();

  return (
    <section className="container-page py-16">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl text-[#6e4800]">{locale === "fr" ? "Boutique" : "Shop"}</h1>
        <Link href="/cart" className="rounded-full bg-[#8e5e01] px-5 py-2 text-sm text-white">
          {locale === "fr" ? "Voir panier" : "View cart"}
        </Link>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-4">
        {products.map((product) => (
          <article key={product.id} className="overflow-hidden rounded-3xl border border-[#eadfce] bg-white">
            <Link href={`/shop/${product.slug}`}>
              <Image
                src={product.image_url ?? "/images/products-safe-1.jpg"}
                alt={product.slug}
                width={640}
                height={640}
                className="h-52 w-full object-cover"
              />
            </Link>
            <div className="p-4">
              <h2 className="font-semibold text-[#6e4800]">
                <Link href={`/shop/${product.slug}`}>{locale === "fr" ? product.name_fr : product.name_en}</Link>
              </h2>
              <p className="mt-1 line-clamp-2 text-sm text-zinc-600">
                {locale === "fr" ? product.description_fr : product.description_en}
              </p>
              <p className="mt-3 font-bold text-[#8e5e01]">{formatCurrency(product.price_cents)}</p>
              <button
                type="button"
                onClick={() => addItem(product.id, 1)}
                className="mt-3 w-full rounded-full bg-[#8e5e01] px-4 py-2 text-sm font-semibold text-white"
              >
                {locale === "fr" ? "Ajouter" : "Add"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
