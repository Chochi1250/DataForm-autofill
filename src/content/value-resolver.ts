import { getProfile, getSavedAnswers } from "../storage/storage";
import type { AvailableValue, DetectedField, FieldType, Profile, SavedAnswer } from "../types";

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

function availableValues(fieldType: FieldType, profile: Profile | undefined, answers: SavedAnswer[]): AvailableValue[] {
  const values: AvailableValue[] = [];
  const profileValue = profileFieldValue(fieldType, profile);
  if (profileValue) values.push({ id: "profile", label: "Profile", value: profileValue });
  for (const answer of answers) {
    if (answer.fieldType === fieldType && answer.value.trim()) {
      values.push({ id: `answer:${answer.id}`, label: answer.name, value: answer.value.trim() });
    }
  }
  return values;
}

export async function addValueAvailability(fields: DetectedField[]): Promise<DetectedField[]> {
  const [profile, answers] = await Promise.all([getProfile(), getSavedAnswers()]);
  return fields.map((field) => {
    const values = availableValues(field.fieldType, profile, answers);
    return {
      ...field,
      valueAvailable: values.length > 0,
      availableValueCount: values.length,
      availableValues: values,
    };
  });
}

export async function resolveFieldValue(fieldType: FieldType, valueId?: string): Promise<string | undefined> {
  const [profile, answers] = await Promise.all([getProfile(), getSavedAnswers()]);
  const values = availableValues(fieldType, profile, answers);
  if (valueId) return values.find((value) => value.id === valueId)?.value;
  return values.length === 1 ? values[0].value : undefined;
}
