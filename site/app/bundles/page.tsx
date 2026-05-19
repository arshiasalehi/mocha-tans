import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/shop/add-to-cart-button";
import { LocaleValue } from "@/components/common/locale-value";
import { formatCurrency } from "@/lib/format";
import { getProducts } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function BundlesPage() {
  const products = await getProducts();
  const bundles = products.filter((product) => product.slug.startsWith("bundle-"));

  return (
    <section className="container-page py-16">
      <h1 className="font-display text-4xl text-[#6e4800]">
        <LocaleValue fr="Forfaits" en="Bundles" />
      </h1>
      <p className="mt-4 max-w-2xl text-zinc-600">
        <LocaleValue
          fr="Achetez des forfaits de séances à tarif réduit. Après paiement, l'équipe Mocha vous contacte pour planifier vos rendez-vous."
          en="Buy discounted multi-session bundles. After payment, the Mocha team will contact you to schedule your appointments."
        />
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {bundles.map((bundle) => (
          <article key={bundle.id} className="overflow-hidden rounded-3xl border border-[#eadfce] bg-white">
            <Image
              src={bundle.image_url ?? "/images/highlight-hours.jpg"}
              alt={bundle.slug}
              width={900}
              height={700}
              className="h-56 w-full object-cover"
            />
            <div className="p-5">
              <h2 className="font-display text-2xl text-[#6e4800]">
                <LocaleValue fr={bundle.name_fr} en={bundle.name_en} />
              </h2>
              <p className="mt-2 text-sm text-zinc-600">
                <LocaleValue fr={bundle.description_fr} en={bundle.description_en} />
              </p>
              <p className="mt-4 text-xl font-bold text-[#8e5e01]">{formatCurrency(bundle.price_cents)}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <AddToCartButton productId={bundle.id} />
                <Link href="/cart" className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-semibold">
                  <LocaleValue fr="Voir panier" en="View cart" />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
