import { addMinutes, format, isBefore, set } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { DEFAULT_TIMEZONE } from "@/lib/constants";
import type { AvailabilitySlot, Booking, BookingRules, BusinessHour } from "@/lib/types";

function parseTime(value: string) {
  const [h, m] = value.split(":").map(Number);
  return { hour: h, minute: m };
}

function getBusinessDay(dateIso: string, timezone: string) {
  const datePart = dateIso.slice(0, 10);
  return toZonedTime(new Date(`${datePart}T12:00:00.000Z`), timezone);
}

export function generateAvailabilitySlots(params: {
  dateIso: string;
  businessHours: BusinessHour[];
  bookings: Pick<Booking, "appointment_start" | "appointment_end">[];
  serviceDurationMin: number;
  rules: BookingRules;
  timezone?: string;
}): AvailabilitySlot[] {
  const {
    dateIso,
    businessHours,
    bookings,
    serviceDurationMin,
    rules,
    timezone = DEFAULT_TIMEZONE,
  } = params;

  const dayBase = getBusinessDay(dateIso, timezone);
  const day = dayBase.getDay();
  const hoursWindow = businessHours.find((h) => h.weekday === day && h.is_open);
  if (!hoursWindow) return [];

  const open = parseTime(hoursWindow.open_time);
  const close = parseTime(hoursWindow.close_time);

  const startLocal = set(dayBase, {
    hours: open.hour,
    minutes: open.minute,
    seconds: 0,
    milliseconds: 0,
  });

  const closeLocal = set(dayBase, {
    hours: close.hour,
    minutes: close.minute,
    seconds: 0,
    milliseconds: 0,
  });

  const slots: AvailabilitySlot[] = [];
  const nowUtc = new Date();

  let cursor = startLocal;
  while (
    isBefore(addMinutes(cursor, serviceDurationMin), closeLocal) ||
    +addMinutes(cursor, serviceDurationMin) === +closeLocal
  ) {
    const proposedStartUtc = fromZonedTime(cursor, timezone);
    const proposedServiceEndUtc = addMinutes(proposedStartUtc, serviceDurationMin);
    const proposedEndWithBufferUtc = addMinutes(proposedServiceEndUtc, rules.buffer_min);

    const conflict = bookings.some((booking) => {
      const bookedStart = new Date(booking.appointment_start);
      const bookedServiceEnd = new Date(booking.appointment_end);
      const bookedEndWithBuffer = addMinutes(bookedServiceEnd, rules.buffer_min);

      return proposedStartUtc < bookedEndWithBuffer && proposedEndWithBufferUtc > bookedStart;
    });

    if (!conflict && proposedStartUtc > nowUtc) {
      slots.push({
        startIso: proposedStartUtc.toISOString(),
        endIso: proposedServiceEndUtc.toISOString(),
        label: format(cursor, "HH:mm"),
      });
    }

    cursor = addMinutes(cursor, rules.slot_interval_min);
  }

  return slots;
}

export function withinCancellationWindow(appointmentStartIso: string, cancelWindowHours: number): boolean {
  const now = new Date();
  const appointment = new Date(appointmentStartIso);
  const minAllowed = addMinutes(now, cancelWindowHours * 60);
  return appointment >= minAllowed;
}
