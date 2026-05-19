import { LocaleValue } from "@/components/common/locale-value";
import { getSiteSettings } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function PoliciesPage() {
  const settings = await getSiteSettings();
  const policies = settings.policies;

  return (
    <section className="container-page py-16">
      <h1 className="font-display text-4xl text-[#6e4800]">
        <LocaleValue fr="Politiques" en="Policies" />
      </h1>
      <article className="mt-8 rounded-2xl border border-[#eadfce] bg-white p-6">
        <h2 id="cancellation" className="font-display text-2xl text-[#6e4800]">
          <LocaleValue fr="Annulation / Remboursement" en="Cancellation / Refund" />
        </h2>
        <p className="mt-3 text-zinc-700">{policies.cancellation}</p>
      </article>
      <article className="mt-4 rounded-2xl border border-[#eadfce] bg-white p-6">
        <h2 className="font-display text-2xl text-[#6e4800]">
          <LocaleValue fr="Confidentialité" en="Privacy" />
        </h2>
        <p className="mt-3 text-zinc-700">
          {policies.privacy ||
            "We collect only required customer and payment metadata for booking and order fulfillment. Payment card data is handled by Stripe."}
        </p>
      </article>
      <article className="mt-4 rounded-2xl border border-[#eadfce] bg-white p-6">
        <h2 className="font-display text-2xl text-[#6e4800]">
          <LocaleValue fr="Conditions" en="Terms" />
        </h2>
        <p className="mt-3 text-zinc-700">
          {policies.terms ||
            "By using this website, you agree to our booking and order policies. For any issue, contact Mocha Tans directly."}
        </p>
      </article>
    </section>
  );
}
