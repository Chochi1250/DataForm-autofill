import { detectField, findFormElements } from "./detector";
import { addValueAvailability, resolveFieldValue } from "./value-resolver";
import { MASS_FILL_CONFIDENCE_THRESHOLD } from "../types";
import type { DetectedField, DetectionResponse, FieldType } from "../types";

const fields = new Map<string, DetectedField>();
const elementsById = new Map<string, FormElement>();
const processedElements = new WeakSet<Element>();

function inspect(root: ParentNode = document): void {
  for (const element of findFormElements(root)) {
    inspectElement(element);
  }
}

function inspectElement(element: Element): void {
  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) return;
  if (processedElements.has(element)) return;
  processedElements.add(element);
  const detected = detectField(element);
  fields.set(detected.elementId, detected);
  elementsById.set(detected.elementId, element);
}

function inspectAddedNodes(nodes: NodeList): void {
  for (const node of Array.from(nodes)) {
    if (!(node instanceof Element)) continue;
    if (node.matches("input, textarea, select")) inspectElement(node);
    else inspect(node);
  }
}

function isFillMessage(message: unknown): message is { type: "FILL_FIELD" | "FILL_KNOWN_FIELDS"; elementId?: string; fieldType?: FieldType; valueId?: string } {
  if (typeof message !== "object" || message === null || !("type" in message)) return false;
  return message.type === "FILL_FIELD" || message.type === "FILL_KNOWN_FIELDS";
}

type FillResult = { filled: true } | { filled: false; error: "ELEMENT_NOT_FOUND" | "INVALID_ELEMENT" | "NO_VALUE" };

function isFormElement(element: Element | null): element is FormElement {
  return element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement;
}

function isEligibleForMassFill(field: DetectedField): boolean {
  const [availableValue] = field.availableValues;
  return field.fieldType !== "UNKNOWN"
    && field.confidence >= MASS_FILL_CONFIDENCE_THRESHOLD
    && field.availableValueCount === 1
    && field.availableValues.length === 1
    && Boolean(availableValue?.value.trim());
}

async function fillElement(elementId: string, fieldType: FieldType, valueId?: string): Promise<FillResult> {
  const detectedField = fields.get(elementId);
  if (!detectedField) return { filled: false, error: "ELEMENT_NOT_FOUND" };
  if (detectedField.fieldType === "UNKNOWN" || detectedField.fieldType !== fieldType) {
    return { filled: false, error: "INVALID_ELEMENT" };
  }
  const element = elementsById.get(elementId);
  if (!element || !element.isConnected) return { filled: false, error: "ELEMENT_NOT_FOUND" };
  if (!isFormElement(element) || element.disabled) return { filled: false, error: "INVALID_ELEMENT" };
  const value = await resolveFieldValue(fieldType, valueId);
  if (!value) return { filled: false, error: "NO_VALUE" };
  element.value = value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  return { filled: true };
}

type FormElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

inspect();

new MutationObserver((mutations) => {
  for (const mutation of mutations) inspectAddedNodes(mutation.addedNodes);
}).observe(document.documentElement, { childList: true, subtree: true });

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (typeof message === "object" && message !== null && "type" in message && message.type === "GET_DETECTED_FIELDS") {
    inspect();
    void addValueAvailability(Array.from(fields.values())).then((availableFields) => {
      const response: DetectionResponse = { fields: availableFields };
      sendResponse(response);
    });
    return true;
  }
  if (isFillMessage(message)) {
    inspect();
    if (message.type === "FILL_FIELD" && message.elementId && message.fieldType) {
      void fillElement(message.elementId, message.fieldType, message.valueId).then((result) => sendResponse(result));
      return true;
    }
    if (message.type === "FILL_KNOWN_FIELDS") {
      void addValueAvailability(Array.from(fields.values())).then(async (availableFields) => {
        const fillable = availableFields.filter(isEligibleForMassFill);
        const results = await Promise.all(fillable.map((field) => fillElement(field.elementId, field.fieldType, field.availableValues[0].id)));
        sendResponse({ filledCount: results.filter((result) => result.filled).length });
      });
      return true;
    }
  }
  return false;
});
