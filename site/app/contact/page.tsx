import { LocaleValue } from "@/components/common/locale-value";
import { getSiteSettings } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const business = settings.business;

  return (
    <section className="container-page py-16">
      <h1 className="font-display text-4xl text-[#6e4800]">
        <LocaleValue fr="Contact" en="Contact" />
      </h1>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <article className="rounded-2xl border border-[#eadfce] bg-white p-6">
          <h2 className="font-display text-2xl text-[#6e4800]">
            <LocaleValue fr="Studio" en="Studio" />
          </h2>
          <p className="mt-3 text-zinc-700">{business.address}</p>
          <p className="mt-1 text-zinc-700">{business.email}</p>
          {business.phone ? <p className="mt-1 text-zinc-700">{business.phone}</p> : null}
          <a className="mt-4 inline-block text-[#8e5e01] underline" href={business.instagram}>
            Instagram
          </a>
        </article>
        <article className="rounded-2xl border border-[#eadfce] bg-white p-6">
          <h2 className="font-display text-2xl text-[#6e4800]">
            <LocaleValue fr="Politique de réservation" en="Booking Policy" />
          </h2>
          <p className="mt-3 text-zinc-700">{settings.policies.cancellation}</p>
        </article>
      </div>
    </section>
  );
}
