const storageKey = "healthy-habits-checkin";

function getSavedProgress() {
  const saved = localStorage.getItem(storageKey);
  return saved ? JSON.parse(saved) : {};
}

function saveProgress() {
  const checkboxes = document.querySelectorAll(".habit-check");
  const progress = getSavedProgress();

  checkboxes.forEach((checkbox) => {
    const day = checkbox.dataset.day;
    const practice = checkbox.dataset.practice;
    progress[day] = {
      ...((progress[day] || {})),
      [practice]: checkbox.checked,
    };
  });

  document.querySelectorAll(".gratitude-input").forEach((input) => {
    const day = input.dataset.day;
    progress[day] = {
      ...((progress[day] || {})),
      gratitude: input.value,
    };
  });

  localStorage.setItem(storageKey, JSON.stringify(progress));
  updateCardStyles();
  updateSummary();
}

function loadProgress() {
  const saved = getSavedProgress();
  const checkboxes = document.querySelectorAll(".habit-check");
  const gratitudeInputs = document.querySelectorAll(".gratitude-input");

  checkboxes.forEach((checkbox) => {
    const day = checkbox.dataset.day;
    const practice = checkbox.dataset.practice;

    if (saved[day] && saved[day][practice] !== undefined) {
      checkbox.checked = saved[day][practice];
    }
  });

  gratitudeInputs.forEach((input) => {
    const day = input.dataset.day;
    input.value = saved[day]?.gratitude || "";
  });

  updateCardStyles();
  updateSummary();
}

function updateCardStyles() {
  const dayCards = document.querySelectorAll(".day-card");

  dayCards.forEach((card) => {
    const checkboxes = card.querySelectorAll("input");
    const isComplete = checkboxes.length > 0 && Array.from(checkboxes).every((box) => box.checked);

    card.classList.toggle("complete", isComplete);
  });
}

function updateSummary() {
  const checkboxes = Array.from(document.querySelectorAll(".habit-check"));
  const completedCount = checkboxes.filter((checkbox) => checkbox.checked).length;
  const percent = checkboxes.length ? Math.round((completedCount / checkboxes.length) * 100) : 0;
  const fill = document.getElementById("progress-fill");
  const text = document.getElementById("progress-text");
  const progressBar = document.querySelector(".progress-bar");

  fill.style.width = percent + "%";
  text.textContent = `${completedCount} of ${checkboxes.length} practices complete`;
  progressBar.setAttribute("aria-valuenow", percent);
}

document.querySelectorAll(".habit-check").forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    saveProgress();
  });
});

document.querySelectorAll(".gratitude-input").forEach((input) => {
  input.addEventListener("input", saveProgress);
});

loadProgress();