import { getExperiences, getProfile, getSavedAnswers } from "../storage/storage";
import type { AvailableValue, DetectedField, Experience, FieldType, Profile, SavedAnswer } from "../types";

const PROFILE_FIELDS: Record<string, keyof Profile> = {
  FIRST_NAME: "firstName",
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

function availableValues(fieldType: FieldType, profile: Profile | undefined, answers: SavedAnswer[], experiences: Experience[]): AvailableValue[] {
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
  return values;
}

export async function addValueAvailability(fields: DetectedField[]): Promise<DetectedField[]> {
  const [profile, answers, experiences] = await Promise.all([getProfile(), getSavedAnswers(), getExperiences()]);
  return fields.map((field) => {
    const values = availableValues(field.fieldType, profile, answers, experiences);
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
  const values = availableValues(fieldType, profile, answers, experiences);
  if (valueId) return values.find((value) => value.id === valueId)?.value;
  return values.length === 1 ? values[0].value : undefined;
}
