"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/components/providers/locale-provider";
import { formatCurrency } from "@/lib/format";
import type { BusinessHour, Faq, Product, Review, Service, SiteSettingsMap } from "@/lib/types";

type HomePageProps = {
  services: Service[];
  products: Product[];
  hours: BusinessHour[];
  faqs: Faq[];
  reviews: Review[];
  settings: SiteSettingsMap;
};

const dayNames: Record<number, { fr: string; en: string }> = {
  0: { fr: "Dimanche", en: "Sunday" },
  1: { fr: "Lundi", en: "Monday" },
  2: { fr: "Mardi", en: "Tuesday" },
  3: { fr: "Mercredi", en: "Wednesday" },
  4: { fr: "Jeudi", en: "Thursday" },
  5: { fr: "Vendredi", en: "Friday" },
  6: { fr: "Samedi", en: "Saturday" },
};

const galleryImages = [
  "/images/gallery-1.jpg",
  "/images/gallery-2.jpg",
  "/images/gallery-3.jpg",
  "/images/gallery-4.jpg",
  "/images/instagram_DX60QplDuar__carousel_1_image__13.jpg",
  "/images/instagram_DYZagBHDjZ1__main_image__1.jpg",
];

const experienceSteps = [
  {
    frTitle: "Préparez votre peau",
    enTitle: "Prep & Prime",
    frText: "Exfoliez 24h avant et évitez huiles, lotions et maquillage le jour du rendez-vous.",
    enText: "Exfoliate 24h before and avoid oils, lotions, and makeup on appointment day.",
  },
  {
    frTitle: "Application experte",
    enTitle: "The Session",
    frText: "Application professionnelle personnalisée selon votre teinte et l'intensité recherchée.",
    enText: "Professional custom application based on your skin tone and desired depth.",
  },
  {
    frTitle: "Glow longue durée",
    enTitle: "Glow & Go",
    frText: "Rincez selon la formule choisie et hydratez quotidiennement pour prolonger l'éclat.",
    enText: "Rinse according to your chosen formula and moisturize daily to extend your glow.",
  },
];

export function HomePage({ services, products, hours, faqs, reviews, settings }: HomePageProps) {
  const { locale } = useLocale();
  const [sliderPos, setSliderPos] = useState(50);
  const [isSliderDragging, setIsSliderDragging] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const heroRef = useRef<HTMLElement | null>(null);
  const heroTextProgressRef = useRef(0);
  const heroTextUnlockedRef = useRef(false);
  const touchLastYRef = useRef<number | null>(null);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const sliderAutoplayBlockedRef = useRef(false);

  const business = settings.business;

  const filteredServices = useMemo(() => services.slice(0, 3), [services]);

  const bundleProducts = useMemo(
    () => products.filter((product) => product.slug.startsWith("bundle-")).slice(0, 3),
    [products],
  );

  const topReviews = useMemo(() => reviews.slice(0, 2), [reviews]);
  const galleryLoopImages = useMemo(() => [...galleryImages, ...galleryImages], []);

  const ratingSummary = useMemo(() => {
    if (reviews.length === 0) return { average: 5, count: 0 };
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return {
      average: Number((total / reviews.length).toFixed(1)),
      count: reviews.length,
    };
  }, [reviews]);

  const sortedHours = useMemo(
    () => hours.slice().sort((a, b) => a.weekday - b.weekday),
    [hours],
  );

  const currency = (cents: number) => formatCurrency(cents, locale === "fr" ? "fr-CA" : "en-CA");

  const updateSliderFromClientX = (clientX: number) => {
    const rect = sliderRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    setSliderPos((x / rect.width) * 100);
  };

  const onSliderPointerDown: React.PointerEventHandler<HTMLDivElement> = (event) => {
    draggingRef.current = true;
    setIsSliderDragging(true);
    sliderAutoplayBlockedRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateSliderFromClientX(event.clientX);
  };

  const onSliderPointerMove: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (!draggingRef.current) return;
    updateSliderFromClientX(event.clientX);
  };

  const onSliderPointerUp: React.PointerEventHandler<HTMLDivElement> = (event) => {
    draggingRef.current = false;
    setIsSliderDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  useEffect(() => {
    const animatedNodes = Array.from(document.querySelectorAll<HTMLElement>("[data-animate]"));
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.18, rootMargin: "0px 0px -10% 0px" });

    document.documentElement.classList.add("motion-enhanced");
    for (const node of animatedNodes) {
      node.classList.add("will-animate");
    }

    requestAnimationFrame(() => {
      for (const node of animatedNodes) {
        observer.observe(node);
      }

      for (const node of animatedNodes) {
        void node.offsetHeight;
      }

      requestAnimationFrame(() => {
        for (const node of animatedNodes) {
          if (node.getBoundingClientRect().top < window.innerHeight * 0.92) {
            node.classList.add("in-view");
          }
        }
      });
    });

    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("motion-enhanced");
    };
  }, []);

  useEffect(() => {
    const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-tilt='card']"));
    const cleanups: Array<() => void> = [];

    for (const card of cards) {
      let raf: number | null = null;
      let tiltX = 0;
      let tiltY = 0;

      const apply = () => {
        card.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
        card.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
        raf = null;
      };

      const onMove = (event: PointerEvent) => {
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        tiltX = (px - 0.5) * 8;
        tiltY = (0.5 - py) * 8;
        card.style.setProperty("--glow-x", `${(px * 100).toFixed(1)}%`);
        card.style.setProperty("--glow-y", `${(py * 100).toFixed(1)}%`);
        card.classList.add("is-tilting");
        if (!raf) {
          raf = requestAnimationFrame(apply);
        }
      };

      const onLeave = () => {
        tiltX = 0;
        tiltY = 0;
        card.style.setProperty("--tilt-x", "0deg");
        card.style.setProperty("--tilt-y", "0deg");
        card.classList.remove("is-tilting");
      };

      card.addEventListener("pointermove", onMove);
      card.addEventListener("pointerleave", onLeave);
      card.addEventListener("pointerup", onLeave);

      cleanups.push(() => {
        if (raf) cancelAnimationFrame(raf);
        card.removeEventListener("pointermove", onMove);
        card.removeEventListener("pointerleave", onLeave);
        card.removeEventListener("pointerup", onLeave);
      });
    }

    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  }, [filteredServices.length, bundleProducts.length]);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    hero.style.setProperty("--hero-text-progress", "0");

    const applyHeroTextProgress = (delta: number) => {
      const next = Math.max(0, Math.min(1, heroTextProgressRef.current + delta * 0.0026));
      heroTextProgressRef.current = next;
      heroTextUnlockedRef.current = next >= 1;
      hero.style.setProperty("--hero-text-progress", next.toFixed(3));
    };

    const onWheel = (event: WheelEvent) => {
      const nearTop = window.scrollY <= 2;
      const canReverse = heroTextProgressRef.current > 0 && event.deltaY < 0;
      if (!nearTop || (heroTextUnlockedRef.current && !canReverse)) return;

      event.preventDefault();
      applyHeroTextProgress(event.deltaY);
      if (heroTextUnlockedRef.current && event.deltaY > 0) {
        window.scrollBy({ top: Math.max(1, event.deltaY * 0.45), behavior: "auto" });
      }
    };

    const onTouchStart = (event: TouchEvent) => {
      touchLastYRef.current = event.touches[0]?.clientY ?? null;
    };

    const onTouchMove = (event: TouchEvent) => {
      const currentY = event.touches[0]?.clientY;
      if (currentY == null) return;

      const previousY = touchLastYRef.current ?? currentY;
      touchLastYRef.current = currentY;

      const nearTop = window.scrollY <= 2;
      const delta = previousY - currentY;
      const canReverse = heroTextProgressRef.current > 0 && delta < 0;
      if (!nearTop || (heroTextUnlockedRef.current && !canReverse)) return;

      event.preventDefault();
      applyHeroTextProgress(delta);
      if (heroTextUnlockedRef.current && delta > 0) {
        window.scrollBy({ top: Math.max(1, delta * 0.55), behavior: "auto" });
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    let raf: number | null = null;

    const update = () => {
      const rect = hero.getBoundingClientRect();
      const imageProgress = Math.max(0, Math.min(1, (-rect.top / rect.height) * 2.2));
      hero.style.setProperty("--hero-image-progress", imageProgress.toFixed(3));
      raf = null;
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const timers: number[] = [];

    const pushLater = (ms: number, cb: () => void) => {
      const id = window.setTimeout(() => {
        if (!sliderAutoplayBlockedRef.current) cb();
      }, ms);
      timers.push(id);
    };

    pushLater(1200, () => setSliderPos(70));
    pushLater(2200, () => setSliderPos(32));
    pushLater(3200, () => setSliderPos(50));

    return () => {
      for (const id of timers) window.clearTimeout(id);
    };
  }, []);

  return (
    <div className="grainy-bg relative overflow-x-hidden bg-[#fdf9f4]">
      <section
        ref={heroRef}
        className="hero-stage relative flex h-screen min-h-[700px] items-center justify-center overflow-hidden"
        style={{ "--hero-text-progress": "0", "--hero-image-progress": "0" } as React.CSSProperties}
      >
        <div className="hero-photo-intro absolute inset-0 z-0">
          <video
            className="hero-scroll-visual h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/images/instagram_DYZagBHDjZ1__main_image__1.jpg"
          >
            <source src="/videos/hero-underwater.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#fdf9f4] via-transparent to-transparent" />
        </div>

        <div className="hero-scroll-copy relative z-10 mx-auto w-full max-w-[1200px] px-5 text-center text-white">
          <h1 className="hero-copy-intro font-display text-[40px] leading-[1.15] md:text-[64px]">
            {locale === "fr" ? "Votre glow parfait" : "Your Perfect Glow"}
            <br />
            <span className="font-normal italic">
              {locale === "fr" ? "fait sur mesure" : "warmly crafted for you"}
            </span>
          </h1>
          <p className="hero-copy-intro-delay-1 mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#fdf9f4]/90">
            {locale === "fr"
              ? "Découvrez l'art du spray tan personnalisé, en studio ou à domicile. Une expertise certifiée pour chaque teinte de peau."
              : "Experience custom spray tanning in studio or at home. Certified artistry for every unique skin tone."}
          </p>
          <div className="hero-copy-intro-delay-2 mt-10 flex flex-wrap justify-center gap-5">
            <Link
              href="/booking"
              className="cta-glow rounded-full bg-[#8e5e01] px-12 py-5 text-xs font-bold uppercase tracking-[0.1em] text-[#ffe3c2] transition hover:scale-105"
            >
              {locale === "fr" ? "Réserver" : "Book Your Session"}
            </Link>
            <Link
              href="/bundles"
              className="rounded-full border border-white/40 bg-white/20 px-12 py-5 text-xs font-bold uppercase tracking-[0.1em] text-white transition hover:bg-white/30"
            >
              {locale === "fr" ? "Explorer les forfaits" : "Explore Bundles"}
            </Link>
          </div>
        </div>
      </section>

      <section className="relative z-20 -mt-10 rounded-t-[80px] bg-[#ffdbcc]/30 py-14">
        <div className="mx-auto grid w-full max-w-[1200px] grid-cols-2 gap-8 px-5 md:grid-cols-4">
          <div data-animate className="reveal text-center">
            <p className="text-3xl text-[#6e4800]">★</p>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.1em] text-[#795746]">{locale === "fr" ? "5 étoiles" : "5-Star Rated"}</p>
          </div>
          <div data-animate data-anim-delay="1" className="reveal stagger-1 text-center">
            <p className="text-3xl text-[#6e4800]">🔒</p>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.1em] text-[#795746]">Stripe Secure</p>
          </div>
          <div data-animate data-anim-delay="2" className="reveal stagger-2 text-center">
            <p className="text-3xl text-[#6e4800]">✓</p>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.1em] text-[#795746]">{locale === "fr" ? "Artiste certifiée" : "Certified Artist"}</p>
          </div>
          <div data-animate data-anim-delay="3" className="reveal stagger-3 text-center">
            <p className="text-3xl text-[#6e4800]">🚗</p>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.1em] text-[#795746]">{locale === "fr" ? "Studio + domicile" : "Mobile + Studio"}</p>
          </div>
        </div>
      </section>

      <section id="services" className="bg-gradient-to-b from-[#fdf9f4] to-[#f7f3ee] py-20">
        <div className="mx-auto w-full max-w-[1200px] px-5">
          <div data-animate className="reveal mb-12 text-center">
            <h2 className="font-display text-[32px] text-[#6e4800]">{locale === "fr" ? "Nos services" : "Our Services"}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-[#504537]">
              {locale === "fr"
                ? "Des solutions sur mesure selon votre événement, votre timing et le niveau d'intensité recherché."
                : "Tailored tanning solutions for your schedule, event, and preferred glow depth."}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {filteredServices.map((service, index) => (
              <article
                key={service.id}
                data-animate
                data-anim-delay={String(index + 1)}
                data-tilt="card"
                className={`reveal relative rounded-[32px] p-10 shadow-[0_20px_50px_rgba(122,65,34,0.08)] ${
                  index === 1
                    ? "z-10 scale-105 bg-[#7a4122] text-white"
                    : "bg-white text-[#1c1c19]"
                } ${index === 1 ? "stagger-1" : index === 2 ? "stagger-2" : ""}`}
              >
                <div className="mb-6 flex items-start justify-between gap-4">
                  <h3 className={`font-display text-2xl ${index === 1 ? "text-[#ffb692]" : "text-[#7a4122]"}`}>
                    {locale === "fr" ? service.name_fr : service.name_en}
                  </h3>
                  <span className={`text-xl font-semibold ${index === 1 ? "text-[#ffb692]" : "text-[#6e4800]"}`}>
                    {currency(service.price_cents)}
                  </span>
                </div>
                <p className={`mb-8 line-clamp-5 text-sm ${index === 1 ? "text-white/90" : "text-[#504537]"}`}>
                  {locale === "fr" ? service.description_fr : service.description_en}
                </p>
                <Link
                  href="/booking"
                  className={`inline-block w-full rounded-full py-4 text-center text-xs font-bold uppercase tracking-[0.1em] transition active:scale-95 ${
                    index === 1
                      ? "bg-[#ffddb2] text-[#291800]"
                      : "bg-[#975837] text-white"
                  }`}
                >
                  {locale === "fr" ? "Choisir ce service" : "Select Service"}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="bundles" className="bg-[#f7f3ee] py-20">
        <div className="mx-auto w-full max-w-[1200px] px-5">
          <div data-animate className="reveal mb-14 text-center">
            <h2 className="font-display text-[32px] text-[#7a4122]">{locale === "fr" ? "Forfaits glow" : "Glow Bundles"}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-[#504537]">
              {locale === "fr"
                ? "Prolongez votre éclat avec des forfaits multi-séances à prix avantageux."
                : "Keep your glow consistent with discounted multi-session bundles."}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {bundleProducts.map((bundle, index) => (
              <article
                key={bundle.id}
                data-animate
                data-anim-delay={String(index + 1)}
                data-tilt="card"
                className={`reveal relative rounded-[36px] border border-[#7a4122]/10 bg-white p-8 text-center shadow-sm ${
                  index === 1 ? "-translate-y-2 shadow-xl" : ""
                } ${index === 1 ? "stagger-2" : index === 2 ? "stagger-3" : "stagger-1"}`}
              >
                <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-[#ffdbcb]">
                  <Image
                    src={bundle.image_url ?? "/images/highlight-hours.jpg"}
                    alt={bundle.slug}
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                </div>
                <h4 className="font-display text-2xl text-[#7a4122]">{locale === "fr" ? bundle.name_fr : bundle.name_en}</h4>
                <p className="mt-3 text-sm text-[#504537]">{locale === "fr" ? bundle.description_fr : bundle.description_en}</p>
                <p className="mt-5 text-2xl font-bold text-[#6e4800]">{currency(bundle.price_cents)}</p>
                <Link
                  href="/bundles"
                  className="mt-6 inline-block rounded-full border border-[#6e4800] px-6 py-2 text-xs font-bold uppercase tracking-[0.1em] text-[#6e4800]"
                >
                  {locale === "fr" ? "Voir détails" : "View Bundle"}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto w-full max-w-[1200px] px-5">
          <div data-animate className="reveal mb-14 text-center">
            <h2 className="font-display text-[32px] text-[#6e4800]">{locale === "fr" ? "L'expérience Mocha" : "The Mocha Experience"}</h2>
          </div>

          <div className="relative grid gap-12 md:grid-cols-3">
            <div className="absolute left-0 top-1/2 hidden h-px w-full -translate-y-1/2 bg-[#d4c4b1] md:block" />
            {experienceSteps.map((step, index) => (
              <article
                key={step.enTitle}
                data-animate
                data-anim-delay={String(index + 1)}
                className={`reveal relative z-10 text-center ${index === 1 ? "stagger-1" : index === 2 ? "stagger-2" : ""}`}
              >
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#6e4800] bg-[#fdf9f4]">
                  <span className="font-display text-xl text-[#6e4800]">{`0${index + 1}`}</span>
                </div>
                <h3 className="font-display text-2xl text-[#795746]">{locale === "fr" ? step.frTitle : step.enTitle}</h3>
                <p className="mt-3 text-sm text-[#504537]">{locale === "fr" ? step.frText : step.enText}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="transformation" className="bg-[#fdf9f4] py-20">
        <div className="mx-auto w-full max-w-[1200px] px-5">
          <div data-animate className="reveal mb-14 text-center">
            <h2 className="font-display text-[32px] text-[#6e4800]">{locale === "fr" ? "Transformation glow" : "The Glow Transformation"}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-[#504537]">
              {locale === "fr"
                ? "Glissez le curseur pour voir la différence avant/après nos séances premium."
                : "Drag the slider to compare before/after results from our premium sessions."}
            </p>
          </div>

          <div data-animate data-anim-delay="1" className="reveal stagger-1">
            <div
              ref={sliderRef}
              className={`before-after-slider relative mx-auto h-[400px] w-full max-w-4xl cursor-ew-resize overflow-hidden rounded-xl shadow-2xl md:h-[600px] ${isSliderDragging ? "is-dragging" : ""}`}
              onPointerDown={onSliderPointerDown}
              onPointerMove={onSliderPointerMove}
              onPointerUp={onSliderPointerUp}
              onPointerCancel={onSliderPointerUp}
              onPointerLeave={() => {
                draggingRef.current = false;
                setIsSliderDragging(false);
              }}
            >
              <Image
                src="/images/instagram_DYZagBHDjZ1__main_image__1.jpg"
                alt="After tan"
                width={1600}
                height={1200}
                className="slider-image pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
              />

              <div
                className="slider-overlay absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
              >
                <Image
                  src="/images/instagram_DX60QplDuar__carousel_1_image__13.jpg"
                  alt="Before tan"
                  width={1600}
                  height={1200}
                  className="slider-image pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
                />
                <div className="absolute bottom-6 left-6 rounded-full border border-white/20 bg-black/40 px-5 py-2 text-xs font-bold uppercase tracking-[0.1em] text-white backdrop-blur-md">
                  {locale === "fr" ? "Avant" : "Before"}
                </div>
              </div>

              <div
                className="slider-divider pointer-events-none absolute bottom-0 top-0 z-10 w-0.5 -translate-x-1/2 bg-white/80"
                style={{ left: `${sliderPos}%` }}
              />

              <div className="slider-button-wrap pointer-events-none absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2" style={{ left: `${sliderPos}%` }}>
                <div className="slider-handle flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#8e5e01] text-white shadow-xl">
                  <span className="text-xl leading-none">↔</span>
                </div>
              </div>

              <div className="absolute bottom-6 right-6 rounded-full border border-white/20 bg-[#6e4800]/85 px-5 py-2 text-xs font-bold uppercase tracking-[0.1em] text-white backdrop-blur-md">
                {locale === "fr" ? "Après" : "After"}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="gallery" className="bg-[#fdf9f4] py-20">
        <div className="mx-auto w-full max-w-[1200px] px-5">
          <div data-animate className="reveal mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-[32px] text-[#6e4800]">{locale === "fr" ? "Résultats réels" : "Real Results"}</h2>
              <p className="mt-2 text-[#504537]">{locale === "fr" ? "Photos authentiques de nos clientes." : "Untouched photos from recent clients."}</p>
            </div>
            <Link href="/gallery" className="hidden border-b-2 border-[#6e4800] pb-1 text-xs font-bold uppercase tracking-[0.1em] text-[#6e4800] md:block">
              {locale === "fr" ? "Voir plus" : "See More"}
            </Link>
          </div>

          <div data-animate data-anim-delay="1" className="gallery-marquee reveal">
            <div className="gallery-track">
              {galleryLoopImages.map((src, index) => (
                <div key={`${src}-${index}`} className="gallery-slide group relative overflow-hidden rounded-2xl shadow-lg">
                  <Image
                    src={src}
                    alt="Client result"
                    width={900}
                    height={1100}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="reviews" className="bg-[#f7f3ee] py-20">
        <div className="mx-auto grid w-full max-w-[1200px] gap-8 px-5 lg:grid-cols-12">
          <div data-animate className="reveal lg:col-span-4">
            <div className="rounded-[40px] border border-[#7a4122]/10 bg-white p-10 text-center shadow-xl">
              <p className="font-display text-6xl text-[#6e4800]">{ratingSummary.average}</p>
              <p className="mt-3 text-sm text-[#504537]">★★★★★</p>
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.1em] text-[#795746]">
                {locale === "fr" ? "Avis vérifiés" : "Verified Client Rating"}
              </p>
              <p className="mt-2 text-sm text-[#504537]">
                {locale === "fr" ? `${ratingSummary.count}+ avis clients` : `${ratingSummary.count}+ client reviews`}
              </p>
            </div>
          </div>

          <div className="space-y-6 lg:col-span-8">
            {topReviews.map((review, index) => (
              <article
                key={review.id}
                data-animate
                data-anim-delay={String(index + 1)}
                className={`reveal rounded-xl bg-white p-8 shadow-sm ${index === 1 ? "stagger-1" : ""}`}
              >
                <p className="mb-6 text-lg italic text-[#504537]">“{locale === "fr" ? review.quote_fr : review.quote_en}”</p>
                <p className="font-semibold text-[#795746]">{review.author_name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.08em] text-[#504537]">{review.source ?? "Client"}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-20">
        <div className="mx-auto w-full max-w-[900px] px-5">
          <div data-animate className="reveal mb-12 text-center">
            <h2 className="font-display text-[32px] text-[#6e4800]">{locale === "fr" ? "Questions fréquentes" : "Common Questions"}</h2>
          </div>

          <div className="space-y-3">
            {faqs.slice(0, 5).map((faq, index) => {
              const open = openFaq === index;
              return (
                <article
                  key={faq.id}
                  data-animate
                  data-anim-delay={String(index + 1)}
                  className={`reveal border-b border-[#d4c4b1] ${index === 1 ? "stagger-1" : index === 2 ? "stagger-2" : ""}`}
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between py-6 text-left"
                    onClick={() => setOpenFaq(open ? null : index)}
                  >
                    <span className="font-display text-2xl text-[#795746]">{locale === "fr" ? faq.question_fr : faq.question_en}</span>
                    <span className={`text-[#795746] transition-transform ${open ? "rotate-180" : ""}`}>⌄</span>
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-60 pb-6" : "max-h-0"}`}>
                    <p className="text-[#504537]">{locale === "fr" ? faq.answer_fr : faq.answer_en}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="contact" className="bg-[#f1ede8] py-20">
        <div className="mx-auto grid w-full max-w-[1200px] gap-14 px-5 lg:grid-cols-2">
          <div data-animate className="reveal">
            <h2 className="font-display text-[32px] text-[#6e4800]">{locale === "fr" ? "Visitez le studio" : "Visit the Studio"}</h2>
            <div className="mt-8 space-y-8">
              <div>
                <p className="font-semibold text-[#795746]">{locale === "fr" ? "Adresse" : "Address"}</p>
                <p className="mt-1 text-[#504537]">{business.address}</p>
              </div>
              <div>
                <p className="font-semibold text-[#795746]">{locale === "fr" ? "Heures" : "Hours"}</p>
                <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-[#504537]">
                  {sortedHours.map((hour) => (
                    <div key={hour.weekday} className="contents">
                      <span>{dayNames[hour.weekday][locale]}</span>
                      <span>
                        {hour.is_open ? `${hour.open_time.slice(0, 5)} - ${hour.close_time.slice(0, 5)}` : locale === "fr" ? "Fermé" : "Closed"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-semibold text-[#795746]">{locale === "fr" ? "Contact" : "Contact"}</p>
                <p className="mt-1 text-[#504537]">{business.email}</p>
                {business.phone ? <p className="text-[#504537]">{business.phone}</p> : null}
                <a href={business.instagram} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[#6e4800] underline">
                  Instagram
                </a>
              </div>
            </div>
          </div>

          <div data-animate data-anim-delay="1" className="reveal stagger-1 overflow-hidden rounded-2xl shadow-lg">
            <Image src="/images/highlight-hours.jpg" alt="Studio" width={900} height={900} className="h-full min-h-[400px] w-full object-cover" />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#7a4122] py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -left-[20%] -top-1/2 h-[200%] w-[100%] rotate-45 bg-white/20 blur-3xl" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-[1200px] px-5 text-center">
          <h2 data-animate className="reveal font-display text-[40px] text-white md:text-[56px]">
            {locale === "fr" ? "Prête pour votre glow?" : "Ready for your glow?"}
          </h2>
          <div data-animate data-anim-delay="1" className="reveal stagger-1 mt-8 flex flex-wrap justify-center gap-5">
            <Link href="/booking" className="rounded-full bg-[#ffddb2] px-12 py-5 text-xs font-bold uppercase tracking-[0.1em] text-[#291800] transition hover:scale-105">
              {locale === "fr" ? "Réserver" : "Book Now"}
            </Link>
            <Link href="/contact" className="rounded-full border border-white/40 px-12 py-5 text-xs font-bold uppercase tracking-[0.1em] text-white transition hover:bg-white hover:text-[#6e4800]">
              {locale === "fr" ? "Nous contacter" : "Contact Us"}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
