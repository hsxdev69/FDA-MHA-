"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ALLOWED_PHOTO_EXTENSIONS,
  COMPLAINT_TYPES,
  MAX_PHOTO_BYTES,
} from "@/lib/constants";
import { useLanguage } from "@/context/language-context";
import { createStoredComplaint } from "@/lib/client-storage";
import { collectImageSignals, resizeDataUrlForVision } from "@/lib/image-signals";
import { heuristicVisionAnalysis, type VisionResult } from "@/lib/vision";
import { detectUserLocation, geoErrorMessage } from "@/lib/geolocation";
import { compressImageFile } from "@/lib/image-compress";
import Spinner from "@/components/ui/spinner";

type GeoState = "idle" | "detecting" | "success" | "error";

const TYPE_TRANSLATIONS: Record<string, { hi: string; mr: string }> = {
  "Expired Food": { hi: "समाप्त तिथि का खाद्य पदार्थ (Expired Food)", mr: "मुदत संपलेले अन्न (Expired Food)" },
  "Adulterated Food": { hi: "मिलावटी खाद्य पदार्थ (Adulterated Food)", mr: "भेसळयुक्त अन्न (Adulterated Food)" },
  "Unsafe Food": { hi: "असुरक्षित/हानिकारक खाद्य पदार्थ (Unsafe Food)", mr: "असुरक्षित अन्न (Unsafe Food)" },
  "Spurious Drug": { hi: "नकली/जाली दवा (Spurious Drug)", mr: "बनावट/खोटी औषधे (Spurious Drug)" },
  "Drug Quality Issue": { hi: "दवा की गुणवत्ता में खराबी (Drug Quality Issue)", mr: "औषधांचा दर्जा व तक्रार (Drug Quality Issue)" },
  "Unlicensed Sale": { hi: "बिना लाइसेंस बिक्री (Unlicensed Sale)", mr: "विनापरवाना विक्री (Unlicensed Sale)" },
  "Misbranded Product": { hi: "भ्रामक लेबल/उत्पाद (Misbranded Product)", mr: "दिशाभूल करणारे लेबल (Misbranded Product)" },
  "Other FDA Violation": { hi: "अन्य एफडीए उल्लंघन (Other FDA Violation)", mr: "इतर एफडीए उल्लंघन (Other FDA Violation)" },
};

export default function ComplaintForm() {
  const router = useRouter();
  const locationRef = useRef<HTMLInputElement>(null);
  const { t, language } = useLanguage();

  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFilename, setPhotoFilename] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [compressing, setCompressing] = useState(false);
  const [geoState, setGeoState] = useState<GeoState>("idle");
  const [geoMessage, setGeoMessage] = useState("");
  const [locationText, setLocationText] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setPhotoPreview(null);
    setPhotoFilename(null);
    setPhotoError("");
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_PHOTO_EXTENSIONS.includes(ext as (typeof ALLOWED_PHOTO_EXTENSIONS)[number])) {
      setPhotoError("Invalid format. Allowed: JPG, JPEG, PNG, WEBP.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("Image is too large. Maximum allowed size is 5 MB.");
      event.target.value = "";
      return;
    }

    // Compress to max 800px @ 0.7 before touching React state / localStorage.
    setCompressing(true);
    compressImageFile(file)
      .then((compressed) => {
        if (!compressed.dataUrl.startsWith("data:image/")) {
          setPhotoError("The selected file could not be read as an image.");
          return;
        }
        setPhotoPreview(compressed.dataUrl);
        setPhotoFilename(file.name);
        setPhotoError("");
      })
      .catch(() => {
        setPhotoError("Could not read the selected file. Please try again.");
      })
      .finally(() => setCompressing(false));
  };

  const detectLocation = async () => {
    setGeoMessage("");
    setGeoState("detecting");
    const outcome = await detectUserLocation();
    if (!outcome.ok) {
      setGeoState("error");
      setGeoMessage(geoErrorMessage(outcome.error));
      return;
    }
    const { lat, lng, address } = outcome.result;
    setCoords({ lat, lng });
    setLocationText(address);
    setGeoState("success");
    setGeoMessage("Location detected successfully.");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors([]);
    const formData = new FormData(event.currentTarget);
    const type = String(formData.get("complaintType") ?? "");
    const description = String(formData.get("description") ?? "").trim();
    const location = String(formData.get("location") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const mobile = String(formData.get("mobile") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();

    const clientErrors: string[] = [];
    if (!COMPLAINT_TYPES.includes(type as (typeof COMPLAINT_TYPES)[number])) {
      clientErrors.push("Please select a complaint type.");
    }
    if (description.length < 10) {
      clientErrors.push("Please provide a detailed description (at least 10 characters).");
    }
    if (!location) {
      clientErrors.push("Please enter the complaint location or use the 'Get My Location' button.");
    }
    if (name.length < 2) {
      clientErrors.push("Please enter your full name.");
    }
    if (!/^\d{10}$/.test(mobile)) {
      clientErrors.push("Mobile number must be exactly 10 digits.");
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      clientErrors.push("Please enter a valid email address.");
    }
    if (photoError) {
      clientErrors.push(photoError);
    }

    if (clientErrors.length > 0) {
      setErrors(clientErrors);
      return;
    }

    setSubmitting(true);

    try {
      // 1. Save directly to localStorage so submission is instant and never fails
      const created = createStoredComplaint({
        complaintType: type,
        description,
        location,
        latitude: coords ? String(coords.lat) : undefined,
        longitude: coords ? String(coords.lng) : undefined,
        name,
        mobile,
        email: email || undefined,
        photoDataUrl: photoPreview,
        photoFilename,
      });

      // 2. Also fire non-blocking sync to backend API (optional best-effort)
      try {
        fetch("/api/complaints", { method: "POST", body: formData }).catch(() => {});
      } catch {
        // Ignore network errors — localStorage record is safely persisted
      }

      router.push(`/success?id=${encodeURIComponent(created.complaintId)}`);
    } catch {
      setErrors(["Failed to save complaint locally. Please try again."]);
      setSubmitting(false);
    }
  };

  const getTranslatedType = (type: string) => {
    if (language === "hi" && TYPE_TRANSLATIONS[type]?.hi) return TYPE_TRANSLATIONS[type].hi;
    if (language === "mr" && TYPE_TRANSLATIONS[type]?.mr) return TYPE_TRANSLATIONS[type].mr;
    return type;
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {errors.length > 0 && (
        <div role="alert" className="notice notice-danger">
          <p className="mb-1 font-semibold text-red-700">Please fix the following:</p>
          <ul className="list-inside list-disc space-y-0.5 text-sm">
            {errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}

      <section className="card p-6">
        <h2 className="mb-5 border-b border-border pb-2 font-heading text-base font-bold text-navy">
          {t.formSection1}
        </h2>
        <div className="grid gap-5">
          <div>
            <label htmlFor="complaintType" className="label">
              {t.complaintTypeLabel} <span className="text-red-600">*</span>
            </label>
            <select id="complaintType" name="complaintType" className="input" defaultValue="" required>
              <option value="" disabled>{t.selectComplaintType}</option>
              {COMPLAINT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {getTranslatedType(type)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="description" className="label">
              {t.descriptionLabel} <span className="text-red-600">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={6}
              required
              placeholder={t.descriptionPlaceholder}
              className="input resize-y"
            />
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="mb-5 border-b border-border pb-2 font-heading text-base font-bold text-navy">
          {t.formSection2}
        </h2>
        <label
          htmlFor="photo"
          className="block cursor-pointer rounded border-2 border-dashed border-border-strong bg-page-warm px-4 py-8 text-center transition hover:border-navy hover:bg-white"
        >
          <span className="mb-2 block text-3xl" aria-hidden="true">📷</span>
          <span className="block text-sm font-medium text-ink-soft">
            {t.uploadClickText}
          </span>
          <input
            id="photo"
            name="photo"
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handlePhotoChange}
          />
        </label>
        {compressing && (
          <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted">
            <Spinner /> Compressing image…
          </p>
        )}
        {photoError && (
          <p className="mt-3 text-sm font-medium text-red-700">{photoError}</p>
        )}
        {photoPreview && (
          <div className="mt-4">
            <img
              src={photoPreview}
              alt="Selected evidence preview"
              className="h-36 w-auto rounded border border-border object-cover shadow-sm"
            />
            <button
              type="button"
              className="mt-2 text-sm font-medium text-red-700 hover:underline"
              onClick={() => {
                setPhotoPreview(null);
                setPhotoFilename(null);
                const input = document.getElementById("photo") as HTMLInputElement | null;
                if (input) input.value = "";
              }}
            >
              Remove photo
            </button>
          </div>
        )}
      </section>

      <section className="card p-6">
        <h2 className="mb-5 border-b border-border pb-2 font-heading text-base font-bold text-navy">
          {t.formSection3} <span className="text-red-600">*</span>
        </h2>
        <div className="grid gap-4">
          <div>
            <label htmlFor="location" className="label">
              {t.locationLabel} <span className="text-red-600">*</span>
            </label>
            <input
              id="location"
              name="location"
              type="text"
              ref={locationRef}
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              required
              placeholder={t.locationPlaceholder}
              className="input"
              autoComplete="street-address"
            />
            <p className="mt-1 text-xs text-muted">
              You can tap Get My Location or type your area / city name yourself.
            </p>
          </div>
          <input type="hidden" name="latitude" value={coords ? String(coords.lat) : ""} />
          <input type="hidden" name="longitude" value={coords ? String(coords.lng) : ""} />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={detectLocation}
              disabled={geoState === "detecting"}
              className="btn-outline"
            >
              {geoState === "detecting" ? (
                <span className="inline-flex items-center gap-2">
                  <span
                    className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-navy border-t-transparent"
                    aria-hidden="true"
                  />
                  Fetching GPS coordinates…
                </span>
              ) : (
                t.getMyLocationBtn
              )}
            </button>
            {geoState === "success" && (
              <span className="text-sm font-medium text-green-700">✓ {geoMessage || t.locationSuccess}</span>
            )}
            {geoState === "error" && (
              <span className="max-w-md text-sm font-medium text-red-700">
                {geoMessage || "Location permission denied. You can manually type your area/city name above."}
              </span>
            )}
            {coords && (
              <a
                href={`https://www.google.com/maps?q=${coords.lat},${coords.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-navy hover:underline"
              >
                {t.viewOnGmaps}
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="mb-5 border-b border-border pb-2 font-heading text-base font-bold text-navy">
          {t.formSection4}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="label">{t.nameLabel} <span className="text-red-600">*</span></label>
            <input id="name" name="name" type="text" required placeholder="Your full name" className="input" />
          </div>
          <div>
            <label htmlFor="mobile" className="label">{t.mobileLabel} <span className="text-red-600">*</span></label>
            <input id="mobile" name="mobile" type="tel" inputMode="numeric" required maxLength={10} pattern="[0-9]{10}" placeholder="10-digit mobile number" className="input font-mono" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="email" className="label">{t.emailLabel} <span className="font-normal text-muted">(optional)</span></label>
            <input id="email" name="email" type="email" placeholder="you@example.com" className="input" />
          </div>
        </div>
      </section>

      <div className="notice">
        <p className="text-sm leading-relaxed">
          {t.declarationText}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="submit" disabled={submitting} className="btn-saffron !py-3 !px-8 !text-base sm:flex-1">
          {submitting ? "Analyzing evidence…" : t.submitComplaintBtn}
        </button>
        <Link href="/" className="btn-outline !py-3 sm:flex-1 text-center">
          {t.cancelBtn}
        </Link>
      </div>
    </form>
  );
}
