export const FIELD_TYPES = [
  "FIRST_NAME",
  "LAST_NAME",
  "EMAIL",
  "PHONE",
  "CITY",
  "COUNTRY",
  "LINKEDIN",
  "CURRENT_COMPANY",
  "CURRENT_POSITION",
  "UNKNOWN",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

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
