import { z } from "zod";
import { fromZonedTime } from "date-fns-tz";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { generateAvailabilitySlots } from "@/lib/booking";
import { DEFAULT_TIMEZONE } from "@/lib/constants";
import { createAdminClient } from "@/utils/supabase/admin";
import type { BookingRules, BusinessHour } from "@/lib/types";

const querySchema = z.object({
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const fallbackRules: BookingRules = {
  slot_interval_min: 15,
  buffer_min: 15,
  cancel_window_hours: 24,
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    serviceId: url.searchParams.get("serviceId"),
    date: url.searchParams.get("date"),
  });

  if (!parsed.success) {
    return jsonError("INVALID_QUERY", "Invalid serviceId or date format.", 400);
  }

  try {
    const supabase = createAdminClient();

    const [{ data: service, error: serviceError }, { data: businessHours, error: hoursError }, { data: rulesData }] = await Promise.all([
      supabase
        .from("services")
        .select("id, duration_min")
        .eq("id", parsed.data.serviceId)
        .eq("active", true)
        .maybeSingle(),
      supabase
        .from("business_hours")
        .select("weekday, open_time, close_time, is_open")
        .order("weekday", { ascending: true }),
      supabase
        .from("booking_rules")
        .select("slot_interval_min, buffer_min, cancel_window_hours")
        .eq("id", 1)
        .maybeSingle(),
    ]);

    if (serviceError || !service) {
      return jsonError("SERVICE_NOT_FOUND", "Selected service is not available.", 404);
    }

    if (hoursError || !businessHours) {
      return jsonError("HOURS_UNAVAILABLE", "Business hours are unavailable.", 500);
    }

    const dayStartUtc = fromZonedTime(`${parsed.data.date}T00:00:00`, DEFAULT_TIMEZONE);
    const dayEndUtc = fromZonedTime(`${parsed.data.date}T23:59:59.999`, DEFAULT_TIMEZONE);

    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("appointment_start, appointment_end")
      .in("status", ["pending", "paid", "rescheduled", "completed"])
      .gte("appointment_start", dayStartUtc.toISOString())
      .lte("appointment_start", dayEndUtc.toISOString());

    if (bookingsError) {
      return jsonError("BOOKINGS_READ_FAILED", "Unable to load bookings for this date.", 500);
    }

    const slots = generateAvailabilitySlots({
      dateIso: parsed.data.date,
      businessHours: businessHours as BusinessHour[],
      bookings: bookings ?? [],
      serviceDurationMin: service.duration_min,
      rules: (rulesData ?? fallbackRules) as BookingRules,
      timezone: DEFAULT_TIMEZONE,
    });

    return jsonSuccess({ slots });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return jsonError("SERVER_MISCONFIGURED", "Server is missing Supabase service role key.", 500);
    }
    return jsonError("INTERNAL_ERROR", "Unable to fetch availability.", 500);
  }
}
