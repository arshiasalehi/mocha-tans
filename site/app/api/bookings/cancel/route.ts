import { z } from "zod";
import { withinCancellationWindow } from "@/lib/booking";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { sendEmail } from "@/lib/email";
import type { BookingRules } from "@/lib/types";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const requestSchema = z.object({
  bookingId: z.uuid(),
  customerEmail: z.email().optional(),
  reason: z.string().trim().max(500).optional(),
});

const fallbackRules: BookingRules = {
  slot_interval_min: 15,
  buffer_min: 15,
  cancel_window_hours: 24,
};

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError("INVALID_BODY", "Invalid cancellation payload.", 400);
  }

  try {
    const supabaseAdmin = createAdminClient();
    const supabaseUser = await createClient();
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();

    const [{ data: booking, error: bookingError }, { data: rulesData }] = await Promise.all([
      supabaseAdmin
        .from("bookings")
        .select("id, customer_name, customer_email, appointment_start, status, stripe_payment_intent_id")
        .eq("id", parsed.data.bookingId)
        .single(),
      supabaseAdmin
        .from("booking_rules")
        .select("slot_interval_min, buffer_min, cancel_window_hours")
        .eq("id", 1)
        .maybeSingle(),
    ]);

    if (bookingError || !booking) {
      return jsonError("BOOKING_NOT_FOUND", "Booking not found.", 404);
    }

    const userEmail = user?.email?.toLowerCase() ?? null;
    const providedEmail = parsed.data.customerEmail?.toLowerCase() ?? null;
    const bookingEmail = booking.customer_email.toLowerCase();

    if (userEmail !== bookingEmail && providedEmail !== bookingEmail) {
      return jsonError("FORBIDDEN", "You are not allowed to cancel this booking.", 403);
    }

    if (!["pending", "paid", "rescheduled"].includes(booking.status)) {
      return jsonError("INVALID_STATUS", "This booking cannot be cancelled.", 409);
    }

    const rules = (rulesData ?? fallbackRules) as BookingRules;
    const canCancel = withinCancellationWindow(booking.appointment_start, rules.cancel_window_hours);
    if (!canCancel) {
      return jsonError(
        "ADMIN_REVIEW_REQUIRED",
        "Cancellation is locked within 24 hours. Please contact support.",
        403,
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", booking.id);

    if (updateError) {
      return jsonError("BOOKING_UPDATE_FAILED", "Unable to cancel booking.", 500);
    }

    await supabaseAdmin.from("booking_events").insert({
      booking_id: booking.id,
      event_type: "cancelled",
      actor: user ? "customer" : "guest",
      metadata: {
        reason: parsed.data.reason ?? null,
        refund_review_required: Boolean(booking.stripe_payment_intent_id),
      },
    });

    void sendEmail({
      to: booking.customer_email,
      subject: "Mocha Tans booking cancelled",
      html: `<p>Hi ${booking.customer_name},</p><p>Your booking has been cancelled.</p>`,
    });

    return jsonSuccess({
      bookingId: booking.id,
      status: "cancelled",
      refundReviewRequired: Boolean(booking.stripe_payment_intent_id),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return jsonError("SERVER_MISCONFIGURED", "Server is missing Supabase service role key.", 500);
    }
    return jsonError("INTERNAL_ERROR", "Unable to cancel booking.", 500);
  }
}
