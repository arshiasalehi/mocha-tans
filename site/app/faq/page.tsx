import { LocaleValue } from "@/components/common/locale-value";
import { getFaqs } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function FaqPage() {
  const faqs = await getFaqs();

  return (
    <section className="container-page py-16">
      <h1 className="font-display text-4xl text-[#6e4800]">FAQ</h1>
      <div className="mt-8 space-y-4">
        {faqs.map((faq) => (
          <details key={faq.id} className="rounded-2xl border border-[#eadfce] bg-white p-5">
            <summary className="cursor-pointer font-semibold text-[#6e4800]">
              <LocaleValue fr={faq.question_fr} en={faq.question_en} />
            </summary>
            <p className="mt-3 text-zinc-700">
              <LocaleValue fr={faq.answer_fr} en={faq.answer_en} />
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
