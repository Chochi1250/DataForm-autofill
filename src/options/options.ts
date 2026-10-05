import "./options.css";
import { deleteAnswer, getProfile, getSavedAnswers, saveAnswer, saveProfile, updateAnswer } from "../storage/storage";
import { FIELD_TYPES, type FieldType, type Profile, type SavedAnswer } from "../types";

const form = document.querySelector<HTMLFormElement>("#profile-form");
const status = document.querySelector<HTMLParagraphElement>("#status");
const answerForm = document.querySelector<HTMLFormElement>("#answer-form");
const answerList = document.querySelector<HTMLUListElement>("#answer-list");
const answerStatus = document.querySelector<HTMLParagraphElement>("#answer-status");
const cancelAnswer = document.querySelector<HTMLButtonElement>("#cancel-answer");

const emptyProfile: Profile = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  city: "",
  country: "",
  linkedin: "",
};

function field(name: keyof Profile): HTMLInputElement | null {
  return form?.elements.namedItem(name) as HTMLInputElement | null;
}

function renderProfile(profile: Profile): void {
  for (const key of Object.keys(emptyProfile) as Array<keyof Profile>) {
    const input = field(key);
    if (input) input.value = profile[key];
  }
}

function readProfile(): Profile {
  return {
    firstName: field("firstName")?.value.trim() ?? "",
    lastName: field("lastName")?.value.trim() ?? "",
    email: field("email")?.value.trim() ?? "",
    phone: field("phone")?.value.trim() ?? "",
    city: field("city")?.value.trim() ?? "",
    country: field("country")?.value.trim() ?? "",
    linkedin: field("linkedin")?.value.trim() ?? "",
  };
}

async function loadProfile(): Promise<void> {
  renderProfile((await getProfile()) ?? emptyProfile);
}

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  void saveProfile(readProfile()).then(() => {
    if (status) status.textContent = "Profile saved.";
  }).catch(() => {
    if (status) status.textContent = "Could not save the profile.";
  });
});

void loadProfile().catch(() => {
  if (status) status.textContent = "Could not load the profile.";
});

function answerField(name: "id" | "fieldType" | "name" | "value"): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null {
  return answerForm?.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
}

function resetAnswerForm(): void {
  answerForm?.reset();
  const id = answerField("id");
  if (id) id.value = "";
  if (cancelAnswer) cancelAnswer.hidden = true;
}

function editAnswer(answer: SavedAnswer): void {
  const id = answerField("id");
  const fieldType = answerField("fieldType");
  const name = answerField("name");
  const value = answerField("value");
  if (!id || !fieldType || !name || !value) return;
  id.value = answer.id;
  fieldType.value = answer.fieldType;
  name.value = answer.name;
  value.value = answer.value;
  if (cancelAnswer) cancelAnswer.hidden = false;
  name.focus();
}

function renderAnswers(answers: SavedAnswer[]): void {
  if (!answerList) return;
  answerList.replaceChildren(...answers.map((answer) => {
    const item = document.createElement("li");
    item.className = "answer-item";
    item.dataset.answerId = answer.id;
    const type = document.createElement("span");
    type.className = "answer-type";
    type.textContent = answer.fieldType;
    const name = document.createElement("strong");
    name.textContent = answer.name;
    const value = document.createElement("span");
    value.className = "answer-value";
    value.textContent = answer.value;
    const actions = document.createElement("div");
    actions.className = "answer-actions";
    const edit = document.createElement("button");
    edit.type = "button";
    edit.dataset.action = "edit";
    edit.textContent = "Edit";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.dataset.action = "delete";
    remove.className = "delete";
    remove.textContent = "Delete";
    actions.append(edit, remove);
    item.append(type, name, value, actions);
    return item;
  }));
}

async function loadAnswers(): Promise<void> {
  renderAnswers(await getSavedAnswers());
}

answerForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const id = answerField("id")?.value.trim();
  const fieldType = answerField("fieldType")?.value;
  const name = answerField("name")?.value.trim();
  const value = answerField("value")?.value.trim();
  if (!fieldType || !FIELD_TYPES.includes(fieldType as FieldType) || !name || !value) return;
  const operation = id
    ? updateAnswer(id, { fieldType: fieldType as FieldType, name, value })
    : saveAnswer({ id: crypto.randomUUID(), fieldType: fieldType as FieldType, name, value });
  void operation.then(() => loadAnswers()).then(() => {
    resetAnswerForm();
    if (answerStatus) answerStatus.textContent = "Answer saved.";
  }).catch(() => {
    if (answerStatus) answerStatus.textContent = "Could not save the answer.";
  });
});

cancelAnswer?.addEventListener("click", resetAnswerForm);

answerList?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;
  const item = target.closest<HTMLLIElement>("[data-answer-id]");
  const id = item?.dataset.answerId;
  if (!id) return;
  if (target.dataset.action === "edit") {
    void getSavedAnswers().then((answers) => {
      const answer = answers.find((entry) => entry.id === id);
      if (answer) editAnswer(answer);
    });
  } else if (target.dataset.action === "delete") {
    void deleteAnswer(id).then(loadAnswers).then(() => {
      if (answerStatus) answerStatus.textContent = "Answer deleted.";
    });
  }
});

void loadAnswers().catch(() => {
  if (answerStatus) answerStatus.textContent = "Could not load saved answers.";
});
