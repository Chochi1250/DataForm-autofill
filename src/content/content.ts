import { detectField, findFormElements } from "./detector";
import type { DetectedField, DetectionResponse } from "../types";

const fields = new Map<string, DetectedField>();
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
}

function inspectAddedNodes(nodes: NodeList): void {
  for (const node of Array.from(nodes)) {
    if (!(node instanceof Element)) continue;
    if (node.matches("input, textarea, select")) inspectElement(node);
    else inspect(node);
  }
}

inspect();

new MutationObserver((mutations) => {
  for (const mutation of mutations) inspectAddedNodes(mutation.addedNodes);
}).observe(document.documentElement, { childList: true, subtree: true });

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (typeof message === "object" && message !== null && "type" in message && message.type === "GET_DETECTED_FIELDS") {
    inspect();
    const response: DetectionResponse = { fields: Array.from(fields.values()) };
    sendResponse(response);
  }
  return false;
});
