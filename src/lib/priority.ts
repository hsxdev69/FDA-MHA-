/**
 * AI-assisted preliminary priority scoring (deterministic, local engine).
 *
 * IMPORTANT: This score is NOT an official FDA decision. It never rejects a
 * complaint, never declares it genuine or false, and never orders
 * enforcement. It only helps authorized officers prioritise complaints.
 */

export type PriorityCategory = "HIGH" | "MEDIUM" | "LOW";

const TYPE_BASE: Record<string, number> = {
  "Expired Food": 55,
  "Adulterated Food": 68,
  "Unsafe Food": 78,
  "Spurious Drug": 95,
  "Drug Quality Issue": 82,
  "Unlicensed Sale": 70,
  "Misbranded Product": 45,
  "Other FDA Violation": 52,
};

const TYPE_REASON: Record<string, string> = {
  "Expired Food": "Possible food-safety risk from expired products",
  "Adulterated Food": "Possible health risk from adulterated food",
  "Unsafe Food": "Possible risk from unsafe food products",
  "Spurious Drug": "Possible risk from spurious medicines",
  "Drug Quality Issue": "Possible risk from substandard drug quality",
  "Unlicensed Sale": "Possible risk from unlicensed sale of regulated products",
  "Misbranded Product": "Possible risk from misbranded product information",
  "Other FDA Violation": "Possible FDA-related violation",
};

interface RiskKeyword {
  pattern: RegExp;
  weight: number;
  note: string;
}

const RISK_KEYWORDS: RiskKeyword[] = [
  { pattern: /\b(death|deaths|died|fatal|fatality)\w*/i, weight: 18, note: "reports of serious harm" },
  { pattern: /\b(hospital|hospitalised|hospitalized|icu)\w*/i, weight: 15, note: "hospitalisation mentioned" },
  { pattern: /\b(child|children|infant|baby|babies|kids|minor)\b/i, weight: 12, note: "affects children" },
  { pattern: /\b(pregnant|pregnancy|lactating)\w*/i, weight: 12, note: "affects pregnant women" },
  { pattern: /\b(spurious|duplicate|fake|counterfeit)\w*/i, weight: 12, note: "counterfeit product suspected" },
  { pattern: /\b(poison|toxic|contaminat)\w*/i, weight: 14, note: "toxic contamination suspected" },
  { pattern: /\b(bleeding|vomit|diarrho|dysentery|fever|nausea)\w*/i, weight: 10, note: "illness symptoms reported" },
  { pattern: /\b(maggot|insect|rodent|rat|cockroach|hair|fungus|mold|mould)\w*/i, weight: 10, note: "foreign matter reported" },
  { pattern: /\b(expired|expiry|stale)\w*/i, weight: 8, note: "expired products reported" },
  { pattern: /\b(allerg|allergy)\w*/i, weight: 8, note: "allergy risk mentioned" },
  { pattern: /\b(illegal|unlicensed|unregistered|no license|without license)\w*/i, weight: 8, note: "unlicensed activity suspected" },
  { pattern: /\b(chemist|pharmac|medical store)\w*/i, weight: 4, note: "pharmacy involved" },
  { pattern: /\b(restaurant|hotel|canteen|school|college)\w*/i, weight: 5, note: "public food outlet involved" },
  { pattern: /\b(severe|serious|critical|emergency)\w*/i, weight: 6, note: "described as severe" },
];

export function priorityCategory(severity: number): PriorityCategory {
  if (severity >= 70) return "HIGH";
  if (severity >= 40) return "MEDIUM";
  return "LOW";
}

export const PRIORITY_META: Record<
  PriorityCategory,
  { label: string; emoji: string }
> = {
  HIGH: { label: "HIGH PRIORITY", emoji: "🔴" },
  MEDIUM: { label: "MEDIUM PRIORITY", emoji: "🟠" },
  LOW: { label: "LOW PRIORITY", emoji: "🟢" },
};

export interface PriorityAnalysis {
  severity: number;
  category: PriorityCategory;
  reason: string;
}

/**
 * Analyses the complaint type + description text and returns a preliminary
 * priority score (0–100) with a short human-readable reason.
 */
export function analyzePriority(
  complaintType: string,
  description: string,
): PriorityAnalysis {
  const base = TYPE_BASE[complaintType] ?? 50;
  const text = description ?? "";

  let bonus = 0;
  const signals: string[] = [];

  for (const keyword of RISK_KEYWORDS) {
    if (keyword.pattern.test(text)) {
      bonus += keyword.weight;
      signals.push(keyword.note);
    }
  }

  // Cap keyword boost so the text can never fully override the type signal.
  const severity = Math.max(0, Math.min(100, base + Math.min(bonus, 45)));
  const category = priorityCategory(severity);

  const typeClause = TYPE_REASON[complaintType] ?? "Possible FDA-related violation";
  let reason = `${typeClause}, requiring verification.`;
  if (signals.length > 0) {
    reason += ` Risk signals: ${signals.slice(0, 2).join(", ")}.`;
  }

  return { severity, category, reason };
}
