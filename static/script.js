const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const messages = document.getElementById("messages");
const welcome = document.getElementById("welcome");
const sendBtn = document.getElementById("sendBtn");
const charCount = document.getElementById("charCount");
const errorMessage = document.getElementById("errorMessage");
const newChatBtn = document.getElementById("newChatBtn");
const themeBtn = document.getElementById("themeBtn");

let isSending = false;

// ---------------- ERROR HANDLING ----------------

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.add("visible");
}

function clearError() {
  errorMessage.textContent = "";
  errorMessage.classList.remove("visible");
}

// ---------------- SCROLL ANIMATION ----------------

function scrollToBottom() {
  requestAnimationFrame(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth"
    });
  });
}

// ---------------- DELAY HELPER ----------------

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------------- ADD CHAT MESSAGE ----------------

function addMessage(type, text, details = {}) {
  welcome.hidden = true;

  const row = document.createElement("div");
  row.className = `message ${type}`;

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = type === "user" ? "You" : "✦";

  const content = document.createElement("div");
  content.className = "message-content";

  const label = document.createElement("div");
  label.className = "message-label";
  label.textContent =
    type === "user" ? "YOU" : "FAQ ASSISTANT";

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.textContent = text;

  content.append(label, bubble);

  if (type === "bot" && details.matchedQuestion) {
    const info = document.createElement("div");
    info.className = "match-info";

    const matchLabel = document.createElement("span");
    matchLabel.textContent = "Matched FAQ: ";

    const question = document.createElement("strong");
    question.textContent = details.matchedQuestion;

    const confidence = document.createElement("span");
    confidence.textContent =
      ` · Similarity: ${details.confidence}%`;

    info.append(matchLabel, question, confidence);
    content.appendChild(info);

  } else if (type === "bot" && details.found === false) {
    const info = document.createElement("div");
    info.className = "match-info";
    info.textContent =
      "No sufficiently similar FAQ was found.";

    content.appendChild(info);
  }

  row.append(avatar, content);
  messages.appendChild(row);

  scrollToBottom();

  return row;
}

// ---------------- THINKING ANIMATION ----------------

function addTypingIndicator() {
  welcome.hidden = true;

  const row = document.createElement("div");
  row.className = "message thinking-message";
  row.id = "typingIndicator";
  row.setAttribute("aria-live", "polite");

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = "✦";

  const content = document.createElement("div");
  content.className = "message-content";

  const label = document.createElement("div");
  label.className = "message-label";
  label.textContent = "FAQ ASSISTANT";

  const bubble = document.createElement("div");
  bubble.className = "message-bubble thinking-bubble";

  const thinkingText = document.createElement("span");
  thinkingText.className = "thinking-text";
  thinkingText.textContent = "Thinking";

  const typing = document.createElement("div");
  typing.className = "typing";
  typing.setAttribute("aria-label", "Searching FAQs");

  for (let i = 0; i < 3; i++) {
    const dot = document.createElement("span");
    typing.appendChild(dot);
  }

  bubble.append(thinkingText, typing);
  content.append(label, bubble);
  row.append(avatar, content);

  messages.appendChild(row);
  scrollToBottom();

  return row;
}

// ---------------- ANIMATED ANSWER ----------------

async function revealAnswer(text, details = {}) {
  welcome.hidden = true;

  const row = document.createElement("div");
  row.className = "message bot answer-reveal";

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = "✦";

  const content = document.createElement("div");
  content.className = "message-content";

  const label = document.createElement("div");
  label.className = "message-label";
  label.textContent = "FAQ ASSISTANT";

  const bubble = document.createElement("div");
  bubble.className = "message-bubble answer-typing";
  bubble.setAttribute("aria-live", "polite");

  content.append(label, bubble);

  // Matched FAQ information
  let info = null;

  if (details.matchedQuestion) {
    info = document.createElement("div");
    info.className = "match-info";

    const matchLabel = document.createElement("span");
    matchLabel.textContent = "Matched FAQ: ";

    const question = document.createElement("strong");
    question.textContent = details.matchedQuestion;

    const confidence = document.createElement("span");
    confidence.textContent =
      ` · Similarity: ${details.confidence}%`;

    info.append(matchLabel, question, confidence);

  } else if (details.found === false) {
    info = document.createElement("div");
    info.className = "match-info";
    info.textContent =
      "No sufficiently similar FAQ was found.";
  }

  row.append(avatar, content);
  messages.appendChild(row);
  scrollToBottom();

  // Reveal the answer character by character
  const answer = String(text || "Sorry, no answer was returned.");

  for (let i = 0; i < answer.length; i++) {
    bubble.textContent += answer[i];

    // Faster rendering for longer answers
    if (i % 3 === 0) {
      scrollToBottom();
      await sleep(12);
    }
  }

  if (info) {
    content.appendChild(info);
  }

  scrollToBottom();
}

// ---------------- ASK QUESTION ----------------

async function askQuestion(question) {
  if (isSending) return;

  const message = String(question || "").trim();

  if (!message) {
    showError("Please enter a question first.");
    messageInput.focus();
    return;
  }

  if (message.length > 500) {
    showError("Your question must be 500 characters or fewer.");
    return;
  }

  clearError();

  isSending = true;
  sendBtn.disabled = true;
  messageInput.disabled = true;

  addMessage("user", message);

  messageInput.value = "";
  updateCharCount();
  autoResize();

  const typing = addTypingIndicator();
  const startTime = Date.now();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "The request could not be completed."
      );
    }

    // Keep the thinking animation visible for at least 1 second
    const elapsed = Date.now() - startTime;

    if (elapsed < 1000) {
      await sleep(1000 - elapsed);
    }

    typing.remove();

    await revealAnswer(data.answer, {
      matchedQuestion: data.matchedQuestion,
      confidence: data.confidence,
      found: data.found
    });

  } catch (error) {
    typing.remove();

    addMessage(
      "bot",
      error.message ||
        "Unable to connect to the chatbot. Please try again."
    );

    console.error("Chatbot error:", error);

  } finally {
    isSending = false;
    sendBtn.disabled = false;
    messageInput.disabled = false;
    messageInput.focus();
  }
}

// ---------------- CHARACTER COUNTER ----------------

function updateCharCount() {
  charCount.textContent =
    `${messageInput.value.length}/500`;
}

// ---------------- AUTO-RESIZE INPUT ----------------

function autoResize() {
  messageInput.style.height = "auto";

  messageInput.style.height =
    `${Math.min(messageInput.scrollHeight, 130)}px`;
}

// ---------------- CHAT FORM ----------------

chatForm.addEventListener("submit", event => {
  event.preventDefault();
  askQuestion(messageInput.value);
});

// ---------------- INPUT EVENTS ----------------

messageInput.addEventListener("input", () => {
  updateCharCount();
  autoResize();
  clearError();
});

messageInput.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

// ---------------- QUICK QUESTIONS ----------------

document.querySelectorAll("[data-question]").forEach(button => {
  button.addEventListener("click", () => {
    askQuestion(button.dataset.question);
  });
});

// ---------------- NEW CHAT ----------------

newChatBtn.addEventListener("click", () => {
  if (isSending) return;

  messages.replaceChildren();
  welcome.hidden = false;

  messageInput.value = "";

  updateCharCount();
  autoResize();
  clearError();

  messageInput.focus();
});

// ---------------- THEME TOGGLE ----------------

themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("light");

  const isLight =
    document.body.classList.contains("light");

  themeBtn.textContent = isLight ? "☾" : "☼";

  themeBtn.setAttribute(
    "aria-label",
    isLight
      ? "Switch to dark theme"
      : "Switch to light theme"
  );

  localStorage.setItem(
    "faq-theme",
    isLight ? "light" : "dark"
  );
});

// Restore saved theme
if (localStorage.getItem("faq-theme") === "light") {
  document.body.classList.add("light");
  themeBtn.textContent = "☾";
  themeBtn.setAttribute("aria-label", "Switch to dark theme");
} else {
  themeBtn.textContent = "☼";
  themeBtn.setAttribute("aria-label", "Switch to light theme");
}

// ---------------- INITIALIZE ----------------

updateCharCount();
autoResize();
