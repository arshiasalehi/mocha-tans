import { saveFaqAction, saveReviewAction } from "@/app/admin/actions";
import { createAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

function FaqForm({
  defaults,
}: {
  defaults?: {
    id?: string;
    question_fr?: string;
    question_en?: string;
    answer_fr?: string;
    answer_en?: string;
    sort_order?: number;
    active?: boolean;
  };
}) {
  return (
    <form action={saveFaqAction} className="grid gap-3 rounded-2xl border border-[#eadfce] bg-white p-5">
      <h3 className="font-display text-xl text-[#6e4800]">{defaults?.id ? "Edit FAQ" : "Add FAQ"}</h3>
      {defaults?.id ? <input type="hidden" name="id" value={defaults.id} /> : null}
      <input
        required
        name="question_fr"
        defaultValue={defaults?.question_fr ?? ""}
        placeholder="Question FR"
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />
      <input
        required
        name="question_en"
        defaultValue={defaults?.question_en ?? ""}
        placeholder="Question EN"
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />
      <textarea
        required
        name="answer_fr"
        defaultValue={defaults?.answer_fr ?? ""}
        placeholder="Answer FR"
        rows={3}
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />
      <textarea
        required
        name="answer_en"
        defaultValue={defaults?.answer_en ?? ""}
        placeholder="Answer EN"
        rows={3}
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />
      <div className="grid gap-3 md:grid-cols-2">
        <input
          type="number"
          name="sort_order"
          defaultValue={defaults?.sort_order ?? 0}
          placeholder="Sort order"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={defaults?.active ?? true} /> Active
        </label>
      </div>
      <button type="submit" className="w-fit rounded-full bg-[#8e5e01] px-5 py-2 text-sm font-semibold text-white">
        Save FAQ
      </button>
    </form>
  );
}

function ReviewForm({
  defaults,
}: {
  defaults?: {
    id?: string;
    author_name?: string;
    rating?: number;
    quote_fr?: string;
    quote_en?: string;
    source?: string | null;
    active?: boolean;
  };
}) {
  return (
    <form action={saveReviewAction} className="grid gap-3 rounded-2xl border border-[#eadfce] bg-white p-5">
      <h3 className="font-display text-xl text-[#6e4800]">{defaults?.id ? "Edit Review" : "Add Review"}</h3>
      {defaults?.id ? <input type="hidden" name="id" value={defaults.id} /> : null}
      <div className="grid gap-3 md:grid-cols-2">
        <input
          required
          name="author_name"
          defaultValue={defaults?.author_name ?? ""}
          placeholder="Author"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        <input
          required
          type="number"
          min={1}
          max={5}
          name="rating"
          defaultValue={defaults?.rating ?? 5}
          placeholder="Rating"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <textarea
        required
        name="quote_fr"
        defaultValue={defaults?.quote_fr ?? ""}
        placeholder="Quote FR"
        rows={3}
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />
      <textarea
        required
        name="quote_en"
        defaultValue={defaults?.quote_en ?? ""}
        placeholder="Quote EN"
        rows={3}
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />
      <input
        name="source"
        defaultValue={defaults?.source ?? ""}
        placeholder="Source"
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={defaults?.active ?? true} /> Active
      </label>
      <button type="submit" className="w-fit rounded-full bg-[#8e5e01] px-5 py-2 text-sm font-semibold text-white">
        Save Review
      </button>
    </form>
  );
}

export default async function AdminContentPage() {
  const supabase = createAdminClient();
  const [{ data: faqs }, { data: reviews }] = await Promise.all([
    supabase
      .from("faqs")
      .select("id, question_fr, question_en, answer_fr, answer_en, sort_order, active")
      .order("sort_order", { ascending: true }),
    supabase
      .from("reviews")
      .select("id, author_name, rating, quote_fr, quote_en, source, active")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <section className="space-y-8">
      <div>
        <h2 className="font-display text-3xl text-[#6e4800]">FAQ Content</h2>
        <div className="mt-4 grid gap-4">
          <FaqForm />
          {(faqs ?? []).map((faq) => (
            <FaqForm key={faq.id} defaults={faq} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-display text-3xl text-[#6e4800]">Reviews Content</h2>
        <div className="mt-4 grid gap-4">
          <ReviewForm />
          {(reviews ?? []).map((review) => (
            <ReviewForm key={review.id} defaults={review} />
          ))}
        </div>
      </div>
    </section>
  );
}
