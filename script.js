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

// ToDo一覧をlocalStorageから取得、なければ空配列
let todos = JSON.parse(localStorage.getItem("todos") || "[]");

// フィルター（all, active, done）
let currentFilter = localStorage.getItem("filter") || "all";

// ソート状態（prio=優先度, due=締切日, orig=登録順）
let currentSort = "orig";

const todoInput = document.getElementById("todo-input");
const dateInput = document.getElementById("date-input");
const prioritySel = document.getElementById("priority-select");
const listEl = document.getElementById("todo-list");

// 追加ボタンイベント
document.getElementById("add-btn").onclick = addTodo;

// フィルター切替ボタンイベント
document.querySelectorAll(".filter-group > button[data-filter]").forEach((btn) => {
  btn.onclick = () => {
    currentFilter = btn.dataset.filter;
    localStorage.setItem("filter", currentFilter);
    render();
  };
});

// ソートメニューのボタンイベント
document.querySelectorAll("#sort-menu button").forEach((btn) => {
  btn.onclick = () => {
    currentSort = btn.dataset.sort; // prio, due, orig
    render();
  };
});

// ToDo追加処理
function addTodo() {
  const text = todoInput.value.trim();
  if (!text) return;
  const deadline = dateInput.value || null; // 空文字ならnull

  todos.push({
    text,
    priority: prioritySel.value, // "low", "mid", "hi"
    done: false,
    deadline,
  });

  todoInput.value = "";
  dateInput.value = "";
  save();
  render();
}

// 完了状態のトグル
function toggle(idx) {
  todos[idx].done = !todos[idx].done;
  save();
  render();
}

// 削除処理
function del(idx) {
  todos.splice(idx, 1);
  save();
  render();
}

// テキスト編集処理
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

// 優先度を循環変更
function cyclePriority(p) {
  return p === "low" ? "mid" : p === "mid" ? "hi" : "low";
}

// 優先度変更処理
function changePrio(idx) {
  todos[idx].priority = cyclePriority(todos[idx].priority);
  save();
  render();
}

// 描画処理
function render() {
  listEl.innerHTML = "";

  // フィルターに合うToDoだけ抽出
  let filteredTodos = todos.filter((t) => {
    if (currentFilter === "all") return true;
    if (currentFilter === "done") return t.done;
    if (currentFilter === "active") return !t.done;
  });

  // ソート処理
  if (currentSort === "prio") {
    // 優先度順：hi < mid < low なので昇順でOK
    const prioRank = { hi: 0, mid: 1, low: 2 };
    filteredTodos.sort((a, b) => prioRank[a.priority] - prioRank[b.priority]);
  } else if (currentSort === "due") {
    // 締切が近い順。締切なし（null）は後ろに
    filteredTodos.sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    });
  } else if (currentSort === "orig") {
    // 登録順（そのまま）
  }

  // 描画ループ
  filteredTodos.forEach((t) => {
    const li = document.createElement("li");
    if (t.done) li.classList.add("completed");

    const prioLabel = t.priority === "low" ? "低" : t.priority === "mid" ? "中" : "高";

    li.innerHTML = `
      <div class="task">
        <input type="checkbox" ${t.done ? "checked" : ""}/>
        <span class="priority-dot priority-${t.priority}" title="クリックで変更"></span>
        <span class="priority-label">${prioLabel}</span>
        <span class="text">${t.text}</span>
        <span class="deadline">${t.deadline ? t.deadline : ""}</span>
      </div>
      <button>削除</button>
    `;

    // 元のtodos配列でのインデックス取得
    const originalIndex = todos.indexOf(t);

    li.querySelector("input").onclick = () => toggle(originalIndex);
    li.querySelector("button").onclick = () => del(originalIndex);
    li.querySelector(".priority-dot").onclick = () => changePrio(originalIndex);
    li.querySelector(".text").ondblclick = () => editText(originalIndex, li.querySelector(".text"));

    listEl.appendChild(li);
  });
}

// localStorageに保存
function save() {
  localStorage.setItem("todos", JSON.stringify(todos));
}

// 初回描画
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
