import "./popup.css";
import { MASS_FILL_CONFIDENCE_THRESHOLD } from "../types";
import type { DetectedField, DetectionResponse, FieldType } from "../types";

const status = document.querySelector<HTMLParagraphElement>("#status");
const list = document.querySelector<HTMLUListElement>("#field-list");
const fillKnown = document.querySelector<HTMLButtonElement>("#fill-known");
const search = document.querySelector<HTMLInputElement>("#field-search");
const fieldSummary = document.querySelector<HTMLParagraphElement>("#field-summary");
const searchResult = document.querySelector<HTMLParagraphElement>("#search-result");
let detectedFields: DetectedField[] = [];
let searchQuery = "";
const expandedGroups = new Set<FieldType>();

interface FieldGroup {
  fieldType: FieldType;
  fields: DetectedField[];
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

function confidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return "High";
  if (confidence >= 0.5) return "Medium";
  return "Low";
}

function groupFields(fields: DetectedField[]): FieldGroup[] {
  const groups = new Map<FieldType, DetectedField[]>();
  for (const field of fields) {
    const group = groups.get(field.fieldType);
    if (group) group.push(field);
    else groups.set(field.fieldType, [field]);
  }
  return Array.from(groups, ([fieldType, group]) => ({ fieldType, fields: group }));
}

function matchesSearch(field: DetectedField, query: string): boolean {
  const searchableText = [
    displayName(field),
    field.elementId,
    field.metadata.name,
    field.metadata.id,
    field.metadata.label,
    field.metadata.placeholder,
    field.metadata.ariaLabel,
    ...field.availableValues.map((available) => available.label),
  ].join(" ").toLocaleLowerCase();
  return searchableText.includes(query.toLocaleLowerCase());
}

function renderAppearance(field: DetectedField, occurrence: number): HTMLLIElement {
  const item = document.createElement("li");
  item.className = `field ${confidenceClass(field.confidence)}`;
  item.dataset.elementId = field.elementId;

  const header = document.createElement("div");
  header.className = "field-header";

  const title = document.createElement("div");
  title.className = "field-title";

  const occurrenceLabel = document.createElement("span");
  occurrenceLabel.className = "occurrence-label";
  occurrenceLabel.textContent = `Appearance ${occurrence}`;

  const fieldName = document.createElement("span");
  fieldName.className = "field-name";
  fieldName.textContent = displayName(field);
  title.append(occurrenceLabel, fieldName);

  const confidence = document.createElement("span");
  confidence.className = "confidence";
  confidence.textContent = `${confidenceLabel(field.confidence)} · ${Math.round(field.confidence * 100)}%`;
  header.append(title, confidence);

  const trace = document.createElement("span");
  trace.className = "trace";
  const traceParts = [field.metadata.name && `name=${field.metadata.name}`, field.metadata.id && `id=${field.metadata.id}`].filter(Boolean);
  trace.textContent = traceParts.length > 0 ? traceParts.join(" · ") : `element=${field.elementId}`;
  item.append(header, trace);

  const valueSummary = document.createElement("span");
  valueSummary.className = `value-summary ${field.availableValueCount > 0 ? "is-available" : "is-unavailable"}`;
  if (field.availableValueCount === 1) {
    valueSummary.textContent = `Available value: ${field.availableValues[0]?.label ?? "saved value"}`;
  } else if (field.availableValueCount > 1) {
    valueSummary.textContent = `${field.availableValueCount} alternative values available`;
  } else {
    valueSummary.textContent = "No saved value available";
  }
  item.append(valueSummary);

  const actions = document.createElement("div");
  actions.className = "field-actions";
  const focusBtn = document.createElement("button");
  focusBtn.type = "button";
  focusBtn.className = "focus-btn button button-ghost";
  focusBtn.dataset.elementId = field.elementId;
  focusBtn.title = "Enfocar y desplazar hacia este campo en la página";
  focusBtn.textContent = "Locate";
  actions.append(focusBtn);

  if (field.availableValueCount === 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "fill-field button button-secondary";
    button.dataset.elementId = field.elementId;
    button.dataset.fieldType = field.fieldType;
    button.dataset.valueId = field.availableValues[0]?.id;
    button.textContent = "Fill";
    actions.append(button);
  } else if (field.availableValueCount > 1) {
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
    button.className = "fill-field button button-secondary";
    button.dataset.elementId = field.elementId;
    button.dataset.fieldType = field.fieldType;
    button.dataset.selection = "value-selection";
    button.textContent = "Fill selected";
    actions.append(selection, button);
  }
  item.append(actions);
  return item;
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
  const matchingGroups = groups.map((group) => ({
    ...group,
    matchingFields: searchQuery ? group.fields.filter((field) => matchesSearch(field, searchQuery)) : group.fields,
  })).filter((group) => group.matchingFields.length > 0);
  const matchingAppearances = matchingGroups.reduce((total, group) => total + group.matchingFields.length, 0);

  if (fieldSummary) fieldSummary.textContent = `${groups.length} field groups · ${visibleFields.length} appearances`;
  if (searchResult) {
    searchResult.textContent = searchQuery
      ? `${matchingAppearances} matching ${matchingAppearances === 1 ? "appearance" : "appearances"} in ${matchingGroups.length} ${matchingGroups.length === 1 ? "group" : "groups"}`
      : "Expand a group to review each appearance.";
  }

  if (searchQuery) matchingGroups.forEach((group) => expandedGroups.add(group.fieldType));

  list.replaceChildren(...matchingGroups.map((group) => {
    const groupItem = document.createElement("li");
    groupItem.className = "field-group";
    const isExpanded = expandedGroups.has(group.fieldType);
    const appearancesId = `group-${group.fieldType.toLowerCase()}`;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "group-toggle";
    toggle.dataset.fieldType = group.fieldType;
    toggle.setAttribute("aria-expanded", String(isExpanded));
    toggle.setAttribute("aria-controls", appearancesId);

    const groupTitle = document.createElement("span");
    groupTitle.className = "group-title";
    groupTitle.textContent = displayName(group.fields[0]);
    const groupCount = document.createElement("span");
    groupCount.className = "group-count";
    groupCount.textContent = `${group.fields.length} ${group.fields.length === 1 ? "appearance" : "appearances"}`;
    toggle.append(groupTitle, groupCount);
    groupItem.append(toggle);

    if (searchQuery && group.matchingFields.length !== group.fields.length) {
      const matchCount = document.createElement("span");
      matchCount.className = "group-match-count";
      matchCount.textContent = `${group.matchingFields.length} match${group.matchingFields.length === 1 ? "" : "es"}`;
      groupItem.append(matchCount);
    }

    const appearances = document.createElement("ul");
    appearances.id = appearancesId;
    appearances.className = "group-appearances";
    appearances.hidden = !isExpanded;
    appearances.replaceChildren(...group.matchingFields.map((field) => renderAppearance(field, group.fields.indexOf(field) + 1)));
    groupItem.append(appearances);
    return groupItem;
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

  const groupToggle = target.closest<HTMLButtonElement>(".group-toggle");
  if (groupToggle) {
    const fieldType = groupToggle.dataset.fieldType as FieldType | undefined;
    if (fieldType) {
      if (expandedGroups.has(fieldType)) expandedGroups.delete(fieldType);
      else expandedGroups.add(fieldType);
      render(detectedFields);
    }
    return;
  }

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

search?.addEventListener("input", () => {
  searchQuery = search.value.trim();
  render(detectedFields);
  // After rendering, if there is a search query, locate the first matching field
  if (searchQuery) {
    const firstMatch = detectedFields.find((field) => matchesSearch(field, searchQuery));
    if (firstMatch) {
      void sendHighlightMessage(firstMatch.elementId, true);
    }
  }
});

void loadFields();
