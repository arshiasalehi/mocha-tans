import Stripe from "stripe";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { sendEmail } from "@/lib/email";
import { getStripeServer } from "@/lib/stripe";
import { createAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

async function handleBookingCompleted(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.booking_id;
  if (!bookingId) return;

  const supabase = createAdminClient();
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, customer_name, customer_email, status, stripe_payment_intent_id")
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError || !booking) return;

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const alreadyProcessed =
    booking.status === "paid" &&
    booking.stripe_payment_intent_id &&
    booking.stripe_payment_intent_id === paymentIntentId;

  if (alreadyProcessed) return;

  await supabase
    .from("bookings")
    .update({
      status: "paid",
      stripe_payment_intent_id: paymentIntentId,
      stripe_checkout_session_id: session.id,
    })
    .eq("id", booking.id);

  await supabase.from("booking_events").insert({
    booking_id: booking.id,
    event_type: "payment_confirmed",
    actor: "system",
    metadata: {
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      amount_total: session.amount_total,
    },
  });

  void sendEmail({
    to: booking.customer_email,
    subject: "Mocha Tans booking confirmed",
    html: `<p>Hi ${booking.customer_name},</p><p>Your payment is complete and your appointment is confirmed.</p>`,
  });
}

async function handleOrderCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;
  if (!orderId) return;

  const supabase = createAdminClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, customer_name, customer_email, status, stripe_payment_intent_id")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) return;

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const alreadyProcessed =
    order.status === "paid" &&
    order.stripe_payment_intent_id &&
    order.stripe_payment_intent_id === paymentIntentId;

  if (alreadyProcessed) return;

  await supabase
    .from("orders")
    .update({
      status: "paid",
      stripe_payment_intent_id: paymentIntentId,
      stripe_checkout_session_id: session.id,
      subtotal_cents: session.amount_subtotal ?? undefined,
      total_cents: session.amount_total ?? undefined,
      tax_cents:
        typeof session.amount_total === "number" && typeof session.amount_subtotal === "number"
          ? Math.max(session.amount_total - session.amount_subtotal, 0)
          : undefined,
    })
    .eq("id", order.id);

  void sendEmail({
    to: order.customer_email,
    subject: "Mocha Tans order confirmed",
    html: `<p>Hi ${order.customer_name},</p><p>Your payment is complete. We will contact you shortly with pickup details.</p>`,
  });
}

export async function POST(request: Request) {
  try {
    const stripe = getStripeServer();
    const signature = request.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return jsonError("SERVER_MISCONFIGURED", "Missing Stripe webhook signature configuration.", 500);
    }

    const body = await request.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch {
      return jsonError("INVALID_SIGNATURE", "Invalid Stripe webhook signature.", 400);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const checkoutType = session.metadata?.checkout_type;

      if (checkoutType === "booking") {
        await handleBookingCompleted(session);
      }

      if (checkoutType === "shop") {
        await handleOrderCompleted(session);
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const supabase = createAdminClient();
      const checkoutType = session.metadata?.checkout_type;

      if (checkoutType === "booking" && session.metadata?.booking_id) {
        await supabase
          .from("bookings")
          .update({ status: "cancelled" })
          .eq("id", session.metadata.booking_id)
          .eq("status", "pending");
      }

      if (checkoutType === "shop" && session.metadata?.order_id) {
        await supabase
          .from("orders")
          .update({ status: "cancelled" })
          .eq("id", session.metadata.order_id)
          .eq("status", "pending");
      }
    }

    return jsonSuccess({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return jsonError("SERVER_MISCONFIGURED", "Server is missing Supabase service role key.", 500);
    }
    if (message.includes("STRIPE_SECRET_KEY")) {
      return jsonError("SERVER_MISCONFIGURED", "Server is missing Stripe secret key.", 500);
    }
    return jsonError("INTERNAL_ERROR", "Webhook processing failed.", 500);
  }
}
