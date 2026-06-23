const CATEGORIES = [
  { id: "1", label: "Overworld" },
  { id: "2", label: "Nether" },
  { id: "3", label: "End" },
  { id: "4", label: "Water" },
  { id: "5", label: "Ancient City" }
];
const FREQUENCIES = {
  default: { min: 600, max: 1350 },
  constant: { min: 60, max: 300 },
  instant: { min: 10, max: 10 }
};
const FADE_SECONDS = 4;
const TARGET_VOLUME = 1;

const state = {
  allowedCategories: new Set(CATEGORIES.map((category) => category.id)),
  frequency: "default",
  showTitle: true,
  fadeIn: true,
  started: false,
  isPlaying: false,
  waitTimer: null,
  fadeFrame: null,
  currentTrack: null
};

const audio = document.querySelector("#audioPlayer");
const statusText = document.querySelector("#playerStatus");
const trackTitle = document.querySelector("#trackTitle");
const startButton = document.querySelector("#startButton");
const settingsButton = document.querySelector("#settingsButton");
const settingsPanel = document.querySelector("#settingsPanel");
const closeSettings = document.querySelector("#closeSettings");
const folderOptions = document.querySelector("#folderOptions");
const showTitleToggle = document.querySelector("#showTitleToggle");
const fadeToggle = document.querySelector("#fadeToggle");

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getCategoryId(filename) {
  const match = filename.match(/^(\d+)-/);
  return match ? match[1] : null;
}

function getTrackTitle(filename) {
  return filename
    .replace(/^[\d]+-\d+\.\s*/, "")
    .replace(/^[\d]+-\s*/, "")
    .replace(/\.[^/.]+$/, "");
}

function getAvailableTracks() {
  return (window.MUSIC_FILES || [])
    .map((filename) => ({
      category: getCategoryId(filename),
      title: getTrackTitle(filename),
      src: `music/${filename}`
    }))
    .filter((track) => track.category && state.allowedCategories.has(track.category));
}

function chooseRandomTrack() {
  const tracks = getAvailableTracks();
  if (tracks.length === 0) {
    return null;
  }
  return tracks[randomInteger(0, tracks.length - 1)];
}

function updateTitleVisibility() {
  const shouldShow = state.showTitle && state.isPlaying && state.currentTrack;
  trackTitle.classList.toggle("hidden", !shouldShow);
  trackTitle.textContent = shouldShow ? state.currentTrack.title : "";
}

function setStatus(message) {
  statusText.textContent = message;
}

function stopFade() {
  if (state.fadeFrame) {
    cancelAnimationFrame(state.fadeFrame);
    state.fadeFrame = null;
  }
}

function startFadeIn() {
  stopFade();
  if (!state.fadeIn) {
    audio.volume = TARGET_VOLUME;
    return;
  }

  const startedAt = performance.now();
  audio.volume = 0;

  function step(now) {
    const progress = Math.min((now - startedAt) / (FADE_SECONDS * 1000), 1);
    audio.volume = TARGET_VOLUME * progress;
    if (progress < 1 && state.isPlaying) {
      state.fadeFrame = requestAnimationFrame(step);
    }
  }

  state.fadeFrame = requestAnimationFrame(step);
}

async function playRandomTrack() {
  clearScheduledWait();
  const track = chooseRandomTrack();
  if (!track) {
    state.isPlaying = false;
    state.currentTrack = null;
    updateTitleVisibility();
    setStatus("Select at least one numbered category that has files listed in tracks.js.");
    return;
  }

  state.currentTrack = track;
  state.isPlaying = true;
  audio.src = encodeURI(track.src);
  startFadeIn();
  updateTitleVisibility();
  setStatus("Playing music.");

  try {
    await audio.play();
  } catch (error) {
    state.isPlaying = false;
    updateTitleVisibility();
    setStatus("Playback was blocked or the track could not be loaded. Tap Start to try again.");
    startButton.hidden = false;
  }
}

function clearScheduledWait() {
  if (state.waitTimer) {
    clearTimeout(state.waitTimer);
    state.waitTimer = null;
  }
}

function scheduleNextTrack() {
  clearScheduledWait();
  if (!state.started) {
    return;
  }

  const { min, max } = FREQUENCIES[state.frequency];
  const seconds = randomInteger(min, max);
  state.waitTimer = setTimeout(playRandomTrack, seconds * 1000);
  setStatus("Waiting for the next track.");
}

function applyFrequencyChange(nextFrequency) {
  const previousFrequency = state.frequency;
  state.frequency = nextFrequency;

  if (!state.started || state.isPlaying) {
    return;
  }

  if (nextFrequency === "instant" && previousFrequency !== "instant") {
    playRandomTrack();
  }
}

function renderFolderOptions() {
  folderOptions.innerHTML = "";
  CATEGORIES.forEach((category) => {
    const label = document.createElement("label");
    label.className = "toggle-row";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = category.id;
    input.checked = state.allowedCategories.has(category.id);
    input.addEventListener("change", () => {
      if (input.checked) {
        state.allowedCategories.add(category.id);
      } else {
        state.allowedCategories.delete(category.id);
      }
    });

    const span = document.createElement("span");
    span.textContent = `${category.id} - ${category.label}`;
    label.append(input, span);
    folderOptions.append(label);
  });
}

startButton.addEventListener("click", () => {
  state.started = true;
  startButton.hidden = true;
  playRandomTrack();
});

audio.addEventListener("ended", () => {
  stopFade();
  state.isPlaying = false;
  state.currentTrack = null;
  updateTitleVisibility();
  scheduleNextTrack();
});

audio.addEventListener("error", () => {
  stopFade();
  state.isPlaying = false;
  state.currentTrack = null;
  updateTitleVisibility();
  setStatus("A track could not be loaded. Check tracks.js and your music file paths.");
  scheduleNextTrack();
});

settingsButton.addEventListener("click", () => {
  settingsPanel.showModal();
  settingsButton.setAttribute("aria-expanded", "true");
});

settingsPanel.addEventListener("close", () => {
  settingsButton.setAttribute("aria-expanded", "false");
});

closeSettings.addEventListener("click", () => settingsPanel.close());

showTitleToggle.addEventListener("change", () => {
  state.showTitle = showTitleToggle.checked;
  updateTitleVisibility();
});

fadeToggle.addEventListener("change", () => {
  state.fadeIn = fadeToggle.checked;
});

document.querySelectorAll('input[name="frequency"]').forEach((input) => {
  input.addEventListener("change", () => applyFrequencyChange(input.value));
});

renderFolderOptions();
updateTitleVisibility();
