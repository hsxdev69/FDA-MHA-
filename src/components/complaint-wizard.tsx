"use client";

import { memo, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { COMPLAINT_TYPES, MAX_PHOTO_BYTES } from "@/lib/constants";
import { createStoredComplaint } from "@/lib/client-storage";
import { collectImageSignals, resizeDataUrlForVision } from "@/lib/image-signals";
import { heuristicVisionAnalysis, type VisionResult } from "@/lib/vision";
import { detectUserLocation, geoErrorMessage } from "@/lib/geolocation";
import { MAHARASHTRA_DISTRICTS, districtCoords } from "@/lib/maharashtra-districts";
import { FraudRiskBadge, PriorityBadge } from "@/components/badges";
import { compressImageFile } from "@/lib/image-compress";
import { useDebouncedValue } from "@/lib/use-debounced";
import Spinner from "@/components/ui/spinner";

const CATEGORIES = [
  { id: "food-safety", label: "Food Safety", emoji: "🥗", type: "Unsafe Food" },
  { id: "adulteration", label: "Adulteration", emoji: "🧪", type: "Adulterated Food" },
  { id: "expired", label: "Expired Food", emoji: "📆", type: "Expired Food" },
  { id: "drug-quality", label: "Drug Quality", emoji: "💊", type: "Drug Quality Issue" },
  { id: "illegal-sale", label: "Illegal Drug Sale", emoji: "🚫", type: "Unlicensed Sale" },
  { id: "cosmetic", label: "Cosmetic", emoji: "🧴", type: "Misbranded Product" },
  { id: "device", label: "Medical Device", emoji: "🩺", type: "Other FDA Violation" },
] as const;

/**
 * Per-category field configuration. Each entry declares which Step 2 fields
 * to show/require/hide and provides a label override for the primary product name.
 */
interface FieldConfig {
  /** Label for the "product" name field.  null = hide the field entirely. */
  productLabel: string | null;
  /** Placeholder hint for the product name field. */
  productHint?: string;
  /** Label for the establishment / vendor field. */
  establishmentLabel: string;
  establishmentHint: string;
  /** Whether to show batch number. */
  showBatch: boolean;
  /** Whether to show manufacturing date. */
  showMfgDate: boolean;
  /** Whether to show expiry date, and whether it is mandatory. */
  showExpiry: boolean;
  expiryMandatory?: boolean;
  /** Extra category-specific field rendered below the standard ones. null = none. */
  extraLabel: string | null;
  extraPlaceholder?: string;
  extraHint?: string;
  /** Step-2 validation: which state key must be non-empty to proceed. */
  requiredFields: ("productName" | "establishmentName" | "expiryDate")[];
}

const FIELD_CONFIGS: Record<string, FieldConfig> = {
  adulteration: {
    productLabel: "Product / Item Name *",
    productHint: "e.g. Milk, Ghee, Cooking Oil, Sweets",
    establishmentLabel: "Shop / Dairy / Establishment Name *",
    establishmentHint: "e.g. Krishna Dairy, Shinde Sweets",
    showBatch: false,
    showMfgDate: false,
    showExpiry: false,
    extraLabel: "Suspected Adulterant",
    extraPlaceholder: "e.g. Water, Urea, Starch, Chemical, Artificial Colour",
    extraHint: "Describe what you suspect was added to the product.",
    requiredFields: ["productName", "establishmentName"],
  },
  "food-safety": {
    productLabel: "Food Item *",
    productHint: "e.g. Pani Puri, Biryani, Milk Tea",
    establishmentLabel: "Restaurant / Vendor / Hotel Name *",
    establishmentHint: "e.g. Sai Hotel, Street stall near Bus Stand",
    showBatch: false,
    showMfgDate: false,
    showExpiry: false,
    extraLabel: "Symptoms / Issue Observed",
    extraPlaceholder: "e.g. Insects found, Bad smell, Food poisoning, Vomiting",
    extraHint: "Describe what you noticed or experienced.",
    requiredFields: ["productName", "establishmentName"],
  },
  expired: {
    productLabel: "Product Name *",
    productHint: "e.g. Parle-G Biscuits, Amul Milk 1L",
    establishmentLabel: "Shop Name *",
    establishmentHint: "e.g. More Supermarket, D-Mart",
    showBatch: true,
    showMfgDate: true,
    showExpiry: true,
    expiryMandatory: true,
    extraLabel: "Purchase Date",
    extraPlaceholder: "",
    extraHint: "When did you buy this item?",
    requiredFields: ["productName", "establishmentName", "expiryDate"],
  },
  "drug-quality": {
    productLabel: "Medicine / Brand Name *",
    productHint: "e.g. Crocin 500mg, Azithromycin",
    establishmentLabel: "Pharmacy / Medical Store Name *",
    establishmentHint: "e.g. Apollo Pharmacy, Shinde Medical",
    showBatch: true,
    showMfgDate: true,
    showExpiry: true,
    expiryMandatory: false,
    extraLabel: "Generic / Salt Name",
    extraPlaceholder: "e.g. Paracetamol, Amoxicillin",
    extraHint: "Generic name printed on the medicine strip or bottle (optional).",
    requiredFields: ["productName", "establishmentName"],
  },
  "illegal-sale": {
    productLabel: "Type of Drug / Substance",
    productHint: "e.g. Psychotropic tablets, Cough syrup sold illegally",
    establishmentLabel: "Store / Vendor / Premises *",
    establishmentHint: "e.g. Shyam Medical, Near bus stop, XYZ Chemist",
    showBatch: false,
    showMfgDate: false,
    showExpiry: false,
    extraLabel: "Observation Date",
    extraPlaceholder: "",
    extraHint: "When did you observe the illegal sale?",
    requiredFields: ["establishmentName"],
  },
  cosmetic: {
    productLabel: "Cosmetic / Product Name *",
    productHint: "e.g. Fairness Cream, Lipstick, Shampoo",
    establishmentLabel: "Purchase Store / Website *",
    establishmentHint: "e.g. Nykaa, Beauty World Shop",
    showBatch: true,
    showMfgDate: false,
    showExpiry: true,
    expiryMandatory: false,
    extraLabel: "Brand Name",
    extraPlaceholder: "e.g. Ponds, Lakme, Himalaya",
    extraHint: "Brand printed on the packaging.",
    requiredFields: ["productName", "establishmentName"],
  },
  device: {
    productLabel: "Device Name *",
    productHint: "e.g. Blood Glucose Monitor, Pulse Oximeter, Surgical Kit",
    establishmentLabel: "Purchase / Hospital / Clinic Name *",
    establishmentHint: "e.g. Dhanwantari Hospital, MedEquip Store",
    showBatch: true,
    showMfgDate: true,
    showExpiry: false,
    extraLabel: "Manufacturer / Model",
    extraPlaceholder: "e.g. Accu-Chek, Contour Plus — Model XYZ",
    extraHint: "As printed on the device label.",
    requiredFields: ["productName", "establishmentName"],
  },
};

function getFieldConfig(categoryId: string): FieldConfig {
  return (
    FIELD_CONFIGS[categoryId] ?? {
      productLabel: "Product / Brand Name",
      productHint: "",
      establishmentLabel: "Shop / Establishment Name *",
      establishmentHint: "",
      showBatch: true,
      showMfgDate: true,
      showExpiry: true,
      expiryMandatory: false,
      extraLabel: null,
      requiredFields: ["establishmentName"],
    }
  );
}

type EvidenceFile = { name: string; mime: string; size: number; dataUrl: string };

/**
 * Submission-blocking rule: the wizard refuses to file a complaint when the
 * AI evidence check flags it as fake / irrelevant / high fraud risk.
 */
function isHighFraud(v: VisionResult | null): boolean {
  if (!v) return false;
  if (v.isLikelyFake) return true;
  if (v.fraudRisk === "HIGH") return true;
  if (typeof v.authenticityScore === "number" && v.authenticityScore < 30) return true;
  return false;
}

/** Memoised thumbnail tile — avoids re-decoding Base64 on every keystroke. */
const EvidenceTile = memo(function EvidenceTile({
  file,
  index,
  onRemove,
}: {
  file: EvidenceFile;
  index: number;
  onRemove: (i: number) => void;
}) {
  return (
    <li className="rounded border border-border p-2 text-xs">
      {file.mime.startsWith("image/") ? (
        <img
          src={file.dataUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="mb-2 h-24 w-full rounded object-cover"
        />
      ) : (
        <p className="mb-2 font-mono">PDF</p>
      )}
      <p className="truncate font-semibold">{file.name}</p>
      <p className="text-muted">{(file.size / 1024).toFixed(0)} KB</p>
      <button
        type="button"
        className="mt-1 text-red-700 hover:underline"
        onClick={() => onRemove(index)}
      >
        Remove
      </button>
    </li>
  );
});

export default function ComplaintWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [categoryId, setCategoryId] = useState<string>("");
  const [complaintType, setComplaintType] = useState<string>("");
  const [description, setDescription] = useState("");

  /** Dynamic Step-2 fields. */
  const [productName, setProductName] = useState("");
  const [brandName, setBrandName] = useState("");   // kept for brand-extra field (cosmetic)
  const [batchNumber, setBatchNumber] = useState("");
  const [mfgDate, setMfgDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [establishmentName, setEstablishmentName] = useState("");
  /** Generic extra field — its semantics depend on the selected category. */
  const [extraField, setExtraField] = useState("");

  /**
   * When the citizen switches categories, clear field values that are hidden
   * for the new category so stale data is never submitted.
   */
  const clearHiddenFields = useCallback((newCategoryId: string) => {
    const cfg = getFieldConfig(newCategoryId);
    if (!cfg.showBatch) setBatchNumber("");
    if (!cfg.showMfgDate) setMfgDate("");
    if (!cfg.showExpiry) setExpiryDate("");
    if (cfg.productLabel === null) setProductName("");
    setExtraField("");   // extra field is always category-specific
    setVision(null);     // invalidate any previous AI analysis
    setErrors([]);
  }, []);

  const [address, setAddress] = useState("");
  const [taluka, setTaluka] = useState("");
  const [district, setDistrict] = useState("Pune");
  const [geoState, setGeoState] = useState<"idle" | "detecting" | "success" | "error">("idle");
  const [geoMessage, setGeoMessage] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [files, setFiles] = useState<EvidenceFile[]>([]);
  const [fileError, setFileError] = useState("");
  const [compressing, setCompressing] = useState(false);

  const [vision, setVision] = useState<VisionResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [fraudToast, setFraudToast] = useState<string | null>(null);

  /** True while the AI has flagged the uploaded evidence as fake / irrelevant. */
  const blockedByFraud = useMemo(() => isHighFraud(vision), [vision]);

  const showFraudToast = useCallback((msg: string) => {
    setFraudToast(msg);
    window.setTimeout(() => setFraudToast(null), 5000);
  }, []);

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");

  const category = useMemo(
    () => CATEGORIES.find((c) => c.id === categoryId),
    [categoryId],
  );
  const fieldConfig = useMemo(() => getFieldConfig(categoryId), [categoryId]);
  const pin = useMemo(() => {
    if (coords) return coords;
    return districtCoords(district);
  }, [coords, district]);

  /* Debounced so the map iframe does not reload on every keystroke. */
  const debouncedPin = useDebouncedValue(pin, 300);
  const osmEmbed = useMemo(
    () =>
      `https://www.openstreetmap.org/export/embed.html?bbox=${debouncedPin.lng - 0.08}%2C${debouncedPin.lat - 0.06}%2C${debouncedPin.lng + 0.08}%2C${debouncedPin.lat + 0.06}&layer=mapnik&marker=${debouncedPin.lat}%2C${debouncedPin.lng}`,
    [debouncedPin],
  );

  const goNext = () => {
    setErrors([]);
    if (step === 1 && (!categoryId || description.trim().length < 10)) {
      setErrors(["Select a category and enter a description of at least 10 characters."]);
      return;
    }
    if (step === 2) {
      const errs: string[] = [];
      const req = fieldConfig.requiredFields;
      if (req.includes("productName") && !productName.trim()) {
        errs.push(
          `Please enter the ${
            fieldConfig.productLabel?.replace(/\s*\*/g, "").trim() ?? "product name"
          }.`,
        );
      }
      if (req.includes("establishmentName") && !establishmentName.trim()) {
        errs.push(
          `Please enter the ${
            fieldConfig.establishmentLabel?.replace(/\s*\*/g, "").trim() ??
            "establishment name"
          }.`,
        );
      }
      if (req.includes("expiryDate") && fieldConfig.expiryMandatory && !expiryDate.trim()) {
        errs.push("Expiry date is required for expired food complaints.");
      }
      if (errs.length) { setErrors(errs); return; }
    }
    if (step === 3 && !address.trim() && !coords) {
      setErrors(["Enter an address or use current location."]);
      return;
    }
    if (step === 4 && name.trim().length < 2) {
      setErrors(["Please enter your full name before review."]);
      return;
    }
    if (step === 4 && !/^\d{10}$/.test(mobile)) {
      setErrors(["Mobile number must be exactly 10 digits."]);
      return;
    }
    if (step === 4) {
      void runAnalysis().then(() => setStep(5));
      return;
    }
    setStep((s) => Math.min(5, s + 1));
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    const type = complaintType || category?.type || "Other FDA Violation";
    // Analyze the most recently uploaded image so a re-upload in Step 4
    // replaces the previously flagged evidence.
    const photo = [...files].reverse().find((f) => f.mime.startsWith("image/"));
    try {
      const signals = photo
        ? await collectImageSignals(photo.dataUrl, photo.name)
        : null;
      let imageBase64 = "";
      let mime = "image/jpeg";
      if (photo) {
        const resized = await resizeDataUrlForVision(photo.dataUrl);
        imageBase64 = resized.base64;
        mime = resized.mime;
      }
      const visRes = await fetch("/api/analyze-evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: establishmentName
            ? `${category?.label ?? type} at ${establishmentName}`
            : category?.label ?? type,
          category: category?.label ?? type,
          complaintType: type,
          description,
          hasImage: Boolean(photo),
          imageBase64,
          mime,
          signals,
        }),
      });
      const visJson = await visRes.json().catch(() => null);
      setVision(
        visJson?.analysis ??
          heuristicVisionAnalysis(type, description, signals, Boolean(photo)),
      );
    } catch {
      setVision(heuristicVisionAnalysis(type, description, null, files.length > 0));
    } finally {
      setAnalyzing(false);
    }
  };

  const detectGps = async () => {
    setGeoMessage("");
    setGeoState("detecting");
    const outcome = await detectUserLocation();
    if (!outcome.ok) {
      setGeoState("error");
      setGeoMessage(geoErrorMessage(outcome.error));
      return;
    }
    setCoords({ lat: outcome.result.lat, lng: outcome.result.lng });
    setAddress(outcome.result.address);
    setGeoState("success");
    setGeoMessage("Location detected successfully.");
  };

  const addFiles = useCallback(async (list: FileList | null) => {
    if (!list) return;
    setFileError("");
    setCompressing(true);
    const accepted: EvidenceFile[] = [];
    try {
      for (const file of Array.from(list)) {
        if (file.size > MAX_PHOTO_BYTES) {
          setFileError(`${file.name} exceeds 5 MB.`);
          continue;
        }
        const ok =
          file.type.startsWith("image/") ||
          file.type === "application/pdf" ||
          /\.(jpg|jpeg|png|webp|pdf)$/i.test(file.name);
        if (!ok) {
          setFileError("Allowed: JPG, PNG, WEBP, PDF.");
          continue;
        }
        // Compress to max 800px @ 0.7 BEFORE it enters React state.
        const compressed = await compressImageFile(file);
        accepted.push({
          name: file.name,
          mime: compressed.mime,
          size: compressed.bytes,
          dataUrl: compressed.dataUrl,
        });
      }
      if (accepted.length) setFiles((prev) => [...prev, ...accepted]);
    } finally {
      setCompressing(false);
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const submit = useCallback(async () => {
    if (submitting || analyzing) return; // block double-submit
    setErrors([]);

    // STRICT GUARD — never persist a complaint whose evidence the AI flagged
    // as fake / irrelevant / high fraud risk.
    if (isHighFraud(vision)) {
      showFraudToast("Cannot submit: Invalid evidence uploaded.");
      return;
    }

    setSubmitting(true);
    try {
      const type =
        complaintType && (COMPLAINT_TYPES as readonly string[]).includes(complaintType)
          ? complaintType
          : category?.type || "Other FDA Violation";
      const firstImage = files.find((f) => f.mime.startsWith("image/"));
      const created = createStoredComplaint({
        complaintType: type,
        description,
        location: [address, taluka, district].filter(Boolean).join(", "),
        latitude: coords ? String(coords.lat) : String(pin.lat),
        longitude: coords ? String(coords.lng) : String(pin.lng),
        name,
        mobile,
        email: email || undefined,
        photoDataUrl: firstImage?.dataUrl,
        photoFilename: firstImage?.name,
        vision,
        category: category?.label || type,
        brandName: productName || brandName,
        batchNumber: fieldConfig.showBatch ? batchNumber : "",
        mfgDate: fieldConfig.showMfgDate ? mfgDate : "",
        expiryDate: fieldConfig.showExpiry ? expiryDate : "",
        establishmentName,
        taluka,
        district,
        evidenceFiles: files,
      });
      router.push(`/success?id=${encodeURIComponent(created.complaintId)}`);
    } catch {
      setErrors(["Could not save complaint. Please try again."]);
      setSubmitting(false);
    }
  }, [
    submitting,
    complaintType,
    category,
    files,
    description,
    address,
    taluka,
    district,
    coords,
    pin,
    name,
    mobile,
    email,
    vision,
    productName,
    brandName,
    batchNumber,
    mfgDate,
    expiryDate,
    establishmentName,
    fieldConfig,
    router,
    analyzing,
    showFraudToast,
  ]);

  const steps = ["Category", "Product", "Location", "Evidence", "Review"];

  return (
    <div className="space-y-6">
      <ol className="grid grid-cols-5 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide">
        {steps.map((label, i) => (
          <li
            key={label}
            className={`rounded border px-1 py-2 ${
              step === i + 1
                ? "border-navy bg-navy text-white"
                : step > i + 1
                  ? "border-green-600 bg-green-50 text-green-800"
                  : "border-border bg-white text-muted"
            }`}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {errors.length > 0 && (
        <div className="notice notice-danger">
          {errors.map((e) => (
            <p key={e}>{e}</p>
          ))}
        </div>
      )}

      {step === 1 && (
        <section className="card p-6 space-y-4">
          <h2 className="font-heading text-base font-bold text-navy">Step 1 · Select category</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  if (c.id !== categoryId) clearHiddenFields(c.id);
                  setCategoryId(c.id);
                  setComplaintType(c.type);
                }}
                className={`rounded border p-4 text-left transition ${
                  categoryId === c.id
                    ? "border-navy bg-navy/5 ring-2 ring-saffron"
                    : "border-border bg-white hover:border-navy"
                }`}
              >
                <span className="text-2xl">{c.emoji}</span>
                <p className="mt-2 font-heading font-semibold text-navy">{c.label}</p>
                <p className="text-xs text-muted">{c.type}</p>
              </button>
            ))}
          </div>
          <label className="label">What happened?</label>
          <textarea
            className="input min-h-28"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the product, shop and suspected violation…"
          />
        </section>
      )}

      {step === 2 && (
        <section className="card p-6">
          <h2 className="font-heading text-base font-bold text-navy mb-5">
            Step 2 · Product &amp; Establishment Details
          </h2>

          {/* Category badge so the citizen can see which category is active. */}
          <div className="mb-5 inline-flex items-center gap-2 rounded border border-navy/20 bg-navy/5 px-3 py-1.5 text-sm font-semibold text-navy">
            {category?.emoji} {category?.label}
            <button
              type="button"
              className="ml-2 text-xs text-muted underline hover:text-navy"
              onClick={() => setStep(1)}
            >
              Change
            </button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Product / item name — label changes per category; hidden when null */}
            {fieldConfig.productLabel !== null && (
              <div className="sm:col-span-2">
                <label className="label" htmlFor="step2-product">
                  {fieldConfig.productLabel}
                </label>
                <input
                  id="step2-product"
                  className="input"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder={fieldConfig.productHint ?? ""}
                />
              </div>
            )}

            {/* Batch / Lot number — hidden for loose/unpackaged items */}
            {fieldConfig.showBatch && (
              <div>
                <label className="label" htmlFor="step2-batch">
                  Batch / Lot Number
                </label>
                <input
                  id="step2-batch"
                  className="input font-mono"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="e.g. B2024-09-K"
                />
              </div>
            )}

            {/* Manufacturing date — hidden for street food, adulteration, illegal sale */}
            {fieldConfig.showMfgDate && (
              <div>
                <label className="label" htmlFor="step2-mfg">
                  Manufacturing Date
                </label>
                <input
                  id="step2-mfg"
                  type="date"
                  className="input"
                  value={mfgDate}
                  onChange={(e) => setMfgDate(e.target.value)}
                />
              </div>
            )}

            {/* Expiry date — hidden for loose/unpackaged items */}
            {fieldConfig.showExpiry && (
              <div>
                <label className="label" htmlFor="step2-expiry">
                  {fieldConfig.expiryMandatory
                    ? "Expiry Date *"
                    : "Expiry / Use-Before Date"}
                </label>
                <input
                  id="step2-expiry"
                  type="date"
                  className="input"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
                {fieldConfig.expiryMandatory && (
                  <p className="mt-1 text-xs text-red-700">
                    Required for expired food complaints.
                  </p>
                )}
              </div>
            )}

            {/* Establishment name — always shown, label changes per category */}
            <div className="sm:col-span-2">
              <label className="label" htmlFor="step2-estab">
                {fieldConfig.establishmentLabel}
              </label>
              <input
                id="step2-estab"
                className="input"
                value={establishmentName}
                onChange={(e) => setEstablishmentName(e.target.value)}
                placeholder={fieldConfig.establishmentHint}
              />
            </div>

            {/* Category-specific extra field */}
            {fieldConfig.extraLabel && (
              <div className="sm:col-span-2">
                <label className="label" htmlFor="step2-extra">
                  {fieldConfig.extraLabel}
                </label>
                {fieldConfig.extraLabel.toLowerCase().includes("date") ? (
                  <input
                    id="step2-extra"
                    type="date"
                    className="input"
                    value={extraField}
                    onChange={(e) => setExtraField(e.target.value)}
                  />
                ) : (
                  <input
                    id="step2-extra"
                    className="input"
                    value={extraField}
                    onChange={(e) => setExtraField(e.target.value)}
                    placeholder={fieldConfig.extraPlaceholder ?? ""}
                  />
                )}
                {fieldConfig.extraHint && (
                  <p className="mt-1 text-xs text-muted">{fieldConfig.extraHint}</p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="card p-6 space-y-4">
          <h2 className="font-heading text-base font-bold text-navy">Step 3 · Location</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Address</label>
              <input
                className="input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Area, street, landmark"
              />
            </div>
            <div>
              <label className="label">Taluka</label>
              <input className="input" value={taluka} onChange={(e) => setTaluka(e.target.value)} />
            </div>
            <div>
              <label className="label">District</label>
              <select className="input" value={district} onChange={(e) => setDistrict(e.target.value)}>
                {MAHARASHTRA_DISTRICTS.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="button"
            className="btn-outline active:scale-[0.99] disabled:opacity-70"
            onClick={() => void detectGps()}
            disabled={geoState === "detecting"}
          >
            {geoState === "detecting" ? (
              <span className="inline-flex items-center gap-2">
                <Spinner /> Fetching GPS coordinates…
              </span>
            ) : (
              "📍 Use current location"
            )}
          </button>
          {geoState === "success" && <p className="text-sm text-green-700">✓ {geoMessage}</p>}
          {geoState === "error" && <p className="text-sm text-red-700">{geoMessage}</p>}
          <iframe
            title="Location map"
            src={osmEmbed}
            className="h-56 w-full rounded border border-border"
          />
        </section>
      )}

      {step === 4 && (
        <section className="card p-6 space-y-4">
          <h2 className="font-heading text-base font-bold text-navy">Step 4 · Evidence & your details</h2>
          <label className="block cursor-pointer rounded border-2 border-dashed border-border-strong bg-page-warm px-4 py-8 text-center">
            <span className="text-sm font-medium text-ink-soft">
              Upload photos or PDFs (max 5 MB each)
            </span>
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.pdf,image/*,application/pdf"
              className="sr-only"
              onChange={(e) => void addFiles(e.target.files)}
            />
          </label>
          {compressing && (
            <p className="inline-flex items-center gap-2 text-sm text-muted">
              <Spinner /> Compressing images…
            </p>
          )}
          {fileError && <p className="text-sm text-red-700">{fileError}</p>}
          <ul className="grid gap-3 sm:grid-cols-3">
            {files.map((f, i) => (
              <EvidenceTile key={`${f.name}-${i}`} file={f} index={i} onRemove={removeFile} />
            ))}
          </ul>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Your full name *</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="label">Mobile (10 digits) *</label>
              <input className="input font-mono" value={mobile} maxLength={10} onChange={(e) => setMobile(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Email ID (optional)</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@gmail.com"
                autoComplete="email"
              />
              <p className="mt-1 text-xs text-muted">
                Optional. We will use this to email you updates regarding your complaint.
              </p>
            </div>
          </div>
        </section>
      )}

      {step === 5 && (
        <section className="card p-6 space-y-4">
          <h2 className="font-heading text-base font-bold text-navy">Step 5 · Review & AI analysis</h2>

          {fraudToast && (
            <div role="alert" className="rounded border border-red-600 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
              ⚠️ {fraudToast}
            </div>
          )}

          {analyzing && <p className="text-sm text-muted">Analyzing evidence…</p>}
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-wider text-muted">Category</dt>
              <dd className="font-semibold">{category?.emoji} {category?.label}</dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-wider text-muted">
                {fieldConfig.establishmentLabel.replace(/\s*\*/g, "")}
              </dt>
              <dd className="font-semibold">{establishmentName || "—"}</dd>
            </div>
            {fieldConfig.productLabel !== null && productName && (
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-wider text-muted">
                  {fieldConfig.productLabel.replace(/\s*\*/g, "")}
                </dt>
                <dd className="font-semibold">{productName}</dd>
              </div>
            )}
            {fieldConfig.showBatch && batchNumber && (
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-wider text-muted">Batch No.</dt>
                <dd className="font-mono font-semibold">{batchNumber}</dd>
              </div>
            )}
            {fieldConfig.showExpiry && expiryDate && (
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-wider text-muted">Expiry Date</dt>
                <dd className="font-semibold text-red-700">{expiryDate}</dd>
              </div>
            )}
            {fieldConfig.showMfgDate && mfgDate && (
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-wider text-muted">Mfg. Date</dt>
                <dd className="font-semibold">{mfgDate}</dd>
              </div>
            )}
            {fieldConfig.extraLabel && extraField && (
              <div className="sm:col-span-2">
                <dt className="font-mono text-[11px] uppercase tracking-wider text-muted">
                  {fieldConfig.extraLabel}
                </dt>
                <dd className="font-semibold">{extraField}</dd>
              </div>
            )}
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-wider text-muted">District</dt>
              <dd className="font-semibold">{district}</dd>
            </div>
          </dl>
          <p className="text-sm text-ink-soft">{description}</p>

          {/* ── AI EVIDENCE CHECK RESULT (citizen-facing, no debug text) ── */}
          {analyzing && (
            <div className="flex items-center gap-3 rounded border border-border bg-page-warm px-4 py-3 text-sm text-muted">
              <Spinner /> Verifying your evidence with AI…
            </div>
          )}

          {!analyzing && vision && !blockedByFraud && (
            <div
              role="status"
              className="rounded border-2 border-green-600 bg-green-50 px-4 py-3"
            >
              <p className="text-sm font-bold text-green-800">
                ✅ Evidence Verified — AI Preliminary Check Passed
              </p>
              <p className="mt-1 text-sm text-green-700">
                Your evidence appears to match the reported violation and can be submitted for officer review.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {([1, 2, 3, 4] as const).map((s) => (
              <button
                key={s}
                type="button"
                className="btn-outline !py-1.5 !px-3 text-xs"
                onClick={() => setStep(s)}
              >
                Edit step {s}
              </button>
            ))}
          </div>

          {/* ── FRAUD BLOCK BANNER ── */}
          {blockedByFraud && !analyzing && (
            <div
              role="alert"
              className="rounded border-2 border-red-600 bg-red-50 p-4 space-y-2"
            >
              <p className="text-sm font-bold text-red-800">
                ⛔ Submission Blocked: Uploaded image does not match the reported issue.
              </p>
              <p className="text-sm text-red-700">
                Please upload a clear photo of the product, packaging, or bill so officers
                can verify your complaint.
              </p>
              <button
                type="button"
                className="btn-primary !bg-red-600 !border-red-600 !py-2 text-sm"
                onClick={() => {
                  setErrors([]);
                  setStep(4);
                }}
              >
                📷 Re-upload Evidence (Go to Step 4)
              </button>
            </div>
          )}

          <button
            type="button"
            className={`w-full py-3 active:scale-[0.99] ${
              blockedByFraud
                ? "cursor-not-allowed rounded-lg bg-slate-200 text-slate-400 opacity-50"
                : "btn-saffron disabled:opacity-70"
            }`}
            disabled={submitting || analyzing || blockedByFraud}
            aria-disabled={blockedByFraud}
            onClick={() => void submit()}
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Spinner /> Submitting…
              </span>
            ) : blockedByFraud ? (
              "Submit complaint (blocked — invalid evidence)"
            ) : (
              "Submit complaint"
            )}
          </button>
          {blockedByFraud && !analyzing && (
            <p className="-mt-2 text-center text-xs text-red-700">
              Replace the photo in Step 4 with a clear image of the product or packaging.
              Verification runs automatically — the button unlocks once evidence passes.
            </p>
          )}
        </section>
      )}

      <div className="flex justify-between">
        <button
          type="button"
          className="btn-outline"
          disabled={step === 1}
          onClick={() => {
            setErrors([]);
            setStep((s) => Math.max(1, s - 1));
          }}
        >
          Back
        </button>
        {step < 5 ? (
          <button
            type="button"
            className="btn-primary active:scale-[0.99] disabled:opacity-70"
            onClick={goNext}
            disabled={analyzing || compressing}
          >
            {step === 4 ? (
              analyzing ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner light /> Analyzing…
                </span>
              ) : (
                "Review & analyse"
              )
            ) : (
              "Continue"
            )}
          </button>
        ) : (
          <Link href="/" className="btn-outline">
            Cancel
          </Link>
        )}
      </div>
    </div>
  );
}
