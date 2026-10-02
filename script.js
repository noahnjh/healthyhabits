const storageKey = "healthy-habits-checkin";
const dayStorageKey = "healthy-habits-selected-day";
const themeStorageKey = "healthy-habits-theme";
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const daySelect = document.getElementById("day-select");
const themeToggle = document.getElementById("theme-toggle");
const dayCards = document.querySelectorAll(".day-card");
const recapDialog = document.getElementById("recap-dialog");
const recapStatus = document.getElementById("recap-status");
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

  document.querySelectorAll(".gratitude-input, .notes-input").forEach((input) => {
    const field = input.classList.contains("gratitude-input") ? "gratitude" : "notes";
    input.value = saved[input.dataset.day]?.[field] || "";
  });

  updateCardStyles();
}

function updateCardStyles() {
  dayCards.forEach((card) => {
    const checkboxes = card.querySelectorAll(".habit-check");
    const isComplete = checkboxes.length > 0 && Array.from(checkboxes).every((box) => box.checked);
    card.classList.toggle("complete", isComplete);
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
  themeToggle.textContent = isNight ? "Day theme" : "Night theme";
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
  const confirmed = window.confirm(`Reset ${selectedDay}'s check-in? This clears its additional notes and habits.`);
  if (!confirmed) return;

  document.querySelectorAll(`.habit-check[data-day="${selectedDay}"]`).forEach((checkbox) => {
    checkbox.checked = false;
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

document.getElementById("weekly-recap").addEventListener("click", createRecap);
document.getElementById("close-recap").addEventListener("click", () => recapDialog.close());
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
