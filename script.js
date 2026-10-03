/* Best Friends — small interactions, no dependencies. */

const QUOTES = [
  {
    text: "A friend is someone who knows the song in your heart and sings it back to you when you have forgotten the words.",
    author: "Donna Roberts"
  },
  {
    text: "Friendship is born at that moment when one person says to another, “What! You too? I thought I was the only one.”",
    author: "C. S. Lewis"
  },
  {
    text: "There is nothing on this earth more to be prized than true friendship.",
    author: "Thomas Aquinas"
  },
  {
    text: "A real friend is one who walks in when the rest of the world walks out.",
    author: "Walter Winchell"
  },
  {
    text: "Good friends are like stars. You don't always see them, but you know they're always there.",
    author: "Unknown"
  },
  {
    text: "Friendship is not a big thing. It's a million little things.",
    author: "Unknown"
  }
];

const NOTES_KEY = "best-friends:notes";
const IDEAS_KEY = "best-friends:ideas";
const QUOTE_INTERVAL = 9000;

const quoteCard = document.querySelector(".quote-card");
const quoteText = document.getElementById("quote-text");
const quoteAuthor = document.getElementById("quote-author");
const quoteNext = document.getElementById("quote-next");

const noteForm = document.getElementById("note-form");
const noteName = document.getElementById("note-name");
const noteText = document.getElementById("note-text");
const noteList = document.getElementById("note-list");
const noteClear = document.getElementById("note-clear");
const formStatus = document.getElementById("form-status");
const emptyState = document.getElementById("empty-state");

const checklist = document.getElementById("checklist");
const progressFill = document.getElementById("progress-fill");
const progressCount = document.getElementById("progress-count");
const progressTotal = document.getElementById("progress-total");

/* ---------- Quotes ---------- */

let quoteIndex = Math.floor(Math.random() * QUOTES.length);
let quoteTimer = null;

function renderQuote() {
  const quote = QUOTES[quoteIndex];
  quoteText.textContent = quote.text;
  quoteAuthor.textContent = `— ${quote.author}`;
}

function showQuote(index) {
  quoteIndex = (index + QUOTES.length) % QUOTES.length;
  quoteCard.classList.add("is-fading");

  window.setTimeout(() => {
    renderQuote();
    quoteCard.classList.remove("is-fading");
  }, 200);
}

function startQuoteRotation() {
  if (quoteTimer !== null) {
    window.clearInterval(quoteTimer);
  }
  quoteTimer = window.setInterval(() => showQuote(quoteIndex + 1), QUOTE_INTERVAL);
}

if (quoteText && quoteAuthor) {
  renderQuote();
  startQuoteRotation();

  if (quoteNext) {
    quoteNext.addEventListener("click", () => {
      showQuote(quoteIndex + 1);
      startQuoteRotation();
    });
  }
}

/* ---------- Ideas checklist ---------- */

function readJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    /* Storage may be unavailable (private mode). The page still works. */
  }
}

function updateProgress() {
  if (!checklist) return;

  const boxes = Array.from(checklist.querySelectorAll('input[type="checkbox"]'));
  const done = boxes.filter((box) => box.checked).length;
  const total = boxes.length;

  if (progressCount) progressCount.textContent = String(done);
  if (progressTotal) progressTotal.textContent = String(total);
  if (progressFill) {
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);
    progressFill.style.width = `${percent}%`;
  }
}

if (checklist) {
  const savedIdeas = readJSON(IDEAS_KEY, {});

  checklist.querySelectorAll('input[type="checkbox"]').forEach((box) => {
    const id = box.dataset.idea;
    if (savedIdeas[id]) box.checked = true;

    box.addEventListener("change", () => {
      const current = readJSON(IDEAS_KEY, {});
      current[id] = box.checked;
      writeJSON(IDEAS_KEY, current);
      updateProgress();
    });
  });

  updateProgress();
}

/* ---------- Note wall ---------- */

function loadNotes() {
  const notes = readJSON(NOTES_KEY, []);
  return Array.isArray(notes) ? notes : [];
}

function saveNotes(notes) {
  writeJSON(NOTES_KEY, notes);
}

function formatDate(timestamp) {
  try {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  } catch (error) {
    return "";
  }
}

function createNoteElement(note) {
  const item = document.createElement("li");
  item.className = "note";
  item.dataset.id = note.id;

  const text = document.createElement("p");
  text.className = "note-text";
  text.textContent = note.text;

  const meta = document.createElement("div");
  meta.className = "note-meta";

  const author = document.createElement("span");
  author.className = "note-author";
  author.textContent = `${note.name} · ${formatDate(note.createdAt)}`;

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "note-remove";
  remove.textContent = "Remove";
  remove.setAttribute("aria-label", `Remove note from ${note.name}`);

  meta.append(author, remove);
  item.append(text, meta);
  return item;
}

function renderNotes() {
  if (!noteList || !emptyState) return;

  const notes = loadNotes().slice().sort((a, b) => b.createdAt - a.createdAt);
  noteList.replaceChildren(...notes.map(createNoteElement));
  emptyState.hidden = notes.length > 0;
}

function setStatus(message) {
  if (!formStatus) return;
  formStatus.textContent = message;
  if (message) {
    window.setTimeout(() => {
      if (formStatus.textContent === message) formStatus.textContent = "";
    }, 3000);
  }
}

if (noteForm && noteName && noteText) {
  noteForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = noteName.value.trim();
    const text = noteText.value.trim();

    if (!name || !text) {
      setStatus("Add your name and a few kind words first.");
      return;
    }

    const notes = loadNotes();
    notes.push({
      id: `note-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      name,
      text,
      createdAt: Date.now()
    });

    saveNotes(notes);
    renderNotes();

    noteText.value = "";
    noteText.focus();
    setStatus("Pinned to the wall. Nice one.");
  });
}

if (noteList) {
  noteList.addEventListener("click", (event) => {
    const button = event.target.closest(".note-remove");
    if (!button) return;

    const item = button.closest(".note");
    if (!item) return;

    const remaining = loadNotes().filter((note) => note.id !== item.dataset.id);
    saveNotes(remaining);
    renderNotes();
    setStatus("Note removed.");
  });
}

if (noteClear) {
  noteClear.addEventListener("click", () => {
    if (loadNotes().length === 0) {
      setStatus("Nothing to clear yet.");
      return;
    }

    const confirmed = window.confirm("Remove every note from the wall?");
    if (!confirmed) return;

    saveNotes([]);
    renderNotes();
    setStatus("Wall cleared.");
  });
}

renderNotes();

/* ---------- Footer year ---------- */

const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = String(new Date().getFullYear());
}