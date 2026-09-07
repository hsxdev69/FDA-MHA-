import { NextResponse } from "next/server";
import {
  clampScore,
  heuristicVisionAnalysis,
  parseVisionJson,
  type FraudRisk,
  type ImageSignals,
  type VisionResult,
} from "@/lib/vision";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

/* ------------------------------------------------------------------ *
 * OpenRouter Vision configuration
 * The API key is read from the environment — never hard-coded, so the
 * repository stays safe to push to GitHub.
 * ------------------------------------------------------------------ */
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Verified free vision-capable models (checked live against the account).
 * The first model that returns valid JSON wins.
 * NOTE: "openrouter/free" auto-routes and often lands on a content-safety
 * model that cannot describe images, so it is kept last as a final fallback.
 */
const OPENROUTER_MODELS = [
  "google/gemma-4-31b-it:free",
  "minimax/minimax-m3:free",
  "google/gemma-4-26b-a4b-it:free",
  "openrouter/free",
];

const SYSTEM_PROMPT = `You are an evidence verification officer for the Food & Drug Administration, Maharashtra.
You inspect citizen-uploaded photographs and decide whether the image is genuine evidence of the reported violation.
You must be strict. Citizens sometimes upload fake or irrelevant images to waste officer time.
You always reply with STRICT JSON only. No markdown, no backticks, no commentary.`;

function buildUserPrompt(
  title: string,
  category: string,
  description: string,
): string {
  return `Analyse the attached evidence image against this complaint.

Complaint title: ${title}
Category: ${category}
Description: ${description}

STRICT INSPECTION RULES

1) RELEVANCE & FAKE CHECK
   Does the image visually match the reported violation (food spoilage, mould/fungus,
   expired medicine label, adulteration, broken/tampered packaging, unhygienic premises)?
   If the image shows irrelevant content — a selfie or person, wallpaper or gradient,
   meme, screenshot, animal, vehicle, landscape, cartoon or any random unrelated object —
   then it is NOT valid evidence:
     isLikelyFake = true, authenticityScore between 10 and 25, priorityLevel = "Low".

2) AUTHENTIC EVIDENCE
   If real product defects are visible, or a readable batch number / expiry date /
   manufacturing label, spoiled food, or damaged/tampered packaging:
     isLikelyFake = false, authenticityScore between 80 and 100,
     priorityLevel = "High" (or "Critical" if there is a clear public-health danger).

3) PARTIAL / UNCLEAR
   If the photo is blurry, too dark, too zoomed, or only loosely related:
     isLikelyFake = false, authenticityScore between 40 and 69, priorityLevel = "Medium".

OUTPUT FIELD MEANINGS
- aiReasoning: Short citizen-friendly explanation (1-2 sentences) of what you see and
  whether the evidence is valid. Do NOT mention technical terms like entropy, aspect ratio,
  or filename. Write as if you are explaining to the complainant.
- officerNote: Detailed, professional note for the investigating FDA officer. Mention
  specific visible indicators — batch code, seal condition, colour of product, container
  type, label text, mould pattern, packaging integrity — or explain exactly why it is
  flagged as irrelevant/stock/fake. 2-3 sentences.
- recommendedAction: Concrete next step for the officer. Choose one:
  "🔴 Urgent: Schedule physical sample collection within 24 hours. Notify district health officer."
  "🟡 Routine: Inspect the establishment within 72 hours. Collect sample for lab testing."
  "🔴 High Fraud Risk: Request re-upload of a genuine product photo before scheduling field visit."
  "🟢 Advisory: Issue formal notice to establishment; no immediate sample collection required."

Reply with STRICT JSON only — no markdown, no backticks, no extra keys:
{"authenticityScore": number, "priorityLevel": "Low" | "Medium" | "High" | "Critical", "isLikelyFake": boolean, "aiReasoning": "citizen-friendly 1-2 sentence summary", "officerNote": "detailed officer-only investigation note", "recommendedAction": "recommended next action with emoji prefix", "detectedObjects": "comma-separated short list of visible objects"}`;
}

/** Rejects safety-router replies such as "User Safety: safe" that contain no JSON. */
function looksLikeUsableReply(text: string): boolean {
  return typeof text === "string" && text.includes("{") && text.includes("}");
}

function deriveFraudRisk(score: number, isLikelyFake: boolean): FraudRisk {
  if (isLikelyFake || score < 30) return "HIGH";
  if (score < 70) return "MEDIUM";
  return "LOW";
}

async function callOpenRouter(
  mime: string,
  base64: string,
  title: string,
  category: string,
  description: string,
): Promise<VisionResult | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;

  const referer = process.env.OPENROUTER_SITE_URL || "https://mhafda.vercel.app";
  const appTitle = process.env.OPENROUTER_SITE_NAME || "Maha FDA Complaint Portal";
  const userPrompt = buildUserPrompt(title, category, description.slice(0, 1500));

  for (const model of OPENROUTER_MODELS) {
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "HTTP-Referer": referer,
          "X-Title": appTitle,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.1,
          max_tokens: 400,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: [
                { type: "text", text: userPrompt },
                {
                  type: "image_url",
                  image_url: { url: `data:${mime};base64,${base64}` },
                },
              ],
            },
          ],
        }),
        signal: AbortSignal.timeout(22_000),
      });

      if (!res.ok) continue;

      const json = (await res.json()) as {
        error?: unknown;
        choices?: { message?: { content?: string } }[];
      };
      if (json.error) continue;

      const text = json.choices?.[0]?.message?.content ?? "";
      if (!looksLikeUsableReply(text)) continue;

      const parsed = parseVisionJson(text);
      if (!parsed) continue;

      // Enforce the documented score bands even if the model drifts.
      let score = clampScore(parsed.authenticityScore);
      let fake = parsed.isLikelyFake;
      let priority = parsed.priorityLevel;

      if (fake) {
        score = Math.min(score, 25);
        priority = "Low";
      } else if (score >= 80 && priority !== "Critical") {
        priority = priority === "High" ? "High" : "High";
      }

      return {
        authenticityScore: score,
        priorityLevel: priority,
        isLikelyFake: fake,
        fraudRisk: deriveFraudRisk(score, fake),
        aiReasoning: parsed.aiReasoning,
        detectedObjects: parsed.detectedObjects,
        source: "openrouter",
      };
    } catch {
      // Timeout / network / parse issue — try the next model.
      continue;
    }
  }

  return null;
}

/* ---------------- Optional secondary providers ---------------- */

async function callGemini(
  mime: string,
  base64: string,
  title: string,
  category: string,
  description: string,
): Promise<VisionResult | null> {
  const key =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY;
  if (!key) return null;

  const prompt = `${SYSTEM_PROMPT}\n\n${buildUserPrompt(title, category, description.slice(0, 1200))}`;

  for (const model of ["gemini-2.0-flash", "gemini-1.5-flash"]) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: mime, data: base64 } },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 400,
              responseMimeType: "application/json",
            },
          }),
          signal: AbortSignal.timeout(20_000),
        },
      );
      if (!res.ok) continue;
      const json = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) continue;
      const parsed = parseVisionJson(text);
      if (parsed) {
        parsed.source = "gemini";
        parsed.fraudRisk = deriveFraudRisk(
          parsed.authenticityScore,
          parsed.isLikelyFake,
        );
        return parsed;
      }
    } catch {
      continue;
    }
  }
  return null;
}

async function callOpenAI(
  mime: string,
  base64: string,
  title: string,
  category: string,
  description: string,
): Promise<VisionResult | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: buildUserPrompt(title, category, description.slice(0, 1200)),
              },
              {
                type: "image_url",
                image_url: { url: `data:${mime};base64,${base64}` },
              },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content;
    if (!text) return null;
    const parsed = parseVisionJson(text);
    if (parsed) {
      parsed.source = "openai";
      parsed.fraudRisk = deriveFraudRisk(
        parsed.authenticityScore,
        parsed.isLikelyFake,
      );
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

/* ------------------------------ Route ------------------------------ */

export async function POST(request: Request) {
  // Every failure path returns HTTP 200 with a safe fallback so the citizen
  // complaint flow can never be blocked by an AI outage.
  try {
    let body: {
      title?: string;
      complaintType?: string;
      category?: string;
      description?: string;
      imageBase64?: string;
      mime?: string;
      hasImage?: boolean;
      signals?: ImageSignals | null;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({
        ok: true,
        analysis: heuristicVisionAnalysis("Other FDA Violation", "", null, false),
      });
    }

    const category = String(body.category || body.complaintType || "Other FDA Violation");
    const title = String(body.title || category);
    const description = String(body.description ?? "");
    const hasImage = Boolean(body.hasImage && body.imageBase64);
    const mime =
      body.mime && body.mime.startsWith("image/") ? body.mime : "image/jpeg";
    const base64 = (body.imageBase64 ?? "").replace(/^data:[^;]+;base64,/, "");

    let analysis: VisionResult | null = null;

    if (hasImage && base64.length > 32) {
      analysis = await callOpenRouter(mime, base64, title, category, description);
      if (!analysis) {
        analysis = await callGemini(mime, base64, title, category, description);
      }
      if (!analysis) {
        analysis = await callOpenAI(mime, base64, title, category, description);
      }
    }

    if (!analysis) {
      analysis = heuristicVisionAnalysis(
        category,
        description,
        body.signals ?? null,
        hasImage,
      );
    }

    return NextResponse.json({ ok: true, analysis });
  } catch (error) {
    console.error("[analyze-evidence] unexpected error:", error);
    return NextResponse.json({
      ok: true,
      analysis: heuristicVisionAnalysis("Other FDA Violation", "", null, false),
    });
  }
}
