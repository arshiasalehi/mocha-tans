import { z } from "zod";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { TAX_RATE_IDS } from "@/lib/constants";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/email";
import { getStripeServer } from "@/lib/stripe";
import { calculateOrderTotalCents } from "@/lib/pricing";
import type { Locale, Product } from "@/lib/types";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const requestSchema = z.object({
  customer: z.object({
    name: z.string().min(2).max(120),
    email: z.email(),
    phone: z.string().trim().max(40).optional().default(""),
  }),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1),
  pickupNotes: z.string().trim().max(500).optional(),
  locale: z.enum(["fr", "en"]).default("fr"),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError("INVALID_BODY", "Invalid shop checkout payload.", 400);
  }

  try {
    const payload = parsed.data;
    const supabaseAdmin = createAdminClient();
    const supabaseUser = await createClient();

    const {
      data: { user },
    } = await supabaseUser.auth.getUser();

    const productIds = [...new Set(payload.items.map((item) => item.productId))];
    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("id, slug, name_fr, name_en, description_fr, description_en, price_cents, active")
      .in("id", productIds)
      .eq("active", true);

    if (productsError || !products) {
      return jsonError("PRODUCT_LOOKUP_FAILED", "Unable to validate products.", 500);
    }

    const byId = new Map(products.map((product) => [product.id, product as Product]));
    const lines = payload.items.map((item) => {
      const product = byId.get(item.productId);
      if (!product) return null;
      return {
        product,
        quantity: item.quantity,
        unit_price_cents: product.price_cents,
        line_total_cents: product.price_cents * item.quantity,
      };
    });

    if (lines.some((line) => !line)) {
      return jsonError("PRODUCT_NOT_FOUND", "One or more selected products are unavailable.", 409);
    }

    const validLines = lines.filter((line): line is NonNullable<(typeof lines)[number]> => Boolean(line));
    const totals = calculateOrderTotalCents({
      lines: validLines.map((line) => ({ quantity: line.quantity, unit_price_cents: line.unit_price_cents })),
      combinedTaxRateBps: 0,
    });

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_name: payload.customer.name,
        customer_email: payload.customer.email,
        customer_phone: payload.customer.phone || null,
        status: "pending",
        subtotal_cents: totals.subtotal_cents,
        tax_cents: totals.tax_cents,
        total_cents: totals.total_cents,
        pickup_notes: payload.pickupNotes ?? null,
        locale: payload.locale,
        auth_user_id: user?.id ?? null,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      return jsonError("ORDER_CREATE_FAILED", "Unable to create order.", 500);
    }

    const { error: itemsError } = await supabaseAdmin.from("order_items").insert(
      validLines.map((line) => ({
        order_id: order.id,
        product_id: line.product.id,
        quantity: line.quantity,
        unit_price_cents: line.unit_price_cents,
        line_total_cents: line.line_total_cents,
      })),
    );

    if (itemsError) {
      return jsonError("ORDER_ITEMS_CREATE_FAILED", "Unable to create order items.", 500);
    }

    const stripe = getStripeServer();
    const locale: Locale = payload.locale;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: payload.customer.email,
      locale: locale === "fr" ? "fr" : "en",
      line_items: validLines.map((line) => ({
        quantity: line.quantity,
        price_data: {
          currency: "cad",
          unit_amount: line.unit_price_cents,
          product_data: {
            name: locale === "fr" ? line.product.name_fr : line.product.name_en,
            description: locale === "fr" ? line.product.description_fr : line.product.description_en,
          },
        },
        ...(TAX_RATE_IDS.length > 0 ? { tax_rates: TAX_RATE_IDS } : {}),
      })),
      metadata: {
        checkout_type: "shop",
        order_id: order.id,
        locale,
      },
      success_url: `${env.NEXT_PUBLIC_SITE_URL}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.NEXT_PUBLIC_SITE_URL}/checkout/cancel`,
    });

    if (!session.url) {
      return jsonError("STRIPE_SESSION_FAILED", "Stripe did not return a checkout URL.", 500);
    }

    const amountSubtotal = session.amount_subtotal ?? totals.subtotal_cents;
    const amountTotal = session.amount_total ?? totals.total_cents;

    const { error: orderUpdateError } = await supabaseAdmin
      .from("orders")
      .update({
        stripe_checkout_session_id: session.id,
        subtotal_cents: amountSubtotal,
        tax_cents: Math.max(amountTotal - amountSubtotal, 0),
        total_cents: amountTotal,
      })
      .eq("id", order.id);

    if (orderUpdateError) {
      return jsonError("ORDER_UPDATE_FAILED", "Unable to update order payment session.", 500);
    }

    void sendEmail({
      to: payload.customer.email,
      subject: "Mocha Tans order checkout started",
      html: `<p>Hi ${payload.customer.name},</p><p>Your order checkout is ready. Complete payment and we will contact you for pickup details.</p><p><a href="${session.url}">Open checkout</a></p>`,
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
    return jsonError("INTERNAL_ERROR", "Unable to start shop checkout.", 500);
  }
}
