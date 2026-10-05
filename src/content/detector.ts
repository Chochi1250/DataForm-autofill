import { matchField } from "./matcher";
import type { DetectedField, FieldMetadata } from "../types";

export type FormElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

const ELEMENT_ID = "data-jobform-element-id";
let nextElementId = 1;

function normalize(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function getLabel(element: FormElement): string {
  const labels = element.labels ? Array.from(element.labels).map((label) => label.textContent).join(" ") : "";
  if (labels) return normalize(labels);
  const wrappedLabel = element.closest("label");
  if (wrappedLabel) return normalize(wrappedLabel.textContent);
  if (element.id) return normalize(document.querySelector(`label[for="${CSS.escape(element.id)}"]`)?.textContent);
  return "";
}

function getNearbyText(element: FormElement): string {
  const container = element.closest("fieldset, [role='group'], .form-group, .field, p, div");
  return normalize(container?.textContent).slice(0, 300);
}

function getElementId(element: FormElement): string {
  const existing = element.getAttribute(ELEMENT_ID);
  if (existing) return existing;
  const id = `jobform-${nextElementId++}`;
  element.setAttribute(ELEMENT_ID, id);
  return id;
}

export function getMetadata(element: FormElement): FieldMetadata {
  return {
    name: normalize(element.getAttribute("name")),
    id: normalize(element.id),
    type: element instanceof HTMLInputElement ? element.type : element.tagName.toLowerCase(),
    placeholder: normalize(element.getAttribute("placeholder")),
    ariaLabel: normalize(element.getAttribute("aria-label")),
    autocomplete: normalize(element.getAttribute("autocomplete")),
    label: getLabel(element),
    nearbyText: getNearbyText(element),
  };
}

export function detectField(element: FormElement): DetectedField {
  const metadata = getMetadata(element);
  const match = matchField(metadata);
  return {
    elementId: getElementId(element),
    fieldType: match.fieldType,
    confidence: match.confidence,
    metadata,
    valueAvailable: false,
    availableValueCount: 0,
  };
}

export function findFormElements(root: ParentNode = document): FormElement[] {
  return Array.from(root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select"))
    .filter((element) => element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)
    .filter((element) => element.type !== "hidden" && !element.disabled);
}
