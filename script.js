const storageKey = "healthy-habits-checkin";

function getSavedProgress() {
  const saved = localStorage.getItem(storageKey);
  return saved ? JSON.parse(saved) : {};
}

function saveProgress() {
  const checkboxes = document.querySelectorAll(".habit-check");
  const progress = {};

  checkboxes.forEach((checkbox) => {
    const day = checkbox.dataset.day;
    const practice = checkbox.dataset.practice;
    progress[day] = {
      ...((progress[day] || {})),
      [practice]: checkbox.checked,
    };
  });

  localStorage.setItem(storageKey, JSON.stringify(progress));
  updateSummary();
}

function loadProgress() {
  const saved = getSavedProgress();
  const checkboxes = document.querySelectorAll(".habit-check");

  checkboxes.forEach((checkbox) => {
    const day = checkbox.dataset.day;
    const practice = checkbox.dataset.practice;

    if (saved[day] && saved[day][practice] !== undefined) {
      checkbox.checked = saved[day][practice];
    }
  });

  updateCardStyles();
  updateSummary();
}

function updateCardStyles() {
  const dayCards = document.querySelectorAll(".day-card");

  dayCards.forEach((card) => {
    const day = card.dataset.day;
    const checkboxes = card.querySelectorAll("input");
    const isComplete = Array.from(checkboxes).some((box) => box.checked);

    card.classList.toggle("complete", isComplete);
  });
}

function updateSummary() {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const saved = getSavedProgress();
  let completedCount = 0;

  days.forEach((day) => {
    if (saved[day] && saved[day]["Stretch/Exercise"]) {
      completedCount++;
    }
  });

  const percent = Math.round((completedCount / days.length) * 100);
  const fill = document.getElementById("progress-fill");
  const text = document.getElementById("progress-text");

  fill.style.width = percent + "%";
  text.textContent = percent + "% complete";
}

document.querySelectorAll(".habit-check").forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    saveProgress();
    updateCardStyles();
  });
});

loadProgress();