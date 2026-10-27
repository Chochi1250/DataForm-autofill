import "./popup.css";
import { MASS_FILL_CONFIDENCE_THRESHOLD } from "../types";
import type { DetectedField, DetectionResponse, FieldType } from "../types";

const status = document.querySelector<HTMLParagraphElement>("#status");
const list = document.querySelector<HTMLUListElement>("#field-list");
const fillKnown = document.querySelector<HTMLButtonElement>("#fill-known");
let detectedFields: DetectedField[] = [];

interface FieldGroup {
  key: string;
  fieldType: FieldType;
  confidence: number;
  elements: DetectedField[];
  primaryField: DetectedField;
}

function isEligibleForMassFill(field: DetectedField): boolean {
  return field.fieldType !== "UNKNOWN"
    && field.confidence >= MASS_FILL_CONFIDENCE_THRESHOLD
    && field.availableValueCount === 1
    && field.availableValues.length === 1
    && Boolean(field.availableValues[0]?.value.trim());
}

function displayName(field: DetectedField): string {
  return field.fieldType.toLowerCase().replaceAll("_", " ");
}

function confidenceClass(confidence: number): string {
  if (confidence >= 0.8) return "high";
  if (confidence >= 0.5) return "medium";
  return "low";
}

function groupFields(fields: DetectedField[]): FieldGroup[] {
  // 1. Desduplicar elementos con el mismo data-jobform-element-id
  const seenIds = new Set<string>();
  const uniqueFields: DetectedField[] = [];
  for (const field of fields) {
    if (!seenIds.has(field.elementId)) {
      seenIds.add(field.elementId);
      uniqueFields.push(field);
    }
  }

  // 2. Agrupar campos por selector / tipo
  const groups = new Map<string, FieldGroup>();
  for (const field of uniqueFields) {
    const key = field.fieldType;
    const existing = groups.get(key);
    if (existing) {
      existing.elements.push(field);
      if (field.confidence > existing.confidence) {
        existing.confidence = field.confidence;
      }
    } else {
      groups.set(key, {
        key,
        fieldType: field.fieldType,
        confidence: field.confidence,
        elements: [field],
        primaryField: field,
      });
    }
  }

  return Array.from(groups.values());
}

function render(fields: DetectedField[]): void {
  if (!status || !list) return;
  detectedFields = fields;
  const visibleFields = fields.filter((field) => field.fieldType !== "UNKNOWN");
  if (fillKnown) fillKnown.disabled = !fields.some(isEligibleForMassFill);

  if (visibleFields.length === 0) {
    status.textContent = "No se reconocieron campos compatibles en esta página.";
  } else {
    status.textContent = `${visibleFields.length} campos reconocidos (${fields.length} detectados)`;
  }

  const groups = groupFields(visibleFields);

  list.replaceChildren(...groups.map((group) => {
    const field = group.primaryField;
    const count = group.elements.length;
    const item = document.createElement("li");
    item.className = `field ${confidenceClass(group.confidence)}`;
    item.dataset.elementId = field.elementId;

    const header = document.createElement("div");
    header.className = "field-header";

    const fieldName = document.createElement("span");
    fieldName.className = "field-name";
    fieldName.textContent = count > 1 ? `${displayName(field)} (x${count})` : displayName(field);

    const confidence = document.createElement("span");
    confidence.className = "confidence";
    confidence.textContent = `Confidence: ${Math.round(group.confidence * 100)}%`;

    header.append(fieldName, confidence);

    const trace = document.createElement("span");
    trace.className = "trace";
    if (count === 1) {
      const traceParts = [field.metadata.name && `name=${field.metadata.name}`, field.metadata.id && `id=${field.metadata.id}`].filter(Boolean);
      trace.textContent = traceParts.length > 0 ? traceParts.join(" · ") : `element=${field.elementId}`;
    } else {
      trace.textContent = group.elements.map((e, idx) => {
        const parts = [e.metadata.name && `name=${e.metadata.name}`, e.metadata.id && `id=${e.metadata.id}`].filter(Boolean);
        return `#${idx + 1}: ${parts.length > 0 ? parts.join(" ") : e.elementId}`;
      }).join(" · ");
    }

    item.append(header, trace);

    const incidencesBar = document.createElement("div");
    incidencesBar.className = "incidences-bar";

    if (count === 1) {
      const focusBtn = document.createElement("button");
      focusBtn.type = "button";
      focusBtn.className = "focus-btn";
      focusBtn.dataset.elementId = field.elementId;
      focusBtn.title = "Enfocar y desplazar hacia este campo en la página";
      focusBtn.textContent = "📍 Ver en página";
      incidencesBar.append(focusBtn);
    } else {
      const label = document.createElement("span");
      label.className = "incidences-label";
      label.textContent = "Incidencias:";
      incidencesBar.append(label);

      group.elements.forEach((elem, idx) => {
        const focusBtn = document.createElement("button");
        focusBtn.type = "button";
        focusBtn.className = "focus-btn";
        focusBtn.dataset.elementId = elem.elementId;
        focusBtn.title = `Ir a la incidencia #${idx + 1} (${elem.metadata.name || elem.elementId})`;
        focusBtn.textContent = `📍 #${idx + 1}`;
        incidencesBar.append(focusBtn);
      });
    }

    item.append(incidencesBar);

    const elementIdsAttr = group.elements.map((e) => e.elementId).join(",");
    if (field.availableValueCount === 1 && field.fieldType !== "UNKNOWN") {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "fill-field";
      button.dataset.elementIds = elementIdsAttr;
      button.dataset.elementId = field.elementId;
      button.dataset.fieldType = field.fieldType;
      button.dataset.valueId = field.availableValues[0].id;
      button.textContent = count > 1 ? `Fill (${count})` : "Fill";
      item.append(button);
    } else if (field.availableValueCount > 1 && field.fieldType !== "UNKNOWN") {
      const selection = document.createElement("select");
      selection.className = "value-selection";
      selection.dataset.elementId = field.elementId;
      selection.dataset.fieldType = field.fieldType;
      for (const available of field.availableValues) {
        const option = document.createElement("option");
        option.value = available.id;
        option.textContent = available.label;
        selection.append(option);
      }
      const button = document.createElement("button");
      button.type = "button";
      button.className = "fill-field";
      button.dataset.elementIds = elementIdsAttr;
      button.dataset.elementId = field.elementId;
      button.dataset.fieldType = field.fieldType;
      button.dataset.selection = "value-selection";
      button.textContent = count > 1 ? `Fill selected (${count})` : "Fill selected";
      item.append(selection, button);
    }
    return item;
  }));
}

async function sendFillMessage(message: { type: "FILL_FIELD" | "FILL_KNOWN_FIELDS"; elementId?: string; fieldType?: string; valueId?: string }): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) return;
  const result = await chrome.tabs.sendMessage(tab.id, message) as { filled?: boolean; filledCount?: number; error?: string };
  if (status && result.filledCount !== undefined) status.textContent = `${result.filledCount} fields filled`;
  if (status && result.filled !== undefined) status.textContent = result.filled ? "Field filled" : (result.error ?? "Could not fill field");
}

async function sendHighlightMessage(elementId: string, scroll = true): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  try {
    await chrome.tabs.sendMessage(tab.id, {
      type: "HIGHLIGHT_FIELD",
      elementId,
      scroll,
    });
  } catch {
    // Tab sin content script inyectado o página protegida
  }
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
  if (!(target instanceof HTMLElement)) return;

  if (target.classList.contains("focus-btn")) {
    const elementId = target.dataset.elementId;
    if (elementId) void sendHighlightMessage(elementId, true);
    return;
  }

  if (target.classList.contains("fill-field")) {
    const elementIds = (target.dataset.elementIds || target.dataset.elementId || "").split(",").filter(Boolean);
    const fieldType = target.dataset.fieldType;
    const item = target.closest(".field");
    const selection = item?.querySelector<HTMLSelectElement>(".value-selection");
    const valueId = selection?.value ?? target.dataset.valueId;
    if (elementIds.length > 0 && fieldType) {
      for (const elementId of elementIds) {
        void sendFillMessage({ type: "FILL_FIELD", elementId, fieldType, valueId });
      }
    }
    return;
  }

  const fieldItem = target.closest<HTMLLIElement>(".field");
  if (fieldItem && !target.closest("button, select")) {
    const elementId = fieldItem.dataset.elementId;
    if (elementId) void sendHighlightMessage(elementId, true);
  }
});

list?.addEventListener("mouseover", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const focusBtn = target.closest<HTMLButtonElement>(".focus-btn");
  if (focusBtn?.dataset.elementId) {
    void sendHighlightMessage(focusBtn.dataset.elementId, false);
    return;
  }

  const fieldItem = target.closest<HTMLLIElement>(".field");
  if (fieldItem?.dataset.elementId && !target.closest("button, select")) {
    void sendHighlightMessage(fieldItem.dataset.elementId, false);
  }
});

fillKnown?.addEventListener("click", () => {
  if (detectedFields.some(isEligibleForMassFill)) {
    void sendFillMessage({ type: "FILL_KNOWN_FIELDS" });
  }
});

void loadFields();
