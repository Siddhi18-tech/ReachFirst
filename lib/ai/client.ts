import { GoogleGenAI } from "@google/genai";

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

/**
 * Shared Gemini helper used by all lib/ai/* modules.
 * Throws 'NO_KEY' if GEMINI_API_KEY is unset, 'TIMEOUT' if the call exceeds timeoutMs.
 */
export async function generate(opts: {
  prompt: string;
  system?: string;
  json?: boolean;
  timeoutMs?: number;
}): Promise<string> {
  if (!ai) throw new Error("NO_KEY");

  const call = ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    contents: opts.prompt,
    config: {
      systemInstruction: opts.system,
      temperature: 0.2,
      ...(opts.json ? { responseMimeType: "application/json" } : {}),
    },
  });

  const timeout = new Promise<never>((_, rej) =>
    setTimeout(() => rej(new Error("TIMEOUT")), opts.timeoutMs ?? 8000)
  );

  const res = await Promise.race([call, timeout]);
  return res.text ?? "";
}

