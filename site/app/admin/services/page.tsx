import { saveServiceAction } from "@/app/admin/actions";
import { createAdminClient } from "@/utils/supabase/admin";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

function ServiceForm({
  title,
  defaults,
}: {
  title: string;
  defaults?: {
    id?: string;
    name_fr?: string;
    name_en?: string;
    description_fr?: string;
    description_en?: string;
    duration_min?: number;
    price_cents?: number;
    active?: boolean;
    image_url?: string | null;
  };
}) {
  return (
    <form action={saveServiceAction} className="grid gap-3 rounded-2xl border border-[#eadfce] bg-white p-5">
      <h3 className="font-display text-xl text-[#6e4800]">{title}</h3>
      {defaults?.id ? <input type="hidden" name="id" value={defaults.id} /> : null}
      <div className="grid gap-3 md:grid-cols-2">
        <input
          required
          name="name_fr"
          defaultValue={defaults?.name_fr ?? ""}
          placeholder="Nom FR"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        <input
          required
          name="name_en"
          defaultValue={defaults?.name_en ?? ""}
          placeholder="Name EN"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <textarea
        required
        name="description_fr"
        defaultValue={defaults?.description_fr ?? ""}
        placeholder="Description FR"
        rows={2}
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />
      <textarea
        required
        name="description_en"
        defaultValue={defaults?.description_en ?? ""}
        placeholder="Description EN"
        rows={2}
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />
      <div className="grid gap-3 md:grid-cols-3">
        <input
          required
          type="number"
          name="duration_min"
          defaultValue={defaults?.duration_min ?? 60}
          placeholder="Duration (min)"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        <input
          required
          type="number"
          name="price_cents"
          defaultValue={defaults?.price_cents ?? 0}
          placeholder="Price (cents)"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        <input
          name="image_url"
          defaultValue={defaults?.image_url ?? ""}
          placeholder="Image URL"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={defaults?.active ?? true} /> Active
      </label>
      <button type="submit" className="w-fit rounded-full bg-[#8e5e01] px-5 py-2 text-sm font-semibold text-white">
        Save service
      </button>
    </form>
  );
}

export default async function AdminServicesPage() {
  const supabase = createAdminClient();
  const { data: services } = await supabase
    .from("services")
    .select("id, name_fr, name_en, description_fr, description_en, duration_min, price_cents, active, image_url")
    .order("created_at", { ascending: true });

  return (
    <section className="space-y-4">
      <h2 className="font-display text-3xl text-[#6e4800]">Services & Pricing</h2>
      <p className="text-sm text-zinc-600">Edit pricing in cents (e.g. 5500 = {formatCurrency(5500)}).</p>

      <ServiceForm title="Add New Service" />

      <div className="grid gap-4">
        {(services ?? []).map((service) => (
          <ServiceForm key={service.id} title={`Edit: ${service.name_fr}`} defaults={service} />
        ))}
      </div>
    </section>
  );
}
