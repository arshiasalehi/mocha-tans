export const DEFAULT_TIMEZONE = "America/Toronto";

export const WEEKDAY_TO_INDEX: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

export const TAX_RATE_IDS = [
  process.env.STRIPE_TAX_RATE_GST_ID,
  process.env.STRIPE_TAX_RATE_QST_ID,
].filter(Boolean) as string[];
