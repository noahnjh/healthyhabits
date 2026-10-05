const storageKey = "healthy-habits-checkin";
const dayStorageKey = "healthy-habits-selected-day";
const themeStorageKey = "healthy-habits-theme";
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const ritualTimes = [
  {
    name: "Morning",
    icon: '<path d="M3 18h18M6 18a6 6 0 0 1 12 0M12 3v2M5.6 6.6 7 8m10-1.4L15.6 8" />',
  },
  {
    name: "Midday",
    icon: '<circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />',
  },
  {
    name: "Afternoon",
    icon: '<path d="M3 19h18M6 16a6 6 0 0 1 12 0M12 3v4m-5.7.3 1.4 1.4m10-1.4-1.4 1.4" />',
  },
  {
    name: "Evening",
    icon: '<path d="M3 18h18M7 18a5 5 0 0 1 10 0M12 3v5m-4-2 4 4 4-4" />',
  },
  {
    name: "Night",
    icon: '<path d="M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8 8.6 8.6 0 1 0 20.2 15.4Z" /><path d="M17.5 4v3m-1.5-1.5h3" />',
  },
];
const daySelect = document.getElementById("day-select");
const themeToggle = document.getElementById("theme-toggle");
const dayCards = document.querySelectorAll(".day-card");
const recapDialog = document.getElementById("recap-dialog");
const recapStatus = document.getElementById("recap-status");
const ritualDialog = document.getElementById("ritual-dialog");
let recapUrl;

function getSavedProgress() {
  const saved = localStorage.getItem(storageKey);
  return saved ? JSON.parse(saved) : {};
}

function saveProgress() {
  const progress = getSavedProgress();

  document.querySelectorAll(".habit-check").forEach((checkbox) => {
    const { day, practice } = checkbox.dataset;
    progress[day] = {
      ...(progress[day] || {}),
      [practice]: checkbox.checked,
    };
  });

  document.querySelectorAll(".ritual-button").forEach((button) => {
    const { day, ritual } = button.dataset;
    progress[day] = {
      ...(progress[day] || {}),
      [ritual]: button.getAttribute("aria-pressed") === "true",
    };
  });

  document.querySelectorAll(".gratitude-input, .notes-input").forEach((input) => {
    const { day } = input.dataset;
    const field = input.classList.contains("gratitude-input") ? "gratitude" : "notes";
    progress[day] = {
      ...(progress[day] || {}),
      [field]: input.value,
    };
  });

  localStorage.setItem(storageKey, JSON.stringify(progress));
  updateCardStyles();
}

function loadProgress() {
  const saved = getSavedProgress();

  document.querySelectorAll(".habit-check").forEach((checkbox) => {
    const { day, practice } = checkbox.dataset;
    if (saved[day] && saved[day][practice] !== undefined) {
      checkbox.checked = saved[day][practice];
    }
  });

  document.querySelectorAll(".ritual-button").forEach((button) => {
    const { day, ritual } = button.dataset;
    button.setAttribute("aria-pressed", String(saved[day]?.[ritual] === true));
  });

  document.querySelectorAll(".gratitude-input, .notes-input").forEach((input) => {
    const field = input.classList.contains("gratitude-input") ? "gratitude" : "notes";
    input.value = saved[input.dataset.day]?.[field] || "";
  });

  updateCardStyles();
}

function updateCardStyles() {
  dayCards.forEach((card) => {
    const tasks = card.querySelectorAll(".habit-check, .ritual-button");
    const checkedCount = Array.from(tasks).filter((task) => (
      task.matches(".habit-check") ? task.checked : task.getAttribute("aria-pressed") === "true"
    )).length;
    const isComplete = tasks.length > 0 && checkedCount === tasks.length;
    card.classList.toggle("complete", isComplete);

    const message = card.querySelector(".checkin-message");
    if (isComplete) {
      message.textContent = "Thank you for showing up for yourself. I'm proud of you.";
      message.hidden = false;
    } else if (tasks.length > 0 && checkedCount / tasks.length >= 0.5) {
      message.textContent = "You're doing great. Keep showing up for yourself.";
      message.hidden = false;
    } else {
      message.textContent = "";
      message.hidden = true;
    }
  });
}

function addRitualTrackers() {
  dayCards.forEach((card) => {
    const day = card.dataset.day;
    const heading = card.querySelector(".day-heading");
    const guideButton = document.createElement("button");
    guideButton.className = "button ritual-guide-button";
    guideButton.type = "button";
    guideButton.setAttribute("aria-label", "Open the five-minute ritual and affirmations");
    guideButton.innerHTML = `
      <svg class="ritual-guide-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 20c-4.2-2.2-6.3-5.2-6.3-8.1a3.6 3.6 0 0 1 6.3-2.4 3.6 3.6 0 0 1 6.3 2.4c0 2.9-2.1 5.9-6.3 8.1Z" />
        <path d="M12 20V9m-6.1 2.6L12 16l6.1-4.4M3 5.5c1.4 0 2.1.7 2.1 2.1M21 5.5c-1.4 0-2.1.7-2.1 2.1" />
      </svg>
      <span>5-minute ritual</span>
    `;
    heading.append(guideButton);

    const tracker = document.createElement("div");
    tracker.className = "ritual-tracker";
    tracker.setAttribute("role", "group");
    tracker.setAttribute("aria-label", `${day} ritual check-ins`);
    tracker.innerHTML = ritualTimes.map(({ name, icon }) => `
      <button class="ritual-button" type="button" data-day="${day}" data-ritual="${name}" aria-label="${name} ritual" title="${name} ritual" aria-pressed="false">
        <svg class="ritual-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${icon}</svg>
        <span>${name}</span>
      </button>
    `).join("");
    heading.after(tracker);
  });
}

function selectDay(day) {
  daySelect.value = day;
  dayCards.forEach((card) => {
    card.hidden = card.dataset.day !== day;
  });
  localStorage.setItem(dayStorageKey, day);
}

function setTheme(theme) {
  const isNight = theme === "night";
  document.documentElement.dataset.theme = isNight ? "night" : "day";
  const themeAction = isNight ? "Switch to day theme" : "Switch to night theme";
  themeToggle.setAttribute("aria-label", themeAction);
  themeToggle.title = themeAction;
  themeToggle.setAttribute("aria-pressed", String(isNight));
  localStorage.setItem(themeStorageKey, isNight ? "night" : "day");
}

function updateWeekDates() {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7), 12);
  const formatter = new Intl.DateTimeFormat(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  days.forEach((day, index) => {
    const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index, 12);
    document.querySelector(`[data-day-date="${day}"]`).textContent = formatter.format(date);
  });
}

function wrapText(context, text, maxWidth) {
  return text.split("\n").flatMap((paragraph) => {
    if (!paragraph) return [""];
    const words = paragraph.split(/\s+/);
    const lines = [];
    let line = "";

    words.forEach((word) => {
      const parts = [];
      let part = "";
      Array.from(word).forEach((character) => {
        if (part && context.measureText(part + character).width > maxWidth) {
          parts.push(part);
          part = character;
        } else {
          part += character;
        }
      });
      if (part) parts.push(part);

      parts.forEach((chunk, index) => {
        const candidate = line ? `${line}${index === 0 ? " " : ""}${chunk}` : chunk;
        if (line && context.measureText(candidate).width > maxWidth) {
          lines.push(line);
          line = chunk;
        } else {
          line = candidate;
        }
        if (index < parts.length - 1) {
          lines.push(line);
          line = "";
        }
      });
    });
    lines.push(line);
    return lines;
  });
}

function buildRecapCanvas() {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not create the recap image.");

  const width = 1200;
  const margin = 80;
  const contentWidth = width - margin * 2;
  const lineHeight = 38;
  const sections = days.map((day, index) => ({
    day,
    date: document.querySelector(`[data-day-date="${day}"]`).textContent,
    gratitude: document.querySelector(`.gratitude-input[data-day="${day}"]`).value.trim(),
    notes: document.querySelector(`.notes-input[data-day="${day}"]`).value.trim(),
    index,
  }));

  context.font = "28px Arial, sans-serif";
  sections.forEach((section) => {
    section.gratitudeLines = wrapText(context, section.gratitude || "Nothing written.", contentWidth);
    section.notesLines = wrapText(context, section.notes || "Nothing written.", contentWidth);
  });

  const height = sections.reduce((total, section) => (
    total + 92 + (section.gratitudeLines.length + section.notesLines.length + 2) * lineHeight
  ), 210) + margin;
  if (height > 16000) {
    throw new Error("This recap is too long to fit in one image. Shorten the notes and try again.");
  }

  canvas.width = width;
  canvas.height = height;
  context.fillStyle = "#f5f4ef";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#264b3e";
  context.font = "bold 26px Arial, sans-serif";
  context.fillText("HEALTHY HABITS  /  WEEKLY RECAP", margin, margin);
  context.font = "48px Georgia, serif";
  context.fillText("A week to remember", margin, margin + 62);

  let y = margin + 135;
  sections.forEach((section) => {
    context.fillStyle = "#264b3e";
    context.font = "bold 34px Georgia, serif";
    context.fillText(`${section.index + 1}. ${section.day}`, margin, y);
    context.fillStyle = "#68746d";
    context.font = "23px Arial, sans-serif";
    context.fillText(section.date, width - margin - context.measureText(section.date).width, y);
    y += 48;

    [
      ["Grateful for / excited about", section.gratitudeLines],
      ["Additional Notes", section.notesLines],
    ].forEach(([label, lines]) => {
      context.fillStyle = "#c8755d";
      context.font = "bold 23px Arial, sans-serif";
      context.fillText(label, margin, y);
      y += 32;
      context.fillStyle = "#26312b";
      context.font = "28px Arial, sans-serif";
      lines.forEach((line) => {
        context.fillText(line, margin, y);
        y += lineHeight;
      });
      y += 10;
    });

    y += 28;
    context.strokeStyle = "#dfe3dc";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(margin, y - 12);
    context.lineTo(width - margin, y - 12);
    context.stroke();
  });

  return canvas;
}

async function createRecap() {
  recapStatus.textContent = "Creating your recap image…";
  recapDialog.showModal();
  try {
    const canvas = buildRecapCanvas();
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result);
        else reject(new Error("The recap image could not be exported."));
      }, "image/png");
    });
    if (recapUrl) URL.revokeObjectURL(recapUrl);
    recapUrl = URL.createObjectURL(blob);
    document.getElementById("recap-image").src = recapUrl;
    document.getElementById("save-recap").href = recapUrl;
    recapStatus.textContent = "Your weekly recap is ready to copy or save.";
  } catch (error) {
    recapStatus.textContent = error instanceof Error ? error.message : "The recap image could not be created.";
  }
}

addRitualTrackers();

dayCards.forEach((card) => {
  card.hidden = true;
});

const today = ["Sunday", ...days.slice(0, 6)][new Date().getDay()];
const savedDay = localStorage.getItem(dayStorageKey);
selectDay(days.includes(savedDay) ? savedDay : today);
setTheme(localStorage.getItem(themeStorageKey) === "night" ? "night" : "day");
updateWeekDates();
loadProgress();

daySelect.addEventListener("change", () => {
  selectDay(daySelect.value);
});

themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "night" ? "day" : "night";
  setTheme(nextTheme);
});

document.getElementById("reset-day").addEventListener("click", () => {
  const selectedDay = daySelect.value;
  const confirmed = window.confirm(`Reset ${selectedDay}'s check-in? This clears its notes, habits, and ritual check-ins.`);
  if (!confirmed) return;

  document.querySelectorAll(`.habit-check[data-day="${selectedDay}"]`).forEach((checkbox) => {
    checkbox.checked = false;
  });
  document.querySelectorAll(`.ritual-button[data-day="${selectedDay}"]`).forEach((button) => {
    button.setAttribute("aria-pressed", "false");
  });
  const gratitudeInput = document.querySelector(`.gratitude-input[data-day="${selectedDay}"]`);
  gratitudeInput.value = "";
  const notesInput = document.querySelector(`.notes-input[data-day="${selectedDay}"]`);
  notesInput.value = "";
  saveProgress();
  gratitudeInput.focus();
});

document.querySelectorAll(".habit-check, .gratitude-input, .notes-input").forEach((input) => {
  input.addEventListener(input.type === "checkbox" ? "change" : "input", saveProgress);
});

document.querySelectorAll(".ritual-button").forEach((button) => {
  button.addEventListener("click", () => {
    const isPressed = button.getAttribute("aria-pressed") === "true";
    button.setAttribute("aria-pressed", String(!isPressed));
    saveProgress();
  });
});

document.getElementById("weekly-recap").addEventListener("click", createRecap);
document.getElementById("close-recap").addEventListener("click", () => recapDialog.close());
document.querySelectorAll(".ritual-guide-button").forEach((button) => {
  button.addEventListener("click", () => ritualDialog.showModal());
});
document.getElementById("close-ritual").addEventListener("click", () => ritualDialog.close());
document.getElementById("copy-recap").addEventListener("click", async () => {
  if (!recapUrl || !navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    recapStatus.textContent = "Image copying is not available in this browser. Use Save image instead.";
    return;
  }

  try {
    const response = await fetch(recapUrl);
    const blob = await response.blob();
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    recapStatus.textContent = "Recap image copied to your clipboard.";
  } catch {
    recapStatus.textContent = "Could not copy the image. Use Save image instead.";
  }
});
