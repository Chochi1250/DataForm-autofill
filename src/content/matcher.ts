import type { FieldMetadata, FieldType } from "../types";

interface MatchResult {
  fieldType: FieldType;
  confidence: number;
}

interface FieldRule {
  type: Exclude<FieldType, "UNKNOWN">;
  patterns: RegExp[];
  typePatterns?: RegExp[];
  requiresExperienceContext?: boolean;
}

const EXPERIENCE_CONTEXT = /(?:work|professional|employment|career)[ _-]?experience|work history|(?:experiencia|historial)[ _-]?(?:laboral|profesional)|employment history/;

const RULES: FieldRule[] = [
  { type: "EMAIL", patterns: [/e-?mail/, /correo(?:\s+electr[oó]nico)?/], typePatterns: [/^email$/] },
  { type: "FIRST_NAME", patterns: [/first[ _-]?name/, /given[ _-]?name/, /nombre(?!.*apellido)/] },
  { type: "PATERNAL_LAST_NAME", patterns: [/paternal[ _-]?(last[ _-]?)?name/, /father(?:'s)?[ _-]?surname/, /apellido[ _-]?paterno/] },
  { type: "MATERNAL_LAST_NAME", patterns: [/maternal[ _-]?(last[ _-]?)?name/, /mother(?:'s)?[ _-]?surname/, /apellido[ _-]?materno/] },
  { type: "LAST_NAME", patterns: [/last[ _-]?name/, /family[ _-]?name/, /surname/, /apellido/] },
  { type: "PHONE_COUNTRY_CODE", patterns: [/country[ _-]?code/, /calling[ _-]?code/, /dialing[ _-]?code/, /international[ _-]?prefix/, /c[oó]digo(?:[ _-]?(?:telef[oó]nico|de llamada))?[ _-]?nacional/, /prefijo[ _-]?(?:telef[oó]nico[ _-]?)?internacional/] },
  { type: "PHONE_ADDITIONAL_CODE", patterns: [/area[ _-]?code/, /phone[ _-]?(?:area|additional)[ _-]?code/, /c[oó]digo[ _-]?(?:de[ _-]?)?(?:[aá]rea|adicional)/, /prefijo[ _-]?telef[oó]nico[ _-]?adicional/] },
  { type: "PHONE", patterns: [/phone/, /mobile/, /tel[eé]fono/, /celular/], typePatterns: [/^tel$/] },
  { type: "EXPERIENCE_POSITION", patterns: [/job[ _-]?title/, /position/, /puesto/, /cargo/], requiresExperienceContext: true },
  { type: "EXPERIENCE_COMPANY", patterns: [/company/, /employer/, /empresa/, /compa[nñ][ií]a/], requiresExperienceContext: true },
  { type: "EXPERIENCE_LOCATION", patterns: [/location/, /ubicaci[oó]n/, /localizaci[oó]n/], requiresExperienceContext: true },
  { type: "EXPERIENCE_CURRENT", patterns: [/currently[ _-]?(?:working|work)[ _-]?here/, /current[ _-]?job/, /trabajo[ _-]?actualmente/, /actualmente/], requiresExperienceContext: true },
  { type: "EXPERIENCE_START_DATE", patterns: [/start[ _-]?date/, /fecha[ _-]?de[ _-]?inicio/, /desde/], requiresExperienceContext: true },
  { type: "EXPERIENCE_END_DATE", patterns: [/end[ _-]?date/, /fecha[ _-]?(?:de[ _-]?)?(?:finalizaci[oó]n|fin)/, /hasta/], requiresExperienceContext: true },
  { type: "EXPERIENCE_DESCRIPTION", patterns: [/description/, /responsibilit(?:y|ies)/, /descripci[oó]n/, /responsabilidades/], requiresExperienceContext: true },
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
    const hasExperienceContext = EXPERIENCE_CONTEXT.test(metadata.nearbyText.toLowerCase());
    if (rule.requiresExperienceContext && !hasExperienceContext) continue;
    let score = 0;
    for (const [property, weight] of SIGNALS) {
      const value = metadata[property].toLowerCase();
      if (value && rule.patterns.some((pattern) => pattern.test(value))) score += weight;
    }
    if (rule.requiresExperienceContext) score += 30;
    if (rule.typePatterns?.some((pattern) => pattern.test(metadata.type.toLowerCase()))) score += 40;
    const confidence = Math.min(score / 100, 1);
    if (confidence > best.confidence) best = { fieldType: rule.type, confidence };
  }
  return best;
}
