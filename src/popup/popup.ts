import "./popup.css";
import type { DetectedField, DetectionResponse } from "../types";

const status = document.querySelector<HTMLParagraphElement>("#status");
const list = document.querySelector<HTMLUListElement>("#field-list");

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
  status.textContent = `${fields.length} field${fields.length === 1 ? "" : "s"} detected`;
  list.replaceChildren(...fields.map((field) => {
    const item = document.createElement("li");
    item.className = `field ${confidenceClass(field.confidence)}`;
    item.innerHTML = `<span class="field-name"></span><span class="confidence"></span>`;
    item.querySelector(".field-name")!.textContent = displayName(field);
    item.querySelector(".confidence")!.textContent = `Confidence: ${Math.round(field.confidence * 100)}%`;
    return item;
  }));
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

void loadFields();
