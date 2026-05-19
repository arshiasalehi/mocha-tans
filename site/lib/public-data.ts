import { createClient } from "@/utils/supabase/server";
import type {
  BookingRules,
  BusinessHour,
  Faq,
  Product,
  Review,
  Service,
  SiteSettingsMap,
} from "@/lib/types";

const fallbackServices: Service[] = [
  {
    id: "GKQSPCGVEU3MMVLM4FRACAZT",
    name_fr: "Spray tan Mocha rapide",
    name_en: "Mocha rapid spray tan",
    description_fr: "Service rapide haut de gamme avec rinçage entre 1 et 6 heures.",
    description_en: "Premium rapid solution with rinse window between 1 and 6 hours.",
    duration_min: 60,
    price_cents: 5500,
    active: true,
    image_url: "/images/hero-f1.jpg",
  },
  {
    id: "Q5O23WTNP2EMYKONVZ26VKIY",
    name_fr: "Spray tan Mocha à domicile",
    name_en: "Mocha at-home spray tan",
    description_fr: "Le service Mocha chez vous, dans le confort de votre maison.",
    description_en: "Mocha service in the comfort of your home.",
    duration_min: 60,
    price_cents: 8000,
    active: true,
    image_url: "/images/instagram_DX60QplDuar__carousel_1_image__13.jpg",
  },
  {
    id: "TLRWFFA2DC3VDH6THOUG6MGN",
    name_fr: "Spray tan Mocha groupe",
    name_en: "Mocha group spray tan",
    description_fr: "Expérience de groupe premium pour événements et célébrations.",
    description_en: "Premium group experience for events and celebrations.",
    duration_min: 240,
    price_cents: 19000,
    active: true,
    image_url: "/images/instagram_DYZagBHDjZ1__main_image__1.jpg",
  },
];

const fallbackProducts: Product[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    slug: "radiance-extender",
    name_fr: "Radiance Extender",
    name_en: "Radiance Extender",
    description_fr: "Hydratant prolongateur d'éclat.",
    description_en: "Glow-extending moisturizer.",
    price_cents: 4500,
    active: true,
    image_url: "/images/products-safe-1.jpg",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    slug: "prep-polish",
    name_fr: "Prep Polish",
    name_en: "Prep Polish",
    description_fr: "Exfoliant doux pré-séance.",
    description_en: "Gentle pre-session exfoliant.",
    price_cents: 3800,
    active: true,
    image_url: "/images/products-safe-2.jpg",
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    slug: "golden-shimmer-oil",
    name_fr: "Golden Shimmer Oil",
    name_en: "Golden Shimmer Oil",
    description_fr: "Huile illuminatrice corps.",
    description_en: "Body shimmer oil.",
    price_cents: 5200,
    active: true,
    image_url: "/images/products-safe-3.jpg",
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    slug: "velvet-application-mitt",
    name_fr: "Velvet Application Mitt",
    name_en: "Velvet Application Mitt",
    description_fr: "Mitaine pour application uniforme.",
    description_en: "Mitt for even application.",
    price_cents: 1800,
    active: true,
    image_url: "/images/highlight-prices.jpg",
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    slug: "bundle-glow-trio",
    name_fr: "Forfait Glow Trio (3 séances)",
    name_en: "Glow Trio Bundle (3 sessions)",
    description_fr: "Trois séances spray tan avec tarif réduit. Crédit utilisable sur rendez-vous futurs.",
    description_en: "Three spray tan sessions at a discounted rate. Credits are used for future appointments.",
    price_cents: 15000,
    active: true,
    image_url: "/images/highlight-hours.jpg",
  },
  {
    id: "66666666-6666-6666-6666-666666666666",
    slug: "bundle-glow-signature",
    name_fr: "Forfait Glow Signature (5 séances)",
    name_en: "Glow Signature Bundle (5 sessions)",
    description_fr: "Cinq séances spray tan premium avec réduction maximale pour clientes régulières.",
    description_en: "Five premium spray tan sessions with maximum savings for returning clients.",
    price_cents: 23500,
    active: true,
    image_url: "/images/highlight-faq.jpg",
  },
];

const fallbackHours: BusinessHour[] = [
  { weekday: 1, open_time: "10:00:00", close_time: "21:00:00", is_open: true },
  { weekday: 2, open_time: "10:00:00", close_time: "21:00:00", is_open: true },
  { weekday: 3, open_time: "10:00:00", close_time: "21:00:00", is_open: true },
  { weekday: 4, open_time: "10:00:00", close_time: "21:00:00", is_open: true },
  { weekday: 5, open_time: "10:00:00", close_time: "21:00:00", is_open: true },
  { weekday: 6, open_time: "12:00:00", close_time: "17:00:00", is_open: true },
  { weekday: 0, open_time: "12:00:00", close_time: "17:00:00", is_open: true },
];

const fallbackFaqs: Faq[] = [
  {
    id: "f1",
    question_fr: "Que dois-je éviter avant la première douche?",
    question_en: "What should I avoid before my first shower?",
    answer_fr: "Évitez les frottements et le contact avec l'eau durant le temps de pose.",
    answer_en: "Avoid friction and water contact during development time.",
  },
];

const fallbackReviews: Review[] = [
  {
    id: "r1",
    author_name: "Instagram Highlights",
    rating: 5,
    quote_fr: "Consultez le highlight REVIEWS sur Instagram pour les témoignages complets.",
    quote_en: "See the REVIEWS Instagram highlight for full testimonials.",
    source: "Instagram",
  },
];

const fallbackSettings: SiteSettingsMap = {
  business: {
    name: "Mocha Tans",
    email: "mochatansmtl@gmail.com",
    address: "1200 Rue Gauthier, Longueuil, QC J4T 3N7",
    timezone: "America/Toronto",
    phone: "",
    instagram: "https://www.instagram.com/mochatansmtl/",
  },
  policies: {
    cancellation: "Free cancellation/reschedule up to 24h before appointment.",
  },
};

const fallbackRules: BookingRules = {
  slot_interval_min: 15,
  buffer_min: 15,
  cancel_window_hours: 24,
};

export async function getServices(): Promise<Service[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("active", true)
      .order("price_cents", { ascending: true });

    if (error || !data) return fallbackServices;
    return data as Service[];
  } catch {
    return fallbackServices;
  }
}

export async function getProducts(): Promise<Product[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("price_cents", { ascending: true });

    if (error || !data) return fallbackProducts;
    return data as Product[];
  } catch {
    return fallbackProducts;
  }
}

export async function getBusinessHours(): Promise<BusinessHour[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("business_hours")
      .select("weekday, open_time, close_time, is_open")
      .order("weekday", { ascending: true });

    if (error || !data) return fallbackHours;
    return data as BusinessHour[];
  } catch {
    return fallbackHours;
  }
}

export async function getBookingRules(): Promise<BookingRules> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("booking_rules")
      .select("slot_interval_min, buffer_min, cancel_window_hours")
      .eq("id", 1)
      .single();

    if (error || !data) return fallbackRules;
    return data as BookingRules;
  } catch {
    return fallbackRules;
  }
}

export async function getFaqs(): Promise<Faq[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (error || !data) return fallbackFaqs;
    return data as Faq[];
  } catch {
    return fallbackFaqs;
  }
}

export async function getReviews(): Promise<Review[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error || !data) return fallbackReviews;
    return data as Review[];
  } catch {
    return fallbackReviews;
  }
}

export async function getSiteSettings(): Promise<SiteSettingsMap> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("site_settings").select("key, value");

    if (error || !data) return fallbackSettings;

    const map = Object.fromEntries(data.map((item) => [item.key, item.value])) as Partial<SiteSettingsMap>;

    return {
      ...fallbackSettings,
      ...map,
      business: {
        ...fallbackSettings.business,
        ...(map.business as Partial<SiteSettingsMap["business"]> | undefined),
      },
      policies: {
        ...fallbackSettings.policies,
        ...(map.policies as Partial<SiteSettingsMap["policies"]> | undefined),
      },
    };
  } catch {
    return fallbackSettings;
  }
}
