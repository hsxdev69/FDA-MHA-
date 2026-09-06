"use client";

import { useLanguage } from "@/context/language-context";

export default function InformationPage() {
  const { t, language } = useLanguage();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 border-l-4 border-saffron pl-4">
        <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">
          {t.fdaContact}
        </p>
        <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-navy">
          {language === "mr"
            ? "एफडीए अधिकृत संपर्क माहिती"
            : language === "hi"
            ? "एफडीए आधिकारिक संपर्क विवरण"
            : "FDA Contact Information"}
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          {language === "mr"
            ? "अन्न व औषध प्रशासन, महाराष्ट्र शासनाचा अधिकृत संपर्क पत्ता, दूरध्वनी व संकेतस्थळ."
            : language === "hi"
            ? "खाद्य एवं औषधि प्रशासन, महाराष्ट्र का सार्वजनिक रूप से उपलब्ध आधिकारिक संपर्क विवरण।"
            : "The following is the publicly available contact information of the Food and Drug Administration, Maharashtra."}
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b-2 border-saffron bg-page-warm px-6 py-4">
          <p className="font-heading text-lg font-bold text-navy">
            {t.deptName}
          </p>
          <p className="text-xs text-muted">
            {language === "mr"
              ? "अधिकृत शासकीय संपर्क"
              : language === "hi"
              ? "आधिकारिक सरकारी संपर्क"
              : "Official Agency Contact"}
          </p>
        </div>

        <div className="space-y-5 p-6 sm:p-7">
          <div>
            <p className="label">
              {language === "mr" ? "कार्यालयाचा पत्ता" : language === "hi" ? "कार्यालय का पता" : "Office Address"}
            </p>
            <p className="text-sm leading-relaxed text-ink-soft">
              Food and Drug Administration, Maharashtra
              <br />
              Survey No. 341, 2nd Floor,
              <br />
              Bandra Kurla Complex,
              <br />
              Opposite Reserve Bank of India,
              <br />
              Bandra East, Mumbai - 400051
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="label">
                {language === "mr" ? "दूरध्वनी क्रमांक" : language === "hi" ? "फोन नंबर" : "Phone Number"}
              </p>
              <a href="tel:02226122652" className="text-sm font-semibold text-navy hover:underline">
                022-26122652
              </a>
            </div>
            <div>
              <p className="label">
                {language === "mr" ? "ईमेल पत्ता" : language === "hi" ? "ईमेल आईडी" : "Email Address"}
              </p>
              <a href="mailto:comm.fda-mah@nic.in" className="text-sm font-semibold text-navy hover:underline">
                comm.fda-mah@nic.in
              </a>
            </div>
          </div>

          <div>
            <p className="label">
              {language === "mr" ? "अधिकृत संकेतस्थळ" : language === "hi" ? "आधिकारिक वेबसाइट" : "Official Website"}
            </p>
            <a
              href="https://fda.maharashtra.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-saffron"
            >
              Visit fda.maharashtra.gov.in ↗
            </a>
          </div>

          <div className="notice notice-info">
            <p className="text-sm">
              {language === "mr"
                ? "सदर माहिती नागरिकांच्या सोयीसाठी उपलब्ध करून दिली आहे. हे पोर्टल कोणताही टोल-फ्री क्रमांक प्रसिद्ध करत नाही."
                : language === "hi"
                ? "उपरोक्त विवरण केवल सूचना के लिए प्रदान किया गया है। यह पोर्टल कोई टोल-फ्री हेल्पलाइन प्रकाशित नहीं करता है।"
                : "The details above are provided for information only. This portal does not invent or publish any toll-free helpline number."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
