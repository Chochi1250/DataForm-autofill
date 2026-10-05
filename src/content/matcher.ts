import type { FieldMetadata, FieldType } from "../types";

interface MatchResult {
  fieldType: FieldType;
  confidence: number;
}

interface FieldRule {
  type: Exclude<FieldType, "UNKNOWN">;
  patterns: RegExp[];
  typePatterns?: RegExp[];
}

const RULES: FieldRule[] = [
  { type: "EMAIL", patterns: [/e-?mail/, /correo(?:\s+electr[oó]nico)?/], typePatterns: [/^email$/] },
  { type: "FIRST_NAME", patterns: [/first[ _-]?name/, /given[ _-]?name/, /nombre(?!.*apellido)/] },
  { type: "LAST_NAME", patterns: [/last[ _-]?name/, /family[ _-]?name/, /surname/, /apellido/] },
  { type: "PHONE", patterns: [/phone/, /mobile/, /tel[eé]fono/, /celular/], typePatterns: [/^tel$/] },
  { type: "CITY", patterns: [/city/, /ciudad/, /localidad/] },
  { type: "COUNTRY", patterns: [/country/, /pa[ií]s/] },
  { type: "LINKEDIN", patterns: [/linked[ _-]?in/] },
  { type: "CURRENT_COMPANY", patterns: [/current[ _-]?(company|employer)/, /empresa actual/, /compa[nñ][ií]a actual/] },
  { type: "CURRENT_POSITION", patterns: [/current[ _-]?(?:(?:job|work)[ _-]?)?(position|title|role|job)/, /job[ _-]?title/, /cargo actual/, /puesto actual/] },
];

const SIGNALS: Array<[keyof FieldMetadata, number]> = [
  ["name", 50], ["id", 45], ["autocomplete", 40], ["label", 35], ["placeholder", 30], ["ariaLabel", 30], ["nearbyText", 15],
];

export function matchField(metadata: FieldMetadata): MatchResult {
  let best: MatchResult = { fieldType: "UNKNOWN", confidence: 0 };
  for (const rule of RULES) {
    let score = 0;
    for (const [property, weight] of SIGNALS) {
      const value = metadata[property].toLowerCase();
      if (value && rule.patterns.some((pattern) => pattern.test(value))) score += weight;
    }
    if (rule.typePatterns?.some((pattern) => pattern.test(metadata.type.toLowerCase()))) score += 40;
    const confidence = Math.min(score / 100, 1);
    if (confidence > best.confidence) best = { fieldType: rule.type, confidence };
  }
  return best;
}
