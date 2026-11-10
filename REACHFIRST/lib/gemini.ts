import { GoogleGenAI } from "@google/genai";

export interface ParsedInventoryItem {
  item: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

/**
 * Parses raw field inventory text into structured financial needs using Gemini API.
 * Includes deterministic fallback parser if GEMINI_API_KEY is not set.
 */
export async function parseInventoryText(text: string): Promise<ParsedInventoryItem[]> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a disaster relief logistics assistant. Parse the following unstructured relief inventory needs into a strict JSON array of objects with the exact keys:
"item" (string), "quantity" (number), "unitCost" (number in INR), "totalCost" (number).
Only return the JSON array, with no other text or explanation.

Input text:
"${text}"`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const textResponse = response.text || "";
      const cleaned = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item) => ({
          item: String(item.item || "Relief item"),
          quantity: Number(item.quantity || 1),
          unitCost: Number(item.unitCost || 100),
          totalCost: Number(item.totalCost || (Number(item.quantity || 1) * Number(item.unitCost || 100))),
        }));
      }
    } catch (err) {
      console.warn("Gemini API call failed, using heuristic fallback parser:", err);
    }
  }

  // Heuristic / Regex Fallback Parser for hackathon offline demo
  return fallbackInventoryParser(text);
}

function fallbackInventoryParser(text: string): ParsedInventoryItem[] {
  const lines = text.split(/[\n,;]+/).map((l) => l.trim()).filter(Boolean);
  const items: ParsedInventoryItem[] = [];

  for (const line of lines) {
    // Try to match: e.g. "500 packets of baby food at 80 rs" or "200 tarpaulins @ 450"
    const match = line.match(/(\d+)\s+(?:packets?|units?|boxes?|kits?|nos?|of\s+)?([a-zA-Z\s]+?)(?:\s+(?:at|@|for|costing)\s+(\d+))?$/i);
    if (match) {
      const qty = parseInt(match[1], 10) || 1;
      const itemName = match[2].trim().replace(/^of\s+/i, "");
      const unit = match[3] ? parseInt(match[3], 10) : 250;
      items.push({
        item: itemName,
        quantity: qty,
        unitCost: unit,
        totalCost: qty * unit,
      });
    } else {
      items.push({
        item: line,
        quantity: 100,
        unitCost: 150,
        totalCost: 15000,
      });
    }
  }

  return items.length > 0
    ? items
    : [
        { item: "Emergency Food Packs", quantity: 500, unitCost: 120, totalCost: 60000 },
        { item: "Water Purification Tablets", quantity: 1000, unitCost: 15, totalCost: 15000 },
        { item: "Heavy Duty Tarpaulins", quantity: 200, unitCost: 450, totalCost: 90000 },
      ];
}
