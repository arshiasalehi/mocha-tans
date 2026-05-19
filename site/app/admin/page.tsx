import Link from "next/link";
import { createAdminClient } from "@/utils/supabase/admin";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = createAdminClient();

  const [
    { count: bookingsCount },
    { count: paidBookingsCount },
    { count: pendingOrdersCount },
    { data: revenueRows },
    { data: recentBookings },
  ] = await Promise.all([
    supabase.from("bookings").select("id", { count: "exact", head: true }),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "paid"),
    supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["pending", "paid"]),
    supabase
      .from("bookings")
      .select("total_cents")
      .eq("status", "paid"),
    supabase
      .from("bookings")
      .select("id, appointment_start, status, customer_name")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const bookingRevenue = (revenueRows ?? []).reduce((sum, row) => sum + row.total_cents, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <article className="rounded-2xl border border-[#eadfce] bg-white p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Bookings</p>
          <p className="mt-2 font-display text-3xl text-[#6e4800]">{bookingsCount ?? 0}</p>
        </article>
        <article className="rounded-2xl border border-[#eadfce] bg-white p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Paid Bookings</p>
          <p className="mt-2 font-display text-3xl text-[#6e4800]">{paidBookingsCount ?? 0}</p>
        </article>
        <article className="rounded-2xl border border-[#eadfce] bg-white p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Open Orders</p>
          <p className="mt-2 font-display text-3xl text-[#6e4800]">{pendingOrdersCount ?? 0}</p>
        </article>
        <article className="rounded-2xl border border-[#eadfce] bg-white p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Booking Revenue</p>
          <p className="mt-2 font-display text-3xl text-[#6e4800]">{formatCurrency(bookingRevenue)}</p>
        </article>
      </div>

      <section className="rounded-2xl border border-[#eadfce] bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl text-[#6e4800]">Recent Bookings</h2>
          <Link href="/admin/bookings" className="text-sm font-semibold text-[#8e5e01] underline">
            Open bookings manager
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {(recentBookings ?? []).map((booking) => (
            <div key={booking.id} className="rounded-xl border border-zinc-200 px-4 py-3 text-sm">
              <p className="font-semibold text-[#6e4800]">{booking.customer_name}</p>
              <p>{new Date(booking.appointment_start).toLocaleString("fr-CA")}</p>
              <p className="text-zinc-600">Status: {booking.status}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
