import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { formatCurrency } from "@/lib/format";
import type { Order } from "@/lib/types";

type AccountBookingRow = {
  id: string;
  appointment_start: string;
  status: string;
  total_cents: number;
  services:
    | Array<{
        id: string;
        name_fr: string;
        name_en: string;
        duration_min: number;
      }>
    | null;
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  async function signOutAction() {
    "use server";

    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <section className="container-page py-16">
        <h1 className="font-display text-4xl text-[#6e4800]">Account</h1>
        <p className="mt-4 text-zinc-700">You are not signed in.</p>
        <Link href="/login?next=/account" className="mt-5 inline-block rounded-full bg-[#8e5e01] px-5 py-2 text-white">
          Login
        </Link>
      </section>
    );
  }

  const email = user.email ?? "";
  const { data: adminRole } = await supabase
    .from("admin_users")
    .select("role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (adminRole?.role === "owner") {
    redirect("/admin");
  }

  const [{ data: rawBookings }, { data: rawOrders }] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, appointment_start, status, total_cents, services(id,name_fr,name_en,duration_min)")
      .eq("customer_email", email)
      .order("appointment_start", { ascending: false }),
    supabase
      .from("orders")
      .select("id, created_at, status, total_cents")
      .eq("customer_email", email)
      .order("created_at", { ascending: false }),
  ]);

  const bookings = (rawBookings ?? []) as AccountBookingRow[];
  const orders = (rawOrders ?? []) as Pick<Order, "id" | "created_at" | "status" | "total_cents">[];

  return (
    <section className="container-page py-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl text-[#6e4800]">Account</h1>
          <p className="mt-2 text-zinc-600">{email}</p>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-full border border-zinc-300 bg-white px-5 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Log out
          </button>
        </form>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-[#eadfce] bg-white p-6">
          <h2 className="font-display text-2xl text-[#6e4800]">Bookings</h2>
          <div className="mt-4 space-y-3">
            {bookings.length === 0 ? (
              <p className="text-sm text-zinc-500">No bookings yet.</p>
            ) : (
              bookings.map((booking) => {
                const service = Array.isArray(booking.services) ? booking.services[0] : null;
                return (
                  <div key={booking.id} className="rounded-xl border border-zinc-200 p-3 text-sm">
                    <p className="font-semibold text-[#6e4800]">{service?.name_fr ?? "Service"}</p>
                    <p>{new Date(booking.appointment_start).toLocaleString("fr-CA")}</p>
                    <p>Status: {booking.status}</p>
                    <p>{formatCurrency(booking.total_cents)}</p>
                  </div>
                );
              })
            )}
          </div>
        </article>

        <article className="rounded-3xl border border-[#eadfce] bg-white p-6">
          <h2 className="font-display text-2xl text-[#6e4800]">Orders</h2>
          <div className="mt-4 space-y-3">
            {orders.length === 0 ? (
              <p className="text-sm text-zinc-500">No orders yet.</p>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="rounded-xl border border-zinc-200 p-3 text-sm">
                  <p>{new Date(order.created_at).toLocaleString("fr-CA")}</p>
                  <p>Status: {order.status}</p>
                  <p>{formatCurrency(order.total_cents)}</p>
                </div>
              ))
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
