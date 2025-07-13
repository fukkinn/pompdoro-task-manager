/* ========== テーマ切替 ========== */
const bodyEl = document.body;
const themeBtn = document.getElementById("theme-toggle");
const savedTheme = localStorage.getItem("theme") || "light";

if (savedTheme === "dark") {
  bodyEl.classList.add("dark");
  themeBtn.textContent = "☀️";
}

themeBtn.onclick = () => {
  bodyEl.classList.toggle("dark");
  const now = bodyEl.classList.contains("dark") ? "dark" : "light";
  themeBtn.textContent = now === "dark" ? "☀️" : "🌙";
  localStorage.setItem("theme", now);
};

/* ========== ToDo ========== */
let todos = JSON.parse(localStorage.getItem("todos") || "[]");
let currentFilter = localStorage.getItem("filter") || "all";

const todoInput = document.getElementById("todo-input");
const prioritySel = document.getElementById("priority-select");
const listEl = document.getElementById("todo-list");

document.getElementById("add-btn").onclick = addTodo;

document.querySelectorAll(".filter-group button").forEach((btn) => {
  btn.onclick = () => {
    currentFilter = btn.dataset.filter;
    localStorage.setItem("filter", currentFilter);
    render();
  };
});

function addTodo() {
  const text = todoInput.value.trim();
  if (!text) return;
  todos.push({ text, priority: prioritySel.value, done: false });
  todoInput.value = "";
  save();
  render();
}

function toggle(idx) {
  todos[idx].done = !todos[idx].done;
  save();
  render();
}

function del(idx) {
  todos.splice(idx, 1);
  save();
  render();
}

function editText(idx, span) {
  const val = todos[idx].text;
  const input = document.createElement("input");
  input.value = val;
  input.onblur = () => {
    todos[idx].text = input.value.trim() || val;
    save();
    render();
  };
  span.replaceWith(input);
  input.focus();
}

function cyclePriority(p) {
  return p === "low" ? "medium" : p === "medium" ? "high" : "low";
}

function changePrio(idx) {
  todos[idx].priority = cyclePriority(todos[idx].priority);
  save();
  render();
}

function render() {
  listEl.innerHTML = "";

  todos.forEach((t, i) => {
    // フィルター処理をここに移動（indexズレ防止）
    if (currentFilter !== "all" && t.done !== (currentFilter === "done")) {
      return;
    }

    const li = document.createElement("li");
    if (t.done) li.classList.add("completed");

    const prioLabel =
      t.priority === "low" ? "低" : t.priority === "medium" ? "中" : "高";

    li.innerHTML = `
<div class="task">
  <input type="checkbox" ${t.done ? "checked" : ""}/>
  <span class="priority-dot priority-${t.priority}" title="クリックで変更"></span>
  <span class="priority-label">${prioLabel}</span>
  <span class="text">${t.text}</span>
</div>
<button>削除</button>`;

    li.querySelector("input").onclick = () => toggle(i);
    li.querySelector("button").onclick = () => del(i);
    li.querySelector(".priority-dot").onclick = () => changePrio(i);
    li.querySelector(".text").ondblclick = () =>
      editText(i, li.querySelector(".text"));

    listEl.appendChild(li);
  });
}

function save() {
  localStorage.setItem("todos", JSON.stringify(todos));
}

render();

/* ========== タイマー ========== */
const workInput = document.getElementById("work-min");
const breakInput = document.getElementById("break-min");
const display = document.getElementById("timer-display");
const progress = document.getElementById("progress-bar");

let isWork = true,
  timer = null,
  totalSec = 1500,
  leftSec = 1500;

function updateDisplay() {
  const m = String(Math.floor(leftSec / 60)).padStart(2, "0");
  const s = String(leftSec % 60).padStart(2, "0");
  display.textContent = `${m}:${s}`;
  progress.style.width = `${(1 - leftSec / totalSec) * 100}%`;
}

function flashScreen() {
  bodyEl.classList.add("flash");
  setTimeout(() => bodyEl.classList.remove("flash"), 1200);
}

function start() {
  if (timer) return;
  timer = setInterval(() => {
    leftSec--;
    updateDisplay();
    if (leftSec <= 0) switchMode();
  }, 1000);
}

function pause() {
  clearInterval(timer);
  timer = null;
}

function reset() {
  pause();
  isWork = true;
  totalSec = leftSec = workInput.value * 60;
  updateDisplay();
}

function switchMode() {
  pause();
  flashScreen();
  isWork = !isWork;
  totalSec = leftSec = (isWork ? workInput.value : breakInput.value) * 60;
  alert(isWork ? "作業時間です！" : "休憩しましょう！");
  updateDisplay();
  start();
}

document.getElementById("start-btn").onclick = start;
document.getElementById("pause-btn").onclick = pause;
document.getElementById("reset-btn").onclick = reset;

workInput.onchange = breakInput.onchange = reset;

reset(); // 初期化
