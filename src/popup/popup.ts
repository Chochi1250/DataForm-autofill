import "./popup.css";
import type { DetectedField, DetectionResponse } from "../types";

const status = document.querySelector<HTMLParagraphElement>("#status");
const list = document.querySelector<HTMLUListElement>("#field-list");
const fillKnown = document.querySelector<HTMLButtonElement>("#fill-known");
let detectedFields: DetectedField[] = [];

function displayName(field: DetectedField): string {
  return field.fieldType.toLowerCase().replaceAll("_", " ");
}

function confidenceClass(confidence: number): string {
  if (confidence >= 0.8) return "high";
  if (confidence >= 0.5) return "medium";
  return "low";
}

function render(fields: DetectedField[]): void {
  if (!status || !list) return;
  detectedFields = fields;
  if (fillKnown) fillKnown.disabled = !fields.some((field) => field.valueAvailable && field.fieldType !== "UNKNOWN");
  status.textContent = `${fields.length} field${fields.length === 1 ? "" : "s"} detected`;
  list.replaceChildren(...fields.map((field) => {
    const item = document.createElement("li");
    item.className = `field ${confidenceClass(field.confidence)}`;
    const fieldName = document.createElement("span");
    fieldName.className = "field-name";
    fieldName.textContent = displayName(field);
    const confidence = document.createElement("span");
    confidence.className = "confidence";
    confidence.textContent = `Confidence: ${Math.round(field.confidence * 100)}%`;
    item.append(fieldName, confidence);
    if (field.valueAvailable && field.fieldType !== "UNKNOWN") {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "fill-field";
      button.dataset.elementId = field.elementId;
      button.dataset.fieldType = field.fieldType;
      button.textContent = "Fill";
      item.append(button);
    }
    return item;
  }));
}

async function sendFillMessage(message: { type: "FILL_FIELD" | "FILL_KNOWN_FIELDS"; elementId?: string; fieldType?: string }): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) return;
  const result = await chrome.tabs.sendMessage(tab.id, message) as { filled?: boolean; filledCount?: number };
  if (status && result.filledCount !== undefined) status.textContent = `${result.filledCount} fields filled`;
  if (status && result.filled !== undefined) status.textContent = result.filled ? "Field filled" : "No value available";
}

async function loadFields(): Promise<void> {
  if (!status) return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) { status.textContent = "No active tab found."; return; }
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: "GET_DETECTED_FIELDS" }) as DetectionResponse;
    render(response.fields);
  } catch {
    status.textContent = "Open a regular web page and try again.";
  }
}

list?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement) || !target.classList.contains("fill-field")) return;
  const elementId = target.dataset.elementId;
  const fieldType = target.dataset.fieldType;
  if (elementId && fieldType) void sendFillMessage({ type: "FILL_FIELD", elementId, fieldType });
});

fillKnown?.addEventListener("click", () => {
  if (detectedFields.some((field) => field.valueAvailable && field.fieldType !== "UNKNOWN")) {
    void sendFillMessage({ type: "FILL_KNOWN_FIELDS" });
  }
});

void loadFields();
