import { strict as assert } from "node:assert";
import { test } from "node:test";
import { matchField } from "../src/content/matcher";
import type { FieldMetadata, FieldType } from "../src/types";

const EMPTY_METADATA: FieldMetadata = {
  name: "",
  id: "",
  type: "text",
  placeholder: "",
  ariaLabel: "",
  autocomplete: "",
  label: "",
  nearbyText: "",
};

function metadata(signals: Partial<FieldMetadata>): FieldMetadata {
  return { ...EMPTY_METADATA, ...signals };
}

function assertMatch(expected: FieldType, signals: Partial<FieldMetadata>): void {
  assert.equal(matchField(metadata(signals)).fieldType, expected);
}

test("clasifica nombre y variantes de apellido del fixture", () => {
  assertMatch("FIRST_NAME", { name: "first_name", label: "Nombre", autocomplete: "given-name" });
  assertMatch("FIRST_NAME", { name: "candidate_given", label: "Nombre", placeholder: "First name" });
  assertMatch("LAST_NAME", { name: "last_name", label: "Apellido", autocomplete: "family-name" });
  assertMatch("LAST_NAME", { name: "surname_value", label: "Apellido", placeholder: "Last name" });
  assertMatch("PATERNAL_LAST_NAME", { name: "paternal_surname", label: "Apellido paterno" });
  assertMatch("PATERNAL_LAST_NAME", { name: "father_last_name", label: "Father's last name" });
  assertMatch("MATERNAL_LAST_NAME", { name: "maternal_surname", label: "Apellido materno" });
  assertMatch("MATERNAL_LAST_NAME", { name: "mother_last_name", label: "Mother's last name" });
});

test("clasifica email y teléfonos, incluidos sus componentes", () => {
  assertMatch("EMAIL", { name: "candidate_email", type: "email", autocomplete: "email", label: "Email" });
  assertMatch("EMAIL", { name: "contact_value", type: "email", label: "Correo electrónico", placeholder: "Email" });
  assertMatch("PHONE", { name: "telefono", type: "tel", autocomplete: "tel", label: "Teléfono" });
  assertMatch("PHONE", { name: "mobile_number", ariaLabel: "Mobile phone" });
  assertMatch("PHONE_COUNTRY_CODE", { name: "dialing_code", label: "Country code", placeholder: "+54" });
  assertMatch("PHONE_ADDITIONAL_CODE", { name: "area_code", label: "Area code / Additional phone code" });
});

test("prioriza puesto y empresa actuales fuera del contexto de experiencia", () => {
  assertMatch("CURRENT_POSITION", { name: "current_position", label: "Current position", placeholder: "Puesto actual" });
  assertMatch("CURRENT_POSITION", { name: "job_title", label: "Current job" });
  assertMatch("CURRENT_COMPANY", { name: "current_employer", label: "Current company", placeholder: "Company" });
});

test("clasifica todos los campos de una experiencia cuando hay contexto", () => {
  const nearbyText = "Work Experience Experience 1";
  assertMatch("EXPERIENCE_POSITION", { name: "experience[0][job_title]", label: "Job title", nearbyText });
  assertMatch("EXPERIENCE_COMPANY", { name: "experience[0][company]", label: "Company", nearbyText });
  assertMatch("EXPERIENCE_LOCATION", { name: "experience[0][location]", label: "Location", nearbyText });
  assertMatch("EXPERIENCE_CURRENT", { name: "experience[0][current]", type: "checkbox", label: "Currently working here", nearbyText });
  assertMatch("EXPERIENCE_START_DATE", { name: "experience[0][start_date]", type: "date", label: "Start date", nearbyText });
  assertMatch("EXPERIENCE_END_DATE", { name: "experience[0][end_date]", type: "date", label: "End date", nearbyText });
  assertMatch("EXPERIENCE_DESCRIPTION", { name: "experience[0][description]", type: "textarea", label: "Description", nearbyText });
});

test("no infiere experiencia ni datos de perfil de casos conflictivos", () => {
  assertMatch("UNKNOWN", { name: "company_name", label: "Company" });
  assertMatch("UNKNOWN", { name: "location_current", label: "Current location", placeholder: "Location" });
  assertMatch("UNKNOWN", { name: "years_experience", type: "number", label: "How many years of experience do you have?" });
  assertMatch("UNKNOWN", { name: "relevant_experience", type: "textarea", label: "Describe your most relevant experience" });
  assertMatch("UNKNOWN", { name: "internal_reference", label: "Internal reference" });
  assertMatch("UNKNOWN", { name: "accept_terms", type: "checkbox", label: "Accept terms" });
});
