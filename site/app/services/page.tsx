import { LocaleValue } from "@/components/common/locale-value";
import { getServices } from "@/lib/public-data";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <section className="container-page py-16">
      <h1 className="font-display text-4xl text-[#6e4800]">
        <LocaleValue fr="Services" en="Services" />
      </h1>
      <p className="mt-3 text-zinc-600">
        <LocaleValue
          fr="Réservez directement dans notre système de réservation interne."
          en="Book directly from our in-house scheduling system."
        />
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {services.map((service) => (
          <article key={service.id} className="rounded-3xl border border-[#eadfce] bg-white p-6">
            <h2 className="font-display text-2xl text-[#6e4800]">
              <LocaleValue fr={service.name_fr} en={service.name_en} />
            </h2>
            <p className="mt-2 text-zinc-600">
              <LocaleValue fr={service.description_fr} en={service.description_en} />
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-zinc-500">{service.duration_min} min</span>
              <span className="font-bold text-[#8e5e01]">{formatCurrency(service.price_cents)}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
