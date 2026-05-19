import { HomePage } from "@/components/home/home-page";
import {
  getBusinessHours,
  getFaqs,
  getProducts,
  getReviews,
  getServices,
  getSiteSettings,
} from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [services, products, hours, faqs, reviews, settings] = await Promise.all([
    getServices(),
    getProducts(),
    getBusinessHours(),
    getFaqs(),
    getReviews(),
    getSiteSettings(),
  ]);

  return (
    <HomePage
      services={services}
      products={products}
      hours={hours}
      faqs={faqs}
      reviews={reviews}
      settings={settings}
    />
  );
}
