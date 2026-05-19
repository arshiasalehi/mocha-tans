export type Locale = "fr" | "en";

export type Service = {
  id: string;
  name_fr: string;
  name_en: string;
  description_fr: string;
  description_en: string;
  duration_min: number;
  price_cents: number;
  active: boolean;
  image_url: string | null;
};

export type BusinessHour = {
  weekday: number;
  open_time: string;
  close_time: string;
  is_open: boolean;
};

export type BookingStatus = "pending" | "paid" | "cancelled" | "rescheduled" | "completed";

export type Booking = {
  id: string;
  service_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  appointment_start: string;
  appointment_end: string;
  status: BookingStatus;
  total_cents: number;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  locale: Locale;
  auth_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type BookingWithService = Booking & {
  services?: Pick<Service, "id" | "name_fr" | "name_en" | "duration_min"> | null;
};

export type Product = {
  id: string;
  slug: string;
  name_fr: string;
  name_en: string;
  description_fr: string;
  description_en: string;
  price_cents: number;
  active: boolean;
  image_url: string | null;
};

export type OrderStatus = "pending" | "paid" | "cancelled" | "fulfilled";

export type Order = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  status: OrderStatus;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  pickup_notes: string | null;
  locale: Locale;
  auth_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
  products?: Pick<Product, "id" | "slug" | "name_fr" | "name_en"> | null;
};

export type CartItem = {
  productId: string;
  quantity: number;
};

export type BookingRules = {
  slot_interval_min: number;
  buffer_min: number;
  cancel_window_hours: number;
};

export type AvailabilitySlot = {
  startIso: string;
  endIso: string;
  label: string;
};

export type Faq = {
  id: string;
  question_fr: string;
  question_en: string;
  answer_fr: string;
  answer_en: string;
  sort_order?: number;
  active?: boolean;
};

export type Review = {
  id: string;
  author_name: string;
  rating: number;
  quote_fr: string;
  quote_en: string;
  source: string | null;
  active?: boolean;
};

export type SiteBusinessSettings = {
  name: string;
  email: string;
  address: string;
  timezone: string;
  phone: string;
  instagram: string;
};

export type SitePoliciesSettings = {
  cancellation: string;
  privacy?: string;
  terms?: string;
};

export type SiteSettingsMap = {
  business: SiteBusinessSettings;
  policies: SitePoliciesSettings;
  [key: string]: unknown;
};
