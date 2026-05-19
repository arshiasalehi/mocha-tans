import {
  saveBookingRulesAction,
  saveBusinessHourAction,
  saveBusinessSettingsAction,
  savePolicySettingsAction,
} from "@/app/admin/actions";
import { createAdminClient } from "@/utils/supabase/admin";
import type { SiteSettingsMap } from "@/lib/types";

export const dynamic = "force-dynamic";

const weekdays = [
  { index: 0, label: "Sunday" },
  { index: 1, label: "Monday" },
  { index: 2, label: "Tuesday" },
  { index: 3, label: "Wednesday" },
  { index: 4, label: "Thursday" },
  { index: 5, label: "Friday" },
  { index: 6, label: "Saturday" },
];

export default async function AdminSettingsPage() {
  const supabase = createAdminClient();

  const [{ data: hours }, { data: rules }, { data: settingsRows }] = await Promise.all([
    supabase
      .from("business_hours")
      .select("weekday, open_time, close_time, is_open")
      .order("weekday", { ascending: true }),
    supabase
      .from("booking_rules")
      .select("slot_interval_min, buffer_min, cancel_window_hours")
      .eq("id", 1)
      .maybeSingle(),
    supabase.from("site_settings").select("key, value"),
  ]);

  const settingsMap = Object.fromEntries((settingsRows ?? []).map((item) => [item.key, item.value])) as Partial<SiteSettingsMap>;
  const business = {
    name: "Mocha Tans",
    email: "mochatansmtl@gmail.com",
    address: "1200 Rue Gauthier, Longueuil, QC J4T 3N7",
    timezone: "America/Toronto",
    phone: "",
    instagram: "https://www.instagram.com/mochatansmtl/",
    ...(settingsMap.business as Record<string, string> | undefined),
  };

  const policies = {
    cancellation: "Free cancellation/reschedule up to 24h before appointment.",
    privacy: "",
    terms: "",
    ...(settingsMap.policies as Record<string, string> | undefined),
  };

  const hourByDay = new Map((hours ?? []).map((hour) => [hour.weekday, hour]));

  return (
    <section className="space-y-8">
      <div className="rounded-2xl border border-[#eadfce] bg-white p-5">
        <h2 className="font-display text-2xl text-[#6e4800]">Business Profile</h2>
        <form action={saveBusinessSettingsAction} className="mt-4 grid gap-3 md:grid-cols-2">
          <input name="name" defaultValue={business.name} placeholder="Business name" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <input name="email" defaultValue={business.email} placeholder="Email" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <input name="phone" defaultValue={business.phone} placeholder="Phone" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <input name="timezone" defaultValue={business.timezone} placeholder="Timezone" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <input name="instagram" defaultValue={business.instagram} placeholder="Instagram URL" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm md:col-span-2" />
          <textarea name="address" defaultValue={business.address} placeholder="Address" rows={2} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm md:col-span-2" />
          <button type="submit" className="w-fit rounded-full bg-[#8e5e01] px-5 py-2 text-sm font-semibold text-white">
            Save profile
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-[#eadfce] bg-white p-5">
        <h2 className="font-display text-2xl text-[#6e4800]">Policies</h2>
        <form action={savePolicySettingsAction} className="mt-4 grid gap-3">
          <textarea name="cancellation" defaultValue={policies.cancellation} placeholder="Cancellation policy" rows={3} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <textarea name="privacy" defaultValue={policies.privacy} placeholder="Privacy policy" rows={3} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <textarea name="terms" defaultValue={policies.terms} placeholder="Terms" rows={3} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <button type="submit" className="w-fit rounded-full bg-[#8e5e01] px-5 py-2 text-sm font-semibold text-white">
            Save policies
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-[#eadfce] bg-white p-5">
        <h2 className="font-display text-2xl text-[#6e4800]">Booking Rules</h2>
        <form action={saveBookingRulesAction} className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            name="slot_interval_min"
            type="number"
            defaultValue={rules?.slot_interval_min ?? 15}
            placeholder="Slot interval"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            name="buffer_min"
            type="number"
            defaultValue={rules?.buffer_min ?? 15}
            placeholder="Buffer minutes"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            name="cancel_window_hours"
            type="number"
            defaultValue={rules?.cancel_window_hours ?? 24}
            placeholder="Cancel window (hours)"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="w-fit rounded-full bg-[#8e5e01] px-5 py-2 text-sm font-semibold text-white md:col-span-3">
            Save rules
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-[#eadfce] bg-white p-5">
        <h2 className="font-display text-2xl text-[#6e4800]">Business Hours</h2>
        <div className="mt-4 grid gap-3">
          {weekdays.map((day) => {
            const row = hourByDay.get(day.index);
            return (
              <form key={day.index} action={saveBusinessHourAction} className="grid gap-2 rounded-lg border border-zinc-200 p-3 md:grid-cols-[160px_1fr_1fr_auto_auto] md:items-center">
                <input type="hidden" name="weekday" value={day.index} />
                <p className="font-medium text-[#6e4800]">{day.label}</p>
                <input
                  name="open_time"
                  defaultValue={row?.open_time?.slice(0, 8) ?? "10:00:00"}
                  placeholder="Open (HH:mm:ss)"
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
                <input
                  name="close_time"
                  defaultValue={row?.close_time?.slice(0, 8) ?? "17:00:00"}
                  placeholder="Close (HH:mm:ss)"
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" name="is_open" defaultChecked={row?.is_open ?? true} /> Open
                </label>
                <button type="submit" className="rounded-full bg-[#8e5e01] px-4 py-2 text-xs font-semibold text-white">
                  Save day
                </button>
              </form>
            );
          })}
        </div>
      </div>
    </section>
  );
}
