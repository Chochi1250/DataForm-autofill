import type { Profile, SavedAnswer } from "../types";

const STORAGE_KEYS = {
  profile: "jobform.profile",
  savedAnswers: "jobform.savedAnswers",
} as const;

export async function getLocalValue<T>(key: string): Promise<T | undefined> {
  const value = await chrome.storage.local.get(key);
  return value[key] as T | undefined;
}

export async function setLocalValue<T>(key: string, value: T): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

export async function getProfile(): Promise<Profile | undefined> {
  return getLocalValue<Profile>(STORAGE_KEYS.profile);
}

export async function saveProfile(profile: Profile): Promise<void> {
  await setLocalValue(STORAGE_KEYS.profile, profile);
}

export async function updateProfile(changes: Partial<Profile>): Promise<Profile> {
  const current: Profile = (await getProfile()) ?? {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    country: "",
    linkedin: "",
  };
  const updated = { ...current, ...changes };
  await saveProfile(updated);
  return updated;
}

export async function deleteProfile(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEYS.profile);
}

export async function getSavedAnswers(): Promise<SavedAnswer[]> {
  return (await getLocalValue<SavedAnswer[]>(STORAGE_KEYS.savedAnswers)) ?? [];
}

export async function saveAnswer(answer: SavedAnswer): Promise<void> {
  const answers = await getSavedAnswers();
  const index = answers.findIndex((item) => item.id === answer.id);
  if (index === -1) answers.push(answer);
  else answers[index] = answer;
  await setLocalValue(STORAGE_KEYS.savedAnswers, answers);
}

export async function updateAnswer(id: string, changes: Partial<Omit<SavedAnswer, "id">>): Promise<SavedAnswer | undefined> {
  const answers = await getSavedAnswers();
  const index = answers.findIndex((item) => item.id === id);
  if (index === -1) return undefined;
  const updated = { ...answers[index], ...changes, id };
  answers[index] = updated;
  await setLocalValue(STORAGE_KEYS.savedAnswers, answers);
  return updated;
}

export async function deleteAnswer(id: string): Promise<void> {
  const answers = await getSavedAnswers();
  await setLocalValue(STORAGE_KEYS.savedAnswers, answers.filter((answer) => answer.id !== id));
}
