"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/auth";
import { createAdminClient } from "@/utils/supabase/admin";

function toBool(value: FormDataEntryValue | null) {
  return value === "on" || value === "true" || value === "1";
}

function toStringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function makeServiceId(seed: string) {
  const normalized = seed
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);

  return `${normalized || "SERVICE"}_${Date.now().toString().slice(-6)}`;
}

function makeSlug(seed: string) {
  return seed
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function setBookingStatusAction(formData: FormData) {
  const user = await requireAdminUser();
  const supabase = createAdminClient();

  const bookingId = toStringValue(formData.get("booking_id"));
  const status = toStringValue(formData.get("status"));
  const note = toStringValue(formData.get("note"));

  if (!bookingId || !status) return;

  await supabase.from("bookings").update({ status }).eq("id", bookingId);
  await supabase.from("booking_events").insert({
    booking_id: bookingId,
    event_type: "admin_status_change",
    actor: `admin:${user.id}`,
    metadata: { status, note: note || null },
  });

  revalidatePath("/admin/bookings");
  revalidatePath("/account");
}

export async function setOrderStatusAction(formData: FormData) {
  const user = await requireAdminUser();
  const supabase = createAdminClient();

  const orderId = toStringValue(formData.get("order_id"));
  const status = toStringValue(formData.get("status"));
  const note = toStringValue(formData.get("note"));

  if (!orderId || !status) return;

  await supabase.from("orders").update({ status }).eq("id", orderId);

  await supabase.from("order_events").insert({
    order_id: orderId,
    event_type: "admin_status_change",
    actor: `admin:${user.id}`,
    metadata: { status, note: note || null },
  });

  revalidatePath("/admin/orders");
  revalidatePath("/account");
}

export async function saveServiceAction(formData: FormData) {
  await requireAdminUser();
  const supabase = createAdminClient();

  const id = toStringValue(formData.get("id")) || makeServiceId(toStringValue(formData.get("name_fr")));
  const payload = {
    id,
    name_fr: toStringValue(formData.get("name_fr")),
    name_en: toStringValue(formData.get("name_en")),
    description_fr: toStringValue(formData.get("description_fr")),
    description_en: toStringValue(formData.get("description_en")),
    duration_min: Number(toStringValue(formData.get("duration_min")) || "60"),
    price_cents: Number(toStringValue(formData.get("price_cents")) || "0"),
    active: toBool(formData.get("active")),
    image_url: toStringValue(formData.get("image_url")) || null,
  };

  await supabase.from("services").upsert(payload, { onConflict: "id" });

  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath("/");
}

export async function saveProductAction(formData: FormData) {
  await requireAdminUser();
  const supabase = createAdminClient();

  const currentId = toStringValue(formData.get("id"));
  const nameFr = toStringValue(formData.get("name_fr"));
  const nameEn = toStringValue(formData.get("name_en"));
  const payload = {
    id: currentId || undefined,
    slug:
      toStringValue(formData.get("slug")) ||
      makeSlug(nameEn || nameFr || `product-${Date.now().toString().slice(-6)}`),
    name_fr: nameFr,
    name_en: nameEn,
    description_fr: toStringValue(formData.get("description_fr")),
    description_en: toStringValue(formData.get("description_en")),
    price_cents: Number(toStringValue(formData.get("price_cents")) || "0"),
    active: toBool(formData.get("active")),
    image_url: toStringValue(formData.get("image_url")) || null,
  };

  if (currentId) {
    await supabase.from("products").update(payload).eq("id", currentId);
  } else {
    await supabase.from("products").insert(payload);
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
}

export async function saveFaqAction(formData: FormData) {
  await requireAdminUser();
  const supabase = createAdminClient();

  const id = toStringValue(formData.get("id"));
  const payload = {
    question_fr: toStringValue(formData.get("question_fr")),
    question_en: toStringValue(formData.get("question_en")),
    answer_fr: toStringValue(formData.get("answer_fr")),
    answer_en: toStringValue(formData.get("answer_en")),
    sort_order: Number(toStringValue(formData.get("sort_order")) || "0"),
    active: toBool(formData.get("active")),
  };

  if (id) {
    await supabase.from("faqs").update(payload).eq("id", id);
  } else {
    await supabase.from("faqs").insert(payload);
  }

  revalidatePath("/admin/content");
  revalidatePath("/faq");
}

export async function saveReviewAction(formData: FormData) {
  await requireAdminUser();
  const supabase = createAdminClient();

  const id = toStringValue(formData.get("id"));
  const payload = {
    author_name: toStringValue(formData.get("author_name")),
    rating: Number(toStringValue(formData.get("rating")) || "5"),
    quote_fr: toStringValue(formData.get("quote_fr")),
    quote_en: toStringValue(formData.get("quote_en")),
    source: toStringValue(formData.get("source")) || null,
    active: toBool(formData.get("active")),
  };

  if (id) {
    await supabase.from("reviews").update(payload).eq("id", id);
  } else {
    await supabase.from("reviews").insert(payload);
  }

  revalidatePath("/admin/content");
  revalidatePath("/reviews");
}

export async function saveBusinessHourAction(formData: FormData) {
  await requireAdminUser();
  const supabase = createAdminClient();

  const weekday = Number(toStringValue(formData.get("weekday")) || "0");
  const payload = {
    weekday,
    open_time: toStringValue(formData.get("open_time")) || "09:00:00",
    close_time: toStringValue(formData.get("close_time")) || "17:00:00",
    is_open: toBool(formData.get("is_open")),
  };

  await supabase.from("business_hours").upsert(payload, { onConflict: "weekday" });

  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidatePath("/booking");
}

export async function saveBookingRulesAction(formData: FormData) {
  await requireAdminUser();
  const supabase = createAdminClient();

  const payload = {
    id: 1,
    slot_interval_min: Number(toStringValue(formData.get("slot_interval_min")) || "15"),
    buffer_min: Number(toStringValue(formData.get("buffer_min")) || "15"),
    cancel_window_hours: Number(toStringValue(formData.get("cancel_window_hours")) || "24"),
  };

  await supabase.from("booking_rules").upsert(payload, { onConflict: "id" });

  revalidatePath("/admin/settings");
  revalidatePath("/booking");
}

export async function saveBusinessSettingsAction(formData: FormData) {
  await requireAdminUser();
  const supabase = createAdminClient();

  const value = {
    name: toStringValue(formData.get("name")),
    email: toStringValue(formData.get("email")),
    address: toStringValue(formData.get("address")),
    timezone: toStringValue(formData.get("timezone")) || "America/Toronto",
    phone: toStringValue(formData.get("phone")),
    instagram: toStringValue(formData.get("instagram")),
  };

  await supabase.from("site_settings").upsert({ key: "business", value }, { onConflict: "key" });

  revalidatePath("/admin/settings");
  revalidatePath("/contact");
  revalidatePath("/");
}

export async function savePolicySettingsAction(formData: FormData) {
  await requireAdminUser();
  const supabase = createAdminClient();

  const value = {
    cancellation: toStringValue(formData.get("cancellation")),
    privacy: toStringValue(formData.get("privacy")),
    terms: toStringValue(formData.get("terms")),
  };

  await supabase.from("site_settings").upsert({ key: "policies", value }, { onConflict: "key" });

  revalidatePath("/admin/settings");
  revalidatePath("/policies");
  revalidatePath("/contact");
}
