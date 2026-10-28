import { getExperiences, getProfile, getSavedAnswers } from "../storage/storage";
import type { AvailableValue, DetectedField, Experience, FieldMetadata, FieldType, Profile, SavedAnswer } from "../types";

const PROFILE_FIELDS: Record<string, keyof Profile> = {
  FIRST_NAME: "firstName",
  MIDDLE_NAME: "middleName",
  LAST_NAME: "lastName",
  EMAIL: "email",
  PHONE: "phone",
  CITY: "city",
  COUNTRY: "country",
  LINKEDIN: "linkedin",
};

function profileFieldValue(fieldType: FieldType, profile: Profile | undefined): string | undefined {
  const profileKey = PROFILE_FIELDS[fieldType];
  const value = profileKey ? profile?.[profileKey]?.trim() : undefined;
  return value || undefined;
}

type ExperienceFieldType =
  | "EXPERIENCE_POSITION"
  | "EXPERIENCE_COMPANY"
  | "EXPERIENCE_LOCATION"
  | "EXPERIENCE_CURRENT"
  | "EXPERIENCE_START_DATE"
  | "EXPERIENCE_END_DATE"
  | "EXPERIENCE_DESCRIPTION";

const EXPERIENCE_FIELDS: Record<ExperienceFieldType, keyof Experience> = {
  EXPERIENCE_POSITION: "position",
  EXPERIENCE_COMPANY: "company",
  EXPERIENCE_LOCATION: "location",
  EXPERIENCE_CURRENT: "current",
  EXPERIENCE_START_DATE: "startDate",
  EXPERIENCE_END_DATE: "endDate",
  EXPERIENCE_DESCRIPTION: "description",
};

function experienceFieldValue(experience: Experience, fieldType: ExperienceFieldType): string | undefined {
  const field = EXPERIENCE_FIELDS[fieldType];
  if (!field) return undefined;
  const rawValue = experience[field];
  const value = typeof rawValue === "boolean" ? String(rawValue) : rawValue.trim();
  return value || undefined;
}

function experienceLabel(experience: Experience): string {
  const position = experience.position.trim();
  const company = experience.company.trim();
  const summary = [position, company].filter(Boolean).join(" — ");
  return `Experience: ${summary || experience.id}`;
}

export function extractExperienceIndex(metadata: FieldMetadata): number | undefined {
  const combinedNames = `${metadata.name} ${metadata.id}`;

  // 1. Notación entre corchetes o guiones bajos: experience[0], exp_1, work_history[2]
  const bracketMatch = combinedNames.match(/(?:experience|exp|work|empleo|history)[s]?[\[_.-](\d+)/i);
  if (bracketMatch) {
    return parseInt(bracketMatch[1], 10);
  }

  // 2. Patrón con número en nombre o id: job-title-1, company-2, exp-1
  const dashMatch = combinedNames.match(/(?:job[ _-]?title|company|position|location|start[ _-]?date|end[ _-]?date|description|exp|experience)[_-]?(\d+)\b/i);
  if (dashMatch) {
    const num = parseInt(dashMatch[1], 10);
    return num > 0 ? num - 1 : 0;
  }

  // 3. Texto cercano con número de experiencia: Experience 1, Experiencia 2, Puesto 1
  const textMatch = metadata.nearbyText.match(/(?:experience|experiencia|empleo|trabajo|historial)[^\d\w]{0,15}(\d+)\b/i);
  if (textMatch) {
    const num = parseInt(textMatch[1], 10);
    return num > 0 ? num - 1 : 0;
  }

  return undefined;
}

function availableValues(
  fieldType: FieldType,
  profile: Profile | undefined,
  answers: SavedAnswer[],
  experiences: Experience[],
  experienceIndex?: number
): AvailableValue[] {
  const values: AvailableValue[] = [];
  const profileValue = profileFieldValue(fieldType, profile);
  if (profileValue) values.push({ id: "profile", label: "Profile", value: profileValue });
  for (const answer of answers) {
    if (answer.fieldType === fieldType && answer.value.trim()) {
      values.push({ id: `answer:${answer.id}`, label: answer.name, value: answer.value.trim() });
    }
  }
  const experienceField = (fieldType in EXPERIENCE_FIELDS) ? EXPERIENCE_FIELDS[fieldType as ExperienceFieldType] : undefined;
  if (experienceField) {
    if (experienceIndex !== undefined && experiences[experienceIndex]) {
      const exp = experiences[experienceIndex];
      const value = experienceFieldValue(exp, fieldType as ExperienceFieldType);
      if (value) {
        values.push({
          id: `experience:${exp.id}:${experienceField}`,
          label: `${experienceLabel(exp)} (#${experienceIndex + 1})`,
          value,
        });
      }
    } else {
      for (const experience of experiences) {
        const value = experienceFieldValue(experience, fieldType as ExperienceFieldType);
        if (value) {
          values.push({
            id: `experience:${experience.id}:${experienceField}`,
            label: experienceLabel(experience),
            value,
          });
        }
      }
    }
  }
  return values;
}

export async function addValueAvailability(fields: DetectedField[]): Promise<DetectedField[]> {
  const [profile, answers, experiences] = await Promise.all([getProfile(), getSavedAnswers(), getExperiences()]);
  const occurrenceMap = new Map<FieldType, number>();

  return fields.map((field) => {
    let experienceIndex: number | undefined;
    if (field.fieldType in EXPERIENCE_FIELDS) {
      experienceIndex = extractExperienceIndex(field.metadata);
      if (experienceIndex === undefined) {
        const count = occurrenceMap.get(field.fieldType) ?? 0;
        occurrenceMap.set(field.fieldType, count + 1);
        experienceIndex = count;
      }
    }

    const values = availableValues(field.fieldType, profile, answers, experiences, experienceIndex);
    return {
      ...field,
      valueAvailable: values.length > 0,
      availableValueCount: values.length,
      availableValues: values,
    };
  });
}

export async function resolveFieldValue(fieldType: FieldType, valueId?: string): Promise<string | undefined> {
  const [profile, answers, experiences] = await Promise.all([getProfile(), getSavedAnswers(), getExperiences()]);
  if (valueId && valueId.startsWith("experience:")) {
    const parts = valueId.split(":");
    const expId = parts[1];
    const expField = parts[2] as keyof Experience;
    const exp = experiences.find((e) => e.id === expId);
    if (exp && expField in exp) {
      const raw = exp[expField];
      return typeof raw === "boolean" ? String(raw) : (raw as string).trim();
    }
  }
  const values = availableValues(fieldType, profile, answers, experiences);
  if (valueId) return values.find((value) => value.id === valueId)?.value;
  return values.length === 1 ? values[0].value : undefined;
}
