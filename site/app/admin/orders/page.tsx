import { setOrderStatusAction } from "@/app/admin/actions";
import { createAdminClient } from "@/utils/supabase/admin";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

const statusOptions = ["pending", "paid", "fulfilled", "cancelled"];

export default async function AdminOrdersPage() {
  const supabase = createAdminClient();

  const [{ data: orders }, { data: orderItems }, { data: events }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, customer_name, customer_email, created_at, status, subtotal_cents, tax_cents, total_cents, pickup_notes")
      .order("created_at", { ascending: false }),
    supabase
      .from("order_items")
      .select("order_id, quantity, line_total_cents, products(name_fr)")
      .order("order_id", { ascending: true }),
    supabase
      .from("order_events")
      .select("order_id, event_type, actor, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const itemsByOrder = new Map<string, Array<{ quantity: number; line_total_cents: number; name_fr: string }>>();
  for (const item of orderItems ?? []) {
    const rows = itemsByOrder.get(item.order_id) ?? [];
    const name =
      item.products && Array.isArray(item.products) && item.products[0] && "name_fr" in item.products[0]
        ? String(item.products[0].name_fr)
        : "Product";

    rows.push({
      quantity: item.quantity,
      line_total_cents: item.line_total_cents,
      name_fr: name,
    });

    itemsByOrder.set(item.order_id, rows);
  }

  const latestEventByOrder = new Map<string, { event_type: string; actor: string; created_at: string }>();
  for (const event of events ?? []) {
    if (!latestEventByOrder.has(event.order_id)) {
      latestEventByOrder.set(event.order_id, {
        event_type: event.event_type,
        actor: event.actor,
        created_at: event.created_at,
      });
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="font-display text-3xl text-[#6e4800]">Orders Management</h2>
      <div className="grid gap-4">
        {(orders ?? []).map((order) => {
          const items = itemsByOrder.get(order.id) ?? [];
          const latestEvent = latestEventByOrder.get(order.id);

          return (
            <article key={order.id} className="rounded-2xl border border-[#eadfce] bg-white p-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-semibold text-[#6e4800]">{order.customer_name}</p>
                  <p className="text-sm text-zinc-600">{order.customer_email}</p>
                  <p className="text-sm">{new Date(order.created_at).toLocaleString("fr-CA")}</p>
                  <p className="mt-1 text-sm">Subtotal: {formatCurrency(order.subtotal_cents)}</p>
                  <p className="text-sm">Tax: {formatCurrency(order.tax_cents)}</p>
                  <p className="text-sm font-semibold">Total: {formatCurrency(order.total_cents)}</p>
                  {order.pickup_notes ? <p className="mt-1 text-xs text-zinc-500">Notes: {order.pickup_notes}</p> : null}
                </div>

                <form action={setOrderStatusAction} className="grid gap-2 md:min-w-72">
                  <input type="hidden" name="order_id" value={order.id} />
                  <label className="text-xs uppercase tracking-[0.12em] text-zinc-500" htmlFor={`status-${order.id}`}>
                    Status
                  </label>
                  <select
                    id={`status-${order.id}`}
                    name="status"
                    defaultValue={order.status}
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <input
                    name="note"
                    placeholder="Optional note"
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  />
                  <button type="submit" className="rounded-full bg-[#8e5e01] px-4 py-2 text-sm font-semibold text-white">
                    Update
                  </button>
                </form>
              </div>

              <div className="mt-3 rounded-lg border border-zinc-200 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Items</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {items.map((item, index) => (
                    <li key={`${order.id}-${index}`}>
                      {item.quantity}× {item.name_fr} - {formatCurrency(item.line_total_cents)}
                    </li>
                  ))}
                </ul>
              </div>

              {latestEvent ? (
                <p className="mt-3 text-xs text-zinc-500">
                  Latest event: {latestEvent.event_type} by {latestEvent.actor} at {new Date(latestEvent.created_at).toLocaleString("fr-CA")}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
