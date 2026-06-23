const drawCounts = {
  gems: 3,
  relics: 2,
  spells: 4,
  heroes: 2,
  nemeses: 1
};

const drawStates = Object.fromEntries(
  Object.keys(drawCounts).map((category) => [
    category,
    { items: [], locked: Array(drawCounts[category]).fill(false) }
  ])
);

let drawData = null;

function getItemName(item) {
  return typeof item === "string" ? item : item.name;
}

function supportsLock(category) {
  return category !== "nemeses";
}

function selectRandomItems(items, count) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index]
    ];
  }

  return shuffled.slice(0, count);
}

function renderResults(category) {
  const resultArea = document.querySelector(`#${category} .results`);
  const state = drawStates[category];
  resultArea.replaceChildren();

  state.items.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "result-card";
    card.classList.toggle("has-lock", supportsLock(category));
    card.classList.toggle("is-locked", supportsLock(category) && state.locked[index]);

    if (typeof item !== "string") {
      const cost = document.createElement("span");
      cost.className = "result-cost";
      cost.textContent = `${item.cost} 에테르`;
      card.append(cost);
    }

    const name = document.createElement("strong");
    name.textContent = getItemName(item);
    card.append(name);

    if (supportsLock(category)) {
      const lockLabel = document.createElement("label");
      lockLabel.className = "lock-control";

      const lockCheckbox = document.createElement("input");
      lockCheckbox.type = "checkbox";
      lockCheckbox.checked = state.locked[index];
      lockCheckbox.addEventListener("change", () => {
        state.locked[index] = lockCheckbox.checked;
        card.classList.toggle("is-locked", lockCheckbox.checked);
      });

      lockLabel.append(lockCheckbox, "고정");
      card.append(lockLabel);
    }
    resultArea.append(card);
  });
}

function draw(category) {
  if (!drawData) {
    return;
  }

  const state = drawStates[category];
  const lockedNames = new Set(
    state.items
      .filter((item, index) => item && state.locked[index])
      .map(getItemName)
  );
  const randomPool = drawData[category].filter(
    (item) => !lockedNames.has(getItemName(item))
  );
  const randomItems = selectRandomItems(
    randomPool,
    drawCounts[category] - lockedNames.size
  );

  state.items = Array.from({ length: drawCounts[category] }, (_, index) => {
    if (state.items[index] && state.locked[index]) {
      return state.items[index];
    }

    return randomItems.shift();
  });

  renderResults(category);
}

function showTab(category) {
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.tab === category));
  });

  document.querySelectorAll(".panel").forEach((panel) => {
    panel.hidden = panel.id !== category;
  });
}

function showLoadError() {
  const message = document.createElement("p");
  message.className = "error-message";
  message.textContent = "카드 목록을 불러오지 못했습니다. 페이지를 다시 열어 주세요.";
  document.querySelector("main").prepend(message);
}

async function initialize() {
  document.querySelectorAll("[data-draw]").forEach((button) => {
    button.disabled = true;
    button.addEventListener("click", () => draw(button.dataset.draw));
  });

  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => showTab(button.dataset.tab));
  });

  try {
    const response = await fetch("data.json");
    if (!response.ok) {
      throw new Error(`Failed to load data.json: ${response.status}`);
    }

    drawData = await response.json();
    document.querySelectorAll("[data-draw]").forEach((button) => {
      button.disabled = false;
    });
  } catch (error) {
    console.error(error);
    showLoadError();
  }
}

initialize();
