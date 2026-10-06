export const FIELD_TYPES = [
  "FIRST_NAME",
  "LAST_NAME",
  "PATERNAL_LAST_NAME",
  "MATERNAL_LAST_NAME",
  "EMAIL",
  "PHONE",
  "PHONE_COUNTRY_CODE",
  "PHONE_ADDITIONAL_CODE",
  "CITY",
  "COUNTRY",
  "LINKEDIN",
  "CURRENT_COMPANY",
  "CURRENT_POSITION",
  "EXPERIENCE_POSITION",
  "EXPERIENCE_COMPANY",
  "EXPERIENCE_LOCATION",
  "EXPERIENCE_CURRENT",
  "EXPERIENCE_START_DATE",
  "EXPERIENCE_END_DATE",
  "EXPERIENCE_DESCRIPTION",
  "UNKNOWN",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

// Mass autofill must only act on classifications with strong matcher evidence.
// Individual fills remain an explicit user action and do not use this threshold.
export const MASS_FILL_CONFIDENCE_THRESHOLD = 0.8;

export interface FieldMetadata {
  name: string;
  id: string;
  type: string;
  placeholder: string;
  ariaLabel: string;
  autocomplete: string;
  label: string;
  nearbyText: string;
}

export interface DetectedField {
  elementId: string;
  fieldType: FieldType;
  confidence: number;
  metadata: FieldMetadata;
  valueAvailable: boolean;
  availableValueCount: number;
  availableValues: AvailableValue[];
}

export interface AvailableValue {
  id: string;
  label: string;
  value: string;
}

export interface DetectionResponse {
  fields: DetectedField[];
}

export interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  linkedin: string;
}

export interface SavedAnswer {
  id: string;
  fieldType: FieldType;
  name: string;
  value: string;
}

export interface Experience {
  id: string;
  position: string;
  company: string;
  location: string;
  current: boolean;
  startDate: string;
  endDate: string;
  description: string;
}
