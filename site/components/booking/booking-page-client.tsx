"use client";

import { useEffect, useMemo, useState } from "react";
import type { AvailabilitySlot, Locale, Service } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { useLocale } from "@/components/providers/locale-provider";

type BookingPageClientProps = {
  services: Service[];
};

type ApiAvailabilityResponse =
  | { ok: true; data: { slots: AvailabilitySlot[] } }
  | { ok: false; code: string; message: string };

type CheckoutResponse =
  | { ok: true; data: { checkoutUrl: string } }
  | { ok: false; code: string; message: string };

export function BookingPageClient({ services }: BookingPageClientProps) {
  const { locale } = useLocale();

  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedService = useMemo(
    () => services.find((service) => service.id === serviceId),
    [services, serviceId],
  );

  useEffect(() => {
    async function loadSlots() {
      if (!serviceId || !date) return;
      setIsLoadingSlots(true);
      setSelectedSlot(null);
      setError(null);

      try {
        const res = await fetch(`/api/availability?serviceId=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(date)}`);
        const payload = (await res.json()) as ApiAvailabilityResponse;

        if (!payload.ok) {
          setSlots([]);
          setError(payload.message);
          return;
        }

        setSlots(payload.data.slots);
      } catch {
        setError("Unable to load availability.");
        setSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    }

    loadSlots();
  }, [serviceId, date]);

  async function handleCheckout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSlot || !selectedService) {
      setError("Please choose a slot before checkout.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/bookings/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService.id,
          startIso: selectedSlot.startIso,
          locale: locale satisfies Locale,
          customer: {
            name,
            email,
            phone,
          },
        }),
      });

      const payload = (await res.json()) as CheckoutResponse;
      if (!payload.ok) {
        setError(payload.message);
        return;
      }

      window.location.assign(payload.data.checkoutUrl);
    } catch {
      setError("Unable to start Stripe checkout.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="container-page py-16">
      <h1 className="font-display text-4xl text-[#6e4800]">{locale === "fr" ? "Réservation" : "Booking"}</h1>
      <p className="mt-3 text-zinc-600">
        {locale === "fr"
          ? "Sélectionnez votre service, choisissez une plage horaire et finalisez avec Stripe."
          : "Select your service, pick a time slot, and complete checkout with Stripe."}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <form onSubmit={handleCheckout} className="space-y-5 rounded-3xl border border-[#eadfce] bg-white p-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#6e4800]">{locale === "fr" ? "Service" : "Service"}</label>
            <select
              value={serviceId}
              onChange={(event) => setServiceId(event.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2"
            >
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {locale === "fr" ? service.name_fr : service.name_en} · {formatCurrency(service.price_cents)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#6e4800]">{locale === "fr" ? "Date" : "Date"}</label>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#6e4800]">
              {locale === "fr" ? "Plages disponibles" : "Available slots"}
            </label>
            {isLoadingSlots ? (
              <p className="text-sm text-zinc-500">Loading...</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-zinc-500">
                {locale === "fr" ? "Aucune disponibilité pour cette date." : "No availability for this date."}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {slots.map((slot) => (
                  <button
                    key={slot.startIso}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      selectedSlot?.startIso === slot.startIso
                        ? "border-[#8e5e01] bg-[#8e5e01] text-white"
                        : "border-zinc-300"
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#6e4800]">Name</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="w-full rounded-xl border border-zinc-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#6e4800]">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full rounded-xl border border-zinc-300 px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#6e4800]">Phone</label>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2"
            />
          </div>

          {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={!selectedSlot || isSubmitting}
            className="w-full rounded-full bg-[#8e5e01] px-6 py-3 font-semibold text-white disabled:opacity-50"
          >
            {isSubmitting ? "Loading..." : locale === "fr" ? "Payer et confirmer" : "Pay and confirm"}
          </button>
        </form>

        <aside className="rounded-3xl border border-[#eadfce] bg-white p-6">
          <h2 className="font-display text-2xl text-[#6e4800]">
            {locale === "fr" ? "Résumé" : "Summary"}
          </h2>
          {selectedService ? (
            <>
              <p className="mt-4 font-semibold text-zinc-800">
                {locale === "fr" ? selectedService.name_fr : selectedService.name_en}
              </p>
              <p className="mt-1 text-sm text-zinc-600">{selectedService.duration_min} min</p>
              <p className="mt-1 text-lg font-bold text-[#8e5e01]">{formatCurrency(selectedService.price_cents)}</p>
            </>
          ) : null}

          <div className="mt-6 rounded-xl bg-[#f7f3ee] p-4 text-sm text-zinc-700">
            <p>
              {locale === "fr"
                ? "Politique: annulation gratuite jusqu'à 24h avant le rendez-vous."
                : "Policy: free cancellation up to 24h before appointment."}
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
