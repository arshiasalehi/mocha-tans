import { LocaleValue } from "@/components/common/locale-value";
import { getReviews } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const reviews = await getReviews();

  return (
    <section className="container-page py-16">
      <h1 className="font-display text-4xl text-[#6e4800]">
        <LocaleValue fr="Avis" en="Reviews" />
      </h1>
      <div className="mt-8 space-y-4">
        {reviews.map((review) => (
          <article key={review.id} className="rounded-2xl border border-[#eadfce] bg-white p-6">
            <p className="text-sm text-zinc-500">{review.source ?? "Client"}</p>
            <p className="mt-2 text-zinc-700">
              “<LocaleValue fr={review.quote_fr} en={review.quote_en} />”
            </p>
            <p className="mt-3 font-semibold text-[#6e4800]">{review.author_name}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
