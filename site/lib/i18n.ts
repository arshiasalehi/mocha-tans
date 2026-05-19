import type { Locale } from "@/lib/types";

export const defaultLocale: Locale = "fr";

export const locales: Locale[] = ["fr", "en"];

export const translations = {
  fr: {
    brand: "Mocha Tans",
    nav: {
      home: "Accueil",
      services: "Services",
      booking: "Réservation",
      shop: "Boutique",
      bundles: "Forfaits",
      gallery: "Galerie",
      reviews: "Avis",
      faq: "FAQ",
      contact: "Contact",
      account: "Compte",
      admin: "Admin",
    },
    cta: {
      book: "Réserver",
      shop: "Magasiner",
      viewAll: "Voir tout",
      checkout: "Passer au paiement",
      submit: "Soumettre",
    },
    home: {
      headline: "Spray Tan Premium à Montréal et Rive-Sud",
      sub: "Service certifié NUDA & Mix. Réservez en ligne et payez en toute sécurité.",
    },
  },
  en: {
    brand: "Mocha Tans",
    nav: {
      home: "Home",
      services: "Services",
      booking: "Booking",
      shop: "Shop",
      bundles: "Bundles",
      gallery: "Gallery",
      reviews: "Reviews",
      faq: "FAQ",
      contact: "Contact",
      account: "Account",
      admin: "Admin",
    },
    cta: {
      book: "Book Now",
      shop: "Shop",
      viewAll: "View all",
      checkout: "Checkout",
      submit: "Submit",
    },
    home: {
      headline: "Luxury Spray Tan in Montreal and South Shore",
      sub: "Certified NUDA & Mix artist. Book online and pay securely.",
    },
  },
} as const;

export function t(locale: Locale) {
  return translations[locale] ?? translations[defaultLocale];
}
