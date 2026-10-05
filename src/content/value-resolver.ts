import { getProfile, getSavedAnswers } from "../storage/storage";
import type { DetectedField, FieldType, Profile, SavedAnswer } from "../types";

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

function profileValue(field: DetectedField, profile: Profile | undefined): boolean {
  const profileKey = PROFILE_FIELDS[field.fieldType];
  return profileKey ? Boolean(profile?.[profileKey]?.trim()) : false;
}

function savedAnswerCount(field: DetectedField, answers: SavedAnswer[]): number {
  return answers.filter((answer) => answer.fieldType === field.fieldType && answer.value.trim()).length;
}

export async function addValueAvailability(fields: DetectedField[]): Promise<DetectedField[]> {
  const [profile, answers] = await Promise.all([getProfile(), getSavedAnswers()]);
  return fields.map((field) => {
    const profileAvailable = profileValue(field, profile);
    const answerCount = savedAnswerCount(field, answers);
    return {
      ...field,
      valueAvailable: profileAvailable || answerCount > 0,
      availableValueCount: (profileAvailable ? 1 : 0) + answerCount,
    };
  });
}

export async function resolveFieldValue(fieldType: FieldType): Promise<string | undefined> {
  const [profile, answers] = await Promise.all([getProfile(), getSavedAnswers()]);
  const profileValue = profileFieldValue(fieldType, profile);
  if (profileValue) return profileValue;
  return answers.find((answer) => answer.fieldType === fieldType && answer.value.trim())?.value.trim();
}
