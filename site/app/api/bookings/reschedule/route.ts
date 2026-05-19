import { addMinutes } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { z } from "zod";
import { generateAvailabilitySlots, withinCancellationWindow } from "@/lib/booking";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { DEFAULT_TIMEZONE } from "@/lib/constants";
import { sendEmail } from "@/lib/email";
import type { BookingRules, BusinessHour } from "@/lib/types";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const requestSchema = z.object({
  bookingId: z.uuid(),
  startIso: z.iso.datetime(),
  customerEmail: z.email().optional(),
});

const fallbackRules: BookingRules = {
  slot_interval_min: 15,
  buffer_min: 15,
  cancel_window_hours: 24,
};

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError("INVALID_BODY", "Invalid reschedule payload.", 400);
  }

  try {
    const supabaseAdmin = createAdminClient();
    const supabaseUser = await createClient();
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();

    const [{ data: booking, error: bookingError }, { data: rulesData }, { data: businessHours, error: hoursError }] = await Promise.all([
      supabaseAdmin
        .from("bookings")
        .select("id, customer_name, customer_email, appointment_start, status, service_id, services(duration_min)")
        .eq("id", parsed.data.bookingId)
        .single(),
      supabaseAdmin
        .from("booking_rules")
        .select("slot_interval_min, buffer_min, cancel_window_hours")
        .eq("id", 1)
        .maybeSingle(),
      supabaseAdmin
        .from("business_hours")
        .select("weekday, open_time, close_time, is_open")
        .order("weekday", { ascending: true }),
    ]);

    if (bookingError || !booking) {
      return jsonError("BOOKING_NOT_FOUND", "Booking not found.", 404);
    }

    if (hoursError || !businessHours) {
      return jsonError("HOURS_UNAVAILABLE", "Business hours are unavailable.", 500);
    }

    const userEmail = user?.email?.toLowerCase() ?? null;
    const providedEmail = parsed.data.customerEmail?.toLowerCase() ?? null;
    const bookingEmail = booking.customer_email.toLowerCase();

    if (userEmail !== bookingEmail && providedEmail !== bookingEmail) {
      return jsonError("FORBIDDEN", "You are not allowed to update this booking.", 403);
    }

    if (!["pending", "paid", "rescheduled"].includes(booking.status)) {
      return jsonError("INVALID_STATUS", "This booking cannot be rescheduled.", 409);
    }

    const rules = (rulesData ?? fallbackRules) as BookingRules;
    const canSelfReschedule = withinCancellationWindow(booking.appointment_start, rules.cancel_window_hours);
    if (!canSelfReschedule) {
      return jsonError(
        "ADMIN_REVIEW_REQUIRED",
        "Rescheduling is locked within 24 hours. Please contact support.",
        403,
      );
    }

    const serviceDuration =
      booking.services && typeof booking.services === "object" && "duration_min" in booking.services
        ? Number(booking.services.duration_min)
        : null;

    if (!serviceDuration || Number.isNaN(serviceDuration)) {
      return jsonError("SERVICE_NOT_FOUND", "Service information missing for booking.", 500);
    }

    const nextStart = new Date(parsed.data.startIso);
    if (Number.isNaN(nextStart.getTime())) {
      return jsonError("INVALID_SLOT", "Invalid startIso provided.", 400);
    }

    const bookingDate = formatInTimeZone(nextStart, DEFAULT_TIMEZONE, "yyyy-MM-dd");
    const dayStartUtc = fromZonedTime(`${bookingDate}T00:00:00`, DEFAULT_TIMEZONE);
    const dayEndUtc = fromZonedTime(`${bookingDate}T23:59:59.999`, DEFAULT_TIMEZONE);

    const { data: sameDayBookings, error: sameDayError } = await supabaseAdmin
      .from("bookings")
      .select("id, appointment_start, appointment_end")
      .in("status", ["pending", "paid", "rescheduled", "completed"])
      .neq("id", booking.id)
      .gte("appointment_start", dayStartUtc.toISOString())
      .lte("appointment_start", dayEndUtc.toISOString());

    if (sameDayError) {
      return jsonError("BOOKING_LOOKUP_FAILED", "Unable to verify slot availability.", 500);
    }

    const slots = generateAvailabilitySlots({
      dateIso: bookingDate,
      businessHours: businessHours as BusinessHour[],
      bookings: (sameDayBookings ?? []).map((item) => ({
        appointment_start: item.appointment_start,
        appointment_end: item.appointment_end,
      })),
      serviceDurationMin: serviceDuration,
      rules,
      timezone: DEFAULT_TIMEZONE,
    });

    const allowed = slots.some((slot) => slot.startIso === parsed.data.startIso);
    if (!allowed) {
      return jsonError("SLOT_UNAVAILABLE", "Selected slot is not available.", 409);
    }

    const nextEnd = addMinutes(nextStart, serviceDuration).toISOString();

    const { error: updateError } = await supabaseAdmin
      .from("bookings")
      .update({
        appointment_start: parsed.data.startIso,
        appointment_end: nextEnd,
        status: "rescheduled",
      })
      .eq("id", booking.id);

    if (updateError) {
      return jsonError("BOOKING_UPDATE_FAILED", "Unable to reschedule booking.", 500);
    }

    await supabaseAdmin.from("booking_events").insert({
      booking_id: booking.id,
      event_type: "rescheduled",
      actor: user ? "customer" : "guest",
      metadata: {
        previous_start: booking.appointment_start,
        next_start: parsed.data.startIso,
      },
    });

    void sendEmail({
      to: booking.customer_email,
      subject: "Mocha Tans booking rescheduled",
      html: `<p>Hi ${booking.customer_name},</p><p>Your booking has been rescheduled to ${new Date(parsed.data.startIso).toLocaleString("fr-CA")}.</p>`,
    });

    return jsonSuccess({
      bookingId: booking.id,
      startIso: parsed.data.startIso,
      endIso: nextEnd,
      status: "rescheduled",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return jsonError("SERVER_MISCONFIGURED", "Server is missing Supabase service role key.", 500);
    }
    return jsonError("INTERNAL_ERROR", "Unable to reschedule booking.", 500);
  }
}
