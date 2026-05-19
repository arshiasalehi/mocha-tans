"use client";

import { useLocale } from "@/components/providers/locale-provider";

export function LocaleValue({ fr, en }: { fr: string; en: string }) {
  const { locale } = useLocale();
  return <>{locale === "fr" ? fr : en}</>;
}
