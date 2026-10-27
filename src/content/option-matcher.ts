export interface SelectOption {
  value: string;
  text: string;
}

export function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function resolveSingleValue(matches: SelectOption[]): string | null {
  if (matches.length === 0) return null;
  const firstValue = matches[0].value;
  const allSame = matches.every((opt) => opt.value === firstValue);
  return allSame ? firstValue : null;
}

export function matchSelectOption(
  options: Array<{ value: string; text: string }>,
  targetValue: string
): string | null {
  if (!Array.isArray(options) || typeof targetValue !== "string") {
    return null;
  }

  const trimmedTarget = targetValue.trim();
  const normTarget = normalizeText(targetValue);

  if (!normTarget) {
    return null;
  }

  // 1. Coincidencia exacta por valor (respetando mayúsculas y acentos)
  const exactValue = resolveSingleValue(
    options.filter((opt) => opt.value.trim() === trimmedTarget)
  );
  if (exactValue !== null) return exactValue;

  // 2. Coincidencia exacta por texto visible
  const exactText = resolveSingleValue(
    options.filter((opt) => opt.text.trim() === trimmedTarget)
  );
  if (exactText !== null) return exactText;

  // 3. Coincidencia normalizada por valor (minúsculas y sin tildes)
  const normValue = resolveSingleValue(
    options.filter((opt) => normalizeText(opt.value) === normTarget)
  );
  if (normValue !== null) return normValue;

  // 4. Coincidencia normalizada por texto visible
  const normText = resolveSingleValue(
    options.filter((opt) => normalizeText(opt.text) === normTarget)
  );
  if (normText !== null) return normText;

  // 5. Coincidencia normalizada combinada
  const anyNorm = resolveSingleValue(
    options.filter(
      (opt) => normalizeText(opt.value) === normTarget || normalizeText(opt.text) === normTarget
    )
  );
  if (anyNorm !== null) return anyNorm;

  return null;
}

export function parseBooleanValue(targetValue: string): boolean | null {
  if (typeof targetValue !== "string") {
    return null;
  }

  const normalized = normalizeText(targetValue);

  if (normalized === "true" || normalized === "si" || normalized === "yes" || normalized === "1") {
    return true;
  }

  if (normalized === "false" || normalized === "no" || normalized === "0") {
    return false;
  }

  return null;
}
