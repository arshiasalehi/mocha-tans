import { setBookingStatusAction } from "@/app/admin/actions";
import { createAdminClient } from "@/utils/supabase/admin";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

const statusOptions = ["pending", "paid", "rescheduled", "completed", "cancelled"];

export default async function AdminBookingsPage() {
  const supabase = createAdminClient();

  const [{ data: bookings }, { data: events }] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, customer_name, customer_email, appointment_start, appointment_end, status, total_cents")
      .order("appointment_start", { ascending: true }),
    supabase
      .from("booking_events")
      .select("booking_id, event_type, actor, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const latestEvents = new Map<string, { event_type: string; actor: string; created_at: string }>();
  for (const event of events ?? []) {
    if (!latestEvents.has(event.booking_id)) {
      latestEvents.set(event.booking_id, {
        event_type: event.event_type,
        actor: event.actor,
        created_at: event.created_at,
      });
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="font-display text-3xl text-[#6e4800]">Bookings Calendar/List</h2>
      <div className="grid gap-4">
        {(bookings ?? []).map((booking) => {
          const latest = latestEvents.get(booking.id);
          return (
            <article key={booking.id} className="rounded-2xl border border-[#eadfce] bg-white p-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-semibold text-[#6e4800]">{booking.customer_name}</p>
                  <p className="text-sm text-zinc-600">{booking.customer_email}</p>
                  <p className="mt-1 text-sm">{new Date(booking.appointment_start).toLocaleString("fr-CA")}</p>
                  <p className="text-sm">Duration window end: {new Date(booking.appointment_end).toLocaleString("fr-CA")}</p>
                  <p className="mt-1 text-sm font-semibold text-[#8e5e01]">{formatCurrency(booking.total_cents)}</p>
                </div>

                <form action={setBookingStatusAction} className="grid gap-2 md:min-w-72">
                  <input type="hidden" name="booking_id" value={booking.id} />
                  <label className="text-xs uppercase tracking-[0.12em] text-zinc-500" htmlFor={`status-${booking.id}`}>
                    Status
                  </label>
                  <select
                    id={`status-${booking.id}`}
                    name="status"
                    defaultValue={booking.status}
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
                    placeholder="Optional note (refund marker, reason, etc.)"
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  />
                  <button type="submit" className="rounded-full bg-[#8e5e01] px-4 py-2 text-sm font-semibold text-white">
                    Update
                  </button>
                </form>
              </div>

              {latest ? (
                <p className="mt-3 text-xs text-zinc-500">
                  Latest event: {latest.event_type} by {latest.actor} at {new Date(latest.created_at).toLocaleString("fr-CA")}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
