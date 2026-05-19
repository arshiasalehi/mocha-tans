import { addMinutes } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { z } from "zod";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { generateAvailabilitySlots } from "@/lib/booking";
import { DEFAULT_TIMEZONE, TAX_RATE_IDS } from "@/lib/constants";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/email";
import { getStripeServer } from "@/lib/stripe";
import type { BookingRules, BusinessHour, Locale } from "@/lib/types";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const requestSchema = z.object({
  serviceId: z.string().min(1),
  startIso: z.iso.datetime(),
  locale: z.enum(["fr", "en"]),
  customer: z.object({
    name: z.string().min(2).max(120),
    email: z.email(),
    phone: z.string().trim().max(40).optional().default(""),
  }),
});

const fallbackRules: BookingRules = {
  slot_interval_min: 15,
  buffer_min: 15,
  cancel_window_hours: 24,
};

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return jsonError("INVALID_BODY", "Invalid booking checkout payload.", 400);
  }

  try {
    const payload = parsed.data;
    const supabaseAdmin = createAdminClient();
    const supabaseUser = await createClient();

    const {
      data: { user },
    } = await supabaseUser.auth.getUser();

    const [{ data: service, error: serviceError }, { data: businessHours, error: hoursError }, { data: rulesData }] = await Promise.all([
      supabaseAdmin
        .from("services")
        .select("id, name_fr, name_en, description_fr, description_en, duration_min, price_cents")
        .eq("id", payload.serviceId)
        .eq("active", true)
        .maybeSingle(),
      supabaseAdmin
        .from("business_hours")
        .select("weekday, open_time, close_time, is_open")
        .order("weekday", { ascending: true }),
      supabaseAdmin
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

    const bookingRules = (rulesData ?? fallbackRules) as BookingRules;
    const selectedStart = new Date(payload.startIso);
    if (Number.isNaN(selectedStart.getTime())) {
      return jsonError("INVALID_SLOT", "Invalid appointment start date.", 400);
    }

    const bookingDate = formatInTimeZone(selectedStart, DEFAULT_TIMEZONE, "yyyy-MM-dd");
    const dayStartUtc = fromZonedTime(`${bookingDate}T00:00:00`, DEFAULT_TIMEZONE);
    const dayEndUtc = fromZonedTime(`${bookingDate}T23:59:59.999`, DEFAULT_TIMEZONE);

    const { data: sameDayBookings, error: bookingsError } = await supabaseAdmin
      .from("bookings")
      .select("appointment_start, appointment_end")
      .in("status", ["pending", "paid", "rescheduled", "completed"])
      .gte("appointment_start", dayStartUtc.toISOString())
      .lte("appointment_start", dayEndUtc.toISOString());

    if (bookingsError) {
      return jsonError("BOOKING_LOOKUP_FAILED", "Unable to verify slot availability.", 500);
    }

    const slots = generateAvailabilitySlots({
      dateIso: bookingDate,
      businessHours: businessHours as BusinessHour[],
      bookings: sameDayBookings ?? [],
      serviceDurationMin: service.duration_min,
      rules: bookingRules,
      timezone: DEFAULT_TIMEZONE,
    });

    const slotMatch = slots.find((slot) => slot.startIso === payload.startIso);
    if (!slotMatch) {
      return jsonError("SLOT_UNAVAILABLE", "Selected slot is no longer available.", 409);
    }

    const appointmentEnd = addMinutes(new Date(payload.startIso), service.duration_min);

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert({
        service_id: service.id,
        customer_name: payload.customer.name,
        customer_email: payload.customer.email,
        customer_phone: payload.customer.phone || null,
        appointment_start: payload.startIso,
        appointment_end: appointmentEnd.toISOString(),
        status: "pending",
        total_cents: service.price_cents,
        locale: payload.locale,
        auth_user_id: user?.id ?? null,
      })
      .select("id")
      .single();

    if (bookingError || !booking) {
      return jsonError("BOOKING_CREATE_FAILED", "Unable to create booking.", 500);
    }

    const stripe = getStripeServer();

    const locale: Locale = payload.locale;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: payload.customer.email,
      locale: locale === "fr" ? "fr" : "en",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "cad",
            unit_amount: service.price_cents,
            product_data: {
              name: locale === "fr" ? service.name_fr : service.name_en,
              description: locale === "fr" ? service.description_fr : service.description_en,
            },
          },
          ...(TAX_RATE_IDS.length > 0 ? { tax_rates: TAX_RATE_IDS } : {}),
        },
      ],
      metadata: {
        checkout_type: "booking",
        booking_id: booking.id,
        service_id: service.id,
        locale,
      },
      success_url: `${env.NEXT_PUBLIC_SITE_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.NEXT_PUBLIC_SITE_URL}/checkout/cancel`,
    });

    if (!session.url) {
      return jsonError("STRIPE_SESSION_FAILED", "Stripe did not return a checkout URL.", 500);
    }

    await Promise.all([
      supabaseAdmin
        .from("bookings")
        .update({ stripe_checkout_session_id: session.id })
        .eq("id", booking.id),
      supabaseAdmin.from("booking_events").insert({
        booking_id: booking.id,
        event_type: "checkout_session_created",
        actor: "system",
        metadata: {
          stripe_checkout_session_id: session.id,
          start_iso: payload.startIso,
        },
      }),
    ]);

    void sendEmail({
      to: payload.customer.email,
      subject: "Mocha Tans booking checkout started",
      html: `<p>Hi ${payload.customer.name},</p><p>Your booking checkout is ready. Complete payment to confirm your appointment.</p><p><a href="${session.url}">Open checkout</a></p>`,
    });

    return jsonSuccess({ checkoutUrl: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return jsonError("SERVER_MISCONFIGURED", "Server is missing Supabase service role key.", 500);
    }
    if (message.includes("STRIPE_SECRET_KEY")) {
      return jsonError("SERVER_MISCONFIGURED", "Server is missing Stripe secret key.", 500);
    }
    return jsonError("INTERNAL_ERROR", "Unable to start booking checkout.", 500);
  }
}
