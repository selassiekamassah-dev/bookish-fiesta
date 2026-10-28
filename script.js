// Undo and Redo Notepad
// Two stacks are used:
//   document stack: the lines of the document (newest line on top)
//   redo stack:     the lines that were undone (last undone line on top)
// Each stack is an array of fixed size plus one number, "top",
// which is the index of the top item (-1 when the stack is empty).

const CAPACITY = 10;
const STORE_KEY = "undo-notepad-v1";
const SAMPLE_LINES = ["Dear Sir,", "I wish to apply", "for the post of Teaching Assistant."];

// ---------- Stack operations ----------
function createStack() {
  return { items: new Array(CAPACITY).fill(""), top: -1 };
}

function isEmpty(stack) { return stack.top === -1; }
function isFull(stack)  { return stack.top === CAPACITY - 1; }

// Push: put an item on top. Returns false if the stack is full.
function push(stack, item) {
  if (isFull(stack)) return false;
  stack.top++;
  stack.items[stack.top] = item;
  return true;
}

// Pop: take the top item off. Returns null if the stack is empty.
function pop(stack) {
  if (isEmpty(stack)) return null;
  const item = stack.items[stack.top];
  stack.items[stack.top] = "";
  stack.top--;
  return item;
}

// Peek: look at the top item without removing it.
function peek(stack) {
  return isEmpty(stack) ? null : stack.items[stack.top];
}

function clearStack(stack) {
  for (let i = 0; i <= stack.top; i++) stack.items[i] = "";
  stack.top = -1;
}

// Read a stack from the top down to the bottom.
function topDown(stack) {
  const list = [];
  for (let i = stack.top; i >= 0; i--) list.push(stack.items[i]);
  return list;
}

// ---------- Editor operations ----------
let documentStack = createStack();
let redoStack = createStack();

function loadSample() {
  documentStack = createStack();
  redoStack = createStack();
  for (let i = 0; i < SAMPLE_LINES.length; i++) push(documentStack, SAMPLE_LINES[i]);
}

// ---------- Saving ----------
function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ documentStack, redoStack }));
  } catch (e) { /* storage not available, app still works */ }
}

function validStack(s) {
  return s && Array.isArray(s.items) && s.items.length === CAPACITY &&
    s.items.every(x => typeof x === "string") &&
    Number.isInteger(s.top) && s.top >= -1 && s.top < CAPACITY;
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    if (!validStack(d.documentStack) || !validStack(d.redoStack)) return false;
    documentStack = { items: d.documentStack.items.slice(), top: d.documentStack.top };
    redoStack = { items: d.redoStack.items.slice(), top: d.redoStack.top };
    return true;
  } catch (e) { return false; }
}

// ---------- Display ----------
const $ = id => document.getElementById(id);

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderStack(listId, countId, stack, emptyText) {
  const list = $(listId);
  list.textContent = "";
  const lines = topDown(stack);
  $(countId).textContent = lines.length + " of " + CAPACITY + " lines";

  if (lines.length === 0) {
    list.appendChild(make("li", "empty", emptyText));
    return;
  }
  for (let i = 0; i < lines.length; i++) {
    const li = make("li", i === 0 ? "block is-top" : "block");
    li.appendChild(make("span", "block-text", lines[i]));
    if (i === 0) li.appendChild(make("span", "top-tag", "Top"));
    list.appendChild(li);
  }
}

function update(message) {
  save();
  renderStack("doc-stack", "doc-count", documentStack, "The document is empty.");
  renderStack("redo-stack", "redo-count", redoStack, "Nothing to redo.");
  $("undo-btn").disabled = isEmpty(documentStack);
  $("redo-btn").disabled = isEmpty(redoStack);
  if (message !== undefined) $("message").textContent = message;
}

// ---------- Events ----------
$("add-form").addEventListener("submit", e => {
  e.preventDefault();
  const input = $("line-input");
  const line = input.value.trim();

  if (line === "") {
    $("message").textContent = "Please type a line of text first.";
    input.focus();
    return;
  }
  if (isFull(documentStack)) {
    $("message").textContent = "The document is full (" + CAPACITY + " lines). Undo a line to make space.";
    return;
  }

  push(documentStack, line);
  const hadRedo = !isEmpty(redoStack);
  clearStack(redoStack);          // a new line ends the redo history
  input.value = "";
  update(hadRedo ? "Line added. The undone lines were discarded." : "Line added.");
  input.focus();
});

$("undo-btn").addEventListener("click", () => {
  const line = pop(documentStack);
  if (line === null) { update("Nothing to undo."); return; }
  push(redoStack, line);
  update("Undid: " + line);
});

$("redo-btn").addEventListener("click", () => {
  const line = pop(redoStack);
  if (line === null) { update("Nothing to redo."); return; }
  push(documentStack, line);
  update("Redid: " + line);
});

$("sample-btn").addEventListener("click", () => {
  loadSample();
  update("Sample document restored.");
});

$("clear-btn").addEventListener("click", () => {
  clearStack(documentStack);
  clearStack(redoStack);
  update("Both stacks are now empty.");
});

// ---------- Start ----------
if (!load()) loadSample();
update("");
