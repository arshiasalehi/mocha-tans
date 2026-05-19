import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadLocalEnvFile() {
  const envFile = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envFile)) return;

  const content = fs.readFileSync(envFile, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;

    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadLocalEnvFile();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRole) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const supabase = createClient(supabaseUrl, serviceRole, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

type ExtractedData = {
  square_booking: {
    services: Array<{
      id: string;
      name: string;
      description: string;
      price_cents: number;
      duration_minutes: number;
    }>;
    hours_by_day: Array<{
      day: string;
      windows: Array<{
        open_24h: string;
        close_24h: string;
      }>;
    }>;
    business: {
      email: string;
    };
    location: {
      address_line_1: string;
      city_state_zip: string;
    };
  };
};

const filePath = path.resolve(process.cwd(), "../data/business_data.json");
const source: ExtractedData = JSON.parse(fs.readFileSync(filePath, "utf8"));

const dayMap: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const services = source.square_booking.services.map((service, index) => ({
  id: service.id,
  name_fr: service.name,
  name_en:
    service.name === "Spray tan Mocha rapide"
      ? "Mocha rapid spray tan"
      : service.name === "Spray tan Mocha à domicile"
        ? "Mocha at-home spray tan"
        : service.name === "Spray tan Mocha groupe"
          ? "Mocha group spray tan"
          : service.name,
  description_fr: service.description,
  description_en: service.description,
  duration_min: service.duration_minutes,
  price_cents: service.price_cents,
  active: true,
  image_url: [
    "/images/hero-f1.jpg",
    "/images/instagram_DX60QplDuar__carousel_1_image__13.jpg",
    "/images/instagram_DYZagBHDjZ1__main_image__1.jpg",
  ][index] ?? null,
}));

const hours = source.square_booking.hours_by_day
  .filter((d) => d.windows.length > 0)
  .map((d) => ({
    weekday: dayMap[d.day],
    open_time: `${d.windows[0].open_24h}:00`,
    close_time: `${d.windows[0].close_24h}:00`,
    is_open: true,
  }));

const products = [
  {
    slug: "radiance-extender",
    name_fr: "Radiance Extender",
    name_en: "Radiance Extender",
    description_fr: "Hydratant prolongateur d'éclat pour entretenir votre bronzage.",
    description_en: "Glow-extending moisturizer to maintain your tan.",
    price_cents: 4500,
    active: true,
    image_url: "/images/products-safe-1.jpg",
  },
  {
    slug: "prep-polish",
    name_fr: "Prep Polish",
    name_en: "Prep Polish",
    description_fr: "Exfoliant doux pour préparer la peau avant la séance.",
    description_en: "Gentle exfoliant to prep skin before your session.",
    price_cents: 3800,
    active: true,
    image_url: "/images/products-safe-2.jpg",
  },
  {
    slug: "golden-shimmer-oil",
    name_fr: "Golden Shimmer Oil",
    name_en: "Golden Shimmer Oil",
    description_fr: "Huile illuminatrice pour une finition dorée.",
    description_en: "Illuminating oil for a golden finish.",
    price_cents: 5200,
    active: true,
    image_url: "/images/products-safe-3.jpg",
  },
  {
    slug: "velvet-application-mitt",
    name_fr: "Velvet Application Mitt",
    name_en: "Velvet Application Mitt",
    description_fr: "Mitaine douce pour une application uniforme.",
    description_en: "Soft mitt for even application.",
    price_cents: 1800,
    active: true,
    image_url: "/images/highlight-prices.jpg",
  },
  {
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

const faqs = [
  {
    question_fr: "Que dois-je éviter avant la première douche?",
    question_en: "What should I avoid before my first shower?",
    answer_fr:
      "Évitez les frottements (vêtements serrés, sacs, peau contre peau) et tout contact avec l'eau durant le temps de pose.",
    answer_en:
      "Avoid friction (tight clothes, bags, skin-to-skin) and any water contact during the development window.",
    sort_order: 1,
    active: true,
  },
  {
    question_fr: "Quels produits sont spray tan safe?",
    question_en: "Which products are spray tan safe?",
    answer_fr:
      "Exemples observés: NUDA, Cetaphil, CeraVe, Aveeno, Native. Catégories: gel de douche, lotion corporelle, exfoliation.",
    answer_en:
      "Observed examples: NUDA, Cetaphil, CeraVe, Aveeno, Native. Categories: shower gel, body lotion, exfoliation.",
    sort_order: 2,
    active: true,
  },
  {
    question_fr: "Quels sont vos horaires?",
    question_en: "What are your hours?",
    answer_fr: "Lundi au vendredi: 10:00-21:00. Samedi et dimanche: 12:00-17:00.",
    answer_en: "Monday-Friday: 10:00-21:00. Saturday-Sunday: 12:00-17:00.",
    sort_order: 3,
    active: true,
  },
];

const reviews = [
  {
    author_name: "Instagram Highlights",
    rating: 5,
    quote_fr:
      "Les témoignages complets sont disponibles dans le highlight REVIEWS sur Instagram.",
    quote_en:
      "Full testimonials are available in the REVIEWS highlight on Instagram.",
    source: "Instagram REVIEWS highlight",
    active: true,
  },
];

const settings = [
  {
    key: "business",
    value: {
      name: "Mocha Tans",
      email: source.square_booking.business.email,
      address: `${source.square_booking.location.address_line_1}, ${source.square_booking.location.city_state_zip}`,
      timezone: "America/Toronto",
      phone: "",
      instagram: "https://www.instagram.com/mochatansmtl/",
    },
  },
  {
    key: "policies",
    value: {
      cancellation: "Free cancellation/reschedule up to 24h before appointment."
    },
  },
];

async function run() {
  const { error: servicesError } = await supabase.from("services").upsert(services, {
    onConflict: "id",
  });
  if (servicesError) throw servicesError;

  const { error: hoursError } = await supabase.from("business_hours").upsert(hours, {
    onConflict: "weekday",
  });
  if (hoursError) throw hoursError;

  const { error: productsError } = await supabase.from("products").upsert(products, {
    onConflict: "slug",
  });
  if (productsError) throw productsError;

  const { error: faqError } = await supabase.from("faqs").upsert(faqs, {
    onConflict: "question_fr",
  });
  if (faqError) throw faqError;

  const { error: reviewsError } = await supabase.from("reviews").upsert(reviews, {
    onConflict: "author_name",
  });
  if (reviewsError) throw reviewsError;

  const { error: settingsError } = await supabase.from("site_settings").upsert(settings, {
    onConflict: "key",
  });
  if (settingsError) throw settingsError;

  console.log("Seed completed successfully.");
}

run().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
