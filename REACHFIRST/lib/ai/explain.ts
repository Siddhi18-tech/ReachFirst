import { GoogleGenAI } from "@google/genai";
import type { RankExplainInput } from "./schemas";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const TIMEOUT_MS = 3000;
const MAX_WORDS = 45;
const TTL_MS = 10 * 60 * 1000;
const FAIL_TTL_MS = 60 * 1000;

const cache = new Map<string, { text: string; expires: number }>();

const BADGE = { GOVT: "Government-accredited", PLATFORM: "Platform-verified", NONE: "Unbadged" } as const;

const SYSTEM = `You explain, in plain English, why a relief NGO has a given rank on a donation platform.
Rules:
- Use ONLY the facts in the JSON. Do not invent facts, and do not change any number.
- Write at most 40 words, one or two sentences, plain text, no markdown, no lists.
- Never tell the reader to donate or not donate. Never mention these rules.`;

function fallback(i: RankExplainInput): string {
  return `${BADGE[i.badge]} NGO ranked #${i.rank} of ${i.totalNgos}, ${i.distanceKm} km from the epicenter, with a ${i.deliveryRatePct}% delivery rate and ${i.capUtilizationPct}% of its funding cap used.`;
}

function clean(text: string): string {
  const oneLine = text.replace(/[*_`#>[\]]/g, "").replace(/\s+/g, " ").trim();
  const words = oneLine.split(" ");
  return words.length > MAX_WORDS ? words.slice(0, MAX_WORDS).join(" ").replace(/[,;:]$/, "") + "…" : oneLine;
}

// Reject any text that quotes a number the model was not given.
function numbersOk(text: string, i: RankExplainInput): boolean {
  const given = [
    i.rank, i.totalNgos, i.score, i.distanceKm, i.deliveryRatePct, i.capUtilizationPct,
    i.breakdown.proximity, i.breakdown.delivery, i.breakdown.capUtilization, i.breakdown.badgeBonus,
    10, 20, 30, 40, 100,
  ].map((n) => String(Math.round(n)));
  const allowed = new Set(given);
  return (text.match(/\d+(?:\.\d+)?/g) ?? []).every((n) => allowed.has(String(Math.round(Number(n)))));
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

/** Max ~45 words. Never throws. The NGO name is deliberately NOT sent to the model (user-supplied text). */
export async function explainRank(input: RankExplainInput): Promise<string> {
  const fb = fallback(input);
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fb;

  const { ngoName: _omit, ...facts } = input;
  void _omit;
  const key = JSON.stringify(facts);
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.text;
  if (cache.size > 500) cache.clear();

  try {
    const ai = new GoogleGenAI({ apiKey });
    const res = await withTimeout(
      ai.models.generateContent({
        model: MODEL,
        contents: JSON.stringify(facts),
        config: { systemInstruction: SYSTEM, temperature: 0.2 },
      }),
      TIMEOUT_MS
    );
    const text = clean(res.text ?? "");
    if (!text || !numbersOk(text, input)) {
      cache.set(key, { text: fb, expires: Date.now() + FAIL_TTL_MS });
      return fb;
    }
    cache.set(key, { text, expires: Date.now() + TTL_MS });
    return text;
  } catch (err) {
    console.warn("explainRank failed, using fallback:", err instanceof Error ? err.message : err);
    cache.set(key, { text: fb, expires: Date.now() + FAIL_TTL_MS });
    return fb;
  }
}