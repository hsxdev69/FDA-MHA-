"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/language-context";

export default function HomePage() {
  const { t } = useLanguage();

  const services = [
    {
      emoji: "📝",
      title: t.service1Title,
      description: t.service1Desc,
      href: "/complaint",
      cta: t.service1Cta,
    },
    {
      emoji: "📷",
      title: t.service2Title,
      description: t.service2Desc,
      href: "/complaint",
      cta: t.service2Cta,
    },
    {
      emoji: "📍",
      title: t.service3Title,
      description: t.service3Desc,
      href: "/complaint",
      cta: t.service3Cta,
    },
    {
      emoji: "🔍",
      title: t.service4Title,
      description: t.service4Desc,
      href: "/my-complaints",
      cta: t.service4Cta,
    },
    {
      emoji: "☎️",
      title: t.service5Title,
      description: t.service5Desc,
      href: "/information",
      cta: t.service5Cta,
    },
  ];

  const steps = [
    { number: "1", title: t.step1Title, description: t.step1Desc },
    { number: "2", title: t.step2Title, description: t.step2Desc },
    { number: "3", title: t.step3Title, description: t.step3Desc },
    { number: "4", title: t.step4Title, description: t.step4Desc },
  ];

  return (
    <>
      {/* Hero banner */}
      <section className="relative border-b border-border bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-5 lg:px-8">
          <div className="lg:col-span-3">
            <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.3em] text-saffron-deep">
              {t.grievanceRedressal}
            </p>
            <h1 className="mt-3 font-heading text-3xl font-bold leading-tight text-navy sm:text-4xl lg:text-5xl">
              {t.heroTitle}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">
              {t.heroSubtitle}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/complaint" className="btn-saffron !py-3 !px-6 !text-base">
                {t.heroFileBtn}
              </Link>
              <Link href="/my-complaints" className="btn-outline !py-3 !px-6 !text-base">
                {t.heroTrackBtn}
              </Link>
            </div>
            <div className="mt-6 notice notice-info">
              <p className="text-sm">
                <strong className="text-navy">Note:</strong> {t.verificationNotice}
              </p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="relative overflow-hidden rounded-md border border-border bg-white p-2 shadow-sm">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded">
                <Image
                  src="/images/hero.jpg"
                  alt="Food and drug safety illustration"
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 480px"
                />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: t.activeCasesLabel, value: t.activeCases247 },
                { label: t.responseLabel, value: t.responseTime },
                { label: t.officersLabel, value: t.verifiedOfficers },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded border border-border bg-page-warm p-3 text-center"
                >
                  <p className="font-heading text-lg font-bold text-navy">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="border-l-4 border-saffron pl-4">
          <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">
            Services
          </p>
          <h2 className="mt-1 font-heading text-2xl font-bold tracking-tight text-navy sm:text-3xl">
            {t.servicesHeading}
          </h2>
          <p className="mt-2 text-sm text-ink-soft">
            {t.servicesSubtitle}
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.title}
              className="card flex flex-col p-5 transition hover:border-navy hover:shadow-md"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded border border-border bg-page-warm text-2xl">
                  {service.emoji}
                </span>
                <h3 className="font-heading text-base font-semibold text-navy">
                  {service.title}
                </h3>
              </div>
              <p className="flex-1 text-sm leading-relaxed text-ink-soft">
                {service.description}
              </p>
              <Link
                href={service.href}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-navy hover:text-saffron-deep"
              >
                {service.cta} →
              </Link>
            </div>
          ))}

          {/* Notice card */}
          <div className="card border-l-4 border-l-saffron p-5">
            <p className="font-heading text-base font-semibold text-navy">
              ⚠️ {t.importantNoticeTitle}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              {t.importantNoticeDesc}
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="border-l-4 border-saffron pl-4">
            <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">
              {t.processEyebrow}
            </p>
            <h2 className="mt-1 font-heading text-2xl font-bold tracking-tight text-navy sm:text-3xl">
              {t.processTitle}
            </h2>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.number} className="relative">
                <div className="card p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy font-heading text-base font-bold text-white">
                    {step.number}
                  </span>
                  <h3 className="mt-3 font-heading text-base font-semibold text-navy">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-ink-soft">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded border border-saffron-deep bg-saffron/10 p-8 sm:p-10">
          <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <h2 className="font-heading text-2xl font-bold text-navy sm:text-3xl">
                {t.ctaTitle}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
                {t.ctaSubtitle}
              </p>
            </div>
            <Link href="/complaint" className="btn-primary !px-6 !py-3 !text-base">
              {t.ctaBtn}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
