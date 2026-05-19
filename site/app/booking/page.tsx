import { BookingPageClient } from "@/components/booking/booking-page-client";
import { getServices } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function BookingPage() {
  const services = await getServices();
  return <BookingPageClient services={services} />;
}
