import { describe, expect, it } from "vitest";
import { generateAvailabilitySlots, withinCancellationWindow } from "@/lib/booking";
import { calculateOrderTotalCents } from "@/lib/pricing";

describe("booking availability", () => {
  it("generates slots on 15-min intervals and avoids overlaps", () => {
    const slots = generateAvailabilitySlots({
      dateIso: "2026-05-18T00:00:00.000Z",
      businessHours: [{ weekday: 1, open_time: "10:00:00", close_time: "13:00:00", is_open: true }],
      bookings: [
        {
          appointment_start: "2026-05-18T14:00:00.000Z",
          appointment_end: "2026-05-18T15:15:00.000Z",
        },
      ],
      serviceDurationMin: 60,
      rules: { slot_interval_min: 15, buffer_min: 15, cancel_window_hours: 24 },
      timezone: "America/Toronto",
    });

    expect(slots.length).toBeGreaterThan(0);
    expect(slots.some((s) => s.startIso === "2026-05-18T14:00:00.000Z")).toBe(false);
    expect(slots.some((s) => s.startIso === "2026-05-18T15:30:00.000Z")).toBe(true);
  });

  it("enforces cancellation window", () => {
    const future = new Date(Date.now() + 30 * 60 * 60 * 1000).toISOString();
    const near = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    expect(withinCancellationWindow(future, 24)).toBe(true);
    expect(withinCancellationWindow(near, 24)).toBe(false);
  });
});

describe("pricing", () => {
  it("calculates subtotal and totals", () => {
    const totals = calculateOrderTotalCents({
      lines: [
        { quantity: 2, unit_price_cents: 4500 },
        { quantity: 1, unit_price_cents: 1800 },
      ],
      combinedTaxRateBps: 1497,
    });

    expect(totals.subtotal_cents).toBe(10800);
    expect(totals.tax_cents).toBe(1617);
    expect(totals.total_cents).toBe(12417);
  });
});
