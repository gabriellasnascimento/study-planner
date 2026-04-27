// Study Planner Final Project
// AI tools were used to help brainstorm structure, debug logic, and improve organization.
// All code was reviewed and understood before use.

const navButtons = document.querySelectorAll(".nav-btn");
const views = document.querySelectorAll(".view");

const taskForm = document.getElementById("taskForm");
const taskTitle = document.getElementById("taskTitle");
const taskCourse = document.getElementById("taskCourse");
const taskDate = document.getElementById("taskDate");
const taskPriority = document.getElementById("taskPriority");
const taskNotes = document.getElementById("taskNotes");
const formMessage = document.getElementById("formMessage");

const taskList = document.getElementById("taskList");
const dashboardTaskPreview = document.getElementById("dashboardTaskPreview");
const filterStatus = document.getElementById("filterStatus");
const sortTasks = document.getElementById("sortTasks");

const totalTasks = document.getElementById("totalTasks");
const completedTasks = document.getElementById("completedTasks");
const overdueTasks = document.getElementById("overdueTasks");
const focusSessions = document.getElementById("focusSessions");

const themeToggle = document.getElementById("themeToggle");

const timerDisplay = document.getElementById("timerDisplay");
const startTimer = document.getElementById("startTimer");
const pauseTimer = document.getElementById("pauseTimer");
const resetTimer = document.getElementById("resetTimer");

let tasks = JSON.parse(localStorage.getItem("studyPlannerTasks")) || [];
let sessions = Number(localStorage.getItem("studyPlannerSessions")) || 0;
let savedTheme = localStorage.getItem("studyPlannerTheme") || "light";

let timer;
let timeLeft = 25 * 60;
let isRunning = false;

function saveTasks() {
  localStorage.setItem("studyPlannerTasks", JSON.stringify(tasks));
}

function saveSessions() {
  localStorage.setItem("studyPlannerSessions", sessions);
}

function saveTheme(theme) {
  localStorage.setItem("studyPlannerTheme", theme);
}

function applyTheme() {
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }
}

function showView(viewId) {
  views.forEach((view) => view.classList.remove("active-view"));
  navButtons.forEach((button) => button.classList.remove("active"));

  document.getElementById(viewId).classList.add("active-view");
  document.querySelector(`.nav-btn[data-view="${viewId}"]`).classList.add("active");
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const viewId = button.dataset.view;
    showView(viewId);
  });
});

function getTaskStatus(task) {
  if (task.completed) return "completed";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(task.date);
  dueDate.setHours(0, 0, 0, 0);

  if (dueDate < today) return "overdue";
  return "upcoming";
}

function priorityValue(priority) {
  if (priority === "High") return 1;
  if (priority === "Medium") return 2;
  return 3;
}

function renderTasks() {
  let filteredTasks = [...tasks];

  const currentFilter = filterStatus.value;
  const currentSort = sortTasks.value;

  if (currentFilter !== "all") {
    filteredTasks = filteredTasks.filter((task) => getTaskStatus(task) === currentFilter);
  }

  if (currentSort === "date-asc") {
    filteredTasks.sort((a, b) => new Date(a.date) - new Date(b.date));
  } else if (currentSort === "date-desc") {
    filteredTasks.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else if (currentSort === "priority") {
    filteredTasks.sort((a, b) => priorityValue(a.priority) - priorityValue(b.priority));
  }

  taskList.innerHTML = "";

  if (filteredTasks.length === 0) {
    taskList.innerHTML = `<p class="empty-message">No tasks found for this filter.</p>`;
    return;
  }

  filteredTasks.forEach((task) => {
    const status = getTaskStatus(task);

    const taskCard = document.createElement("article");
    taskCard.className = "task-item";

    taskCard.innerHTML = `
      <h3>${task.title}</h3>
      <p class="task-meta"><strong>Course:</strong> ${task.course || "Not specified"}</p>
      <p class="task-meta"><strong>Due:</strong> ${task.date}</p>
      <div>
        <span class="badge ${task.priority.toLowerCase()}">${task.priority} Priority</span>
        <span class="badge ${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </div>
      <p class="task-notes">${task.notes ? task.notes : "No notes added."}</p>
      <div class="task-actions">
        <button class="secondary-btn complete-btn" data-id="${task.id}">
          ${task.completed ? "Mark Incomplete" : "Mark Complete"}
        </button>
        <button class="secondary-btn delete-btn" data-id="${task.id}">Delete</button>
      </div>
    `;

    taskList.appendChild(taskCard);
  });

  addTaskButtonEvents();
}

function addTaskButtonEvents() {
  const completeButtons = document.querySelectorAll(".complete-btn");
  const deleteButtons = document.querySelectorAll(".delete-btn");

  completeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const taskId = Number(button.dataset.id);
      const task = tasks.find((item) => item.id === taskId);

      if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        updateDashboard();
      }
    });
  });

  deleteButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const taskId = Number(button.dataset.id);
      tasks = tasks.filter((task) => task.id !== taskId);
      saveTasks();
      renderTasks();
      updateDashboard();
    });
  });
}

function updateDashboard() {
  totalTasks.textContent = tasks.length;
  completedTasks.textContent = tasks.filter((task) => task.completed).length;
  overdueTasks.textContent = tasks.filter((task) => getTaskStatus(task) === "overdue").length;
  focusSessions.textContent = sessions;

  dashboardTaskPreview.innerHTML = "";

  const upcoming = tasks
    .filter((task) => getTaskStatus(task) === "upcoming")
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  if (upcoming.length === 0) {
    dashboardTaskPreview.innerHTML = `<p class="empty-message">No upcoming tasks right now.</p>`;
    return;
  }

  upcoming.forEach((task) => {
    const item = document.createElement("article");
    item.className = "task-item";
    item.innerHTML = `
      <h3>${task.title}</h3>
      <p class="task-meta"><strong>Course:</strong> ${task.course || "Not specified"}</p>
      <p class="task-meta"><strong>Due:</strong> ${task.date}</p>
    `;
    dashboardTaskPreview.appendChild(item);
  });
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const titleValue = taskTitle.value.trim();
  const courseValue = taskCourse.value.trim();
  const dateValue = taskDate.value;
  const priorityValueSelected = taskPriority.value;
  const notesValue = taskNotes.value.trim();

  if (!titleValue || !dateValue) {
    formMessage.textContent = "Please fill in at least the task title and due date.";
    formMessage.style.color = "var(--danger)";
    return;
  }

  const newTask = {
    id: Date.now(),
    title: titleValue,
    course: courseValue,
    date: dateValue,
    priority: priorityValueSelected,
    notes: notesValue,
    completed: false
  };

  tasks.push(newTask);
  saveTasks();

  formMessage.textContent = "Task added successfully.";
  formMessage.style.color = "var(--success)";

  taskForm.reset();
  taskPriority.value = "Medium";

  renderTasks();
  updateDashboard();
});

filterStatus.addEventListener("change", renderTasks);
sortTasks.addEventListener("change", renderTasks);

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  savedTheme = document.body.classList.contains("dark") ? "dark" : "light";
  saveTheme(savedTheme);
});

function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  timerDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function startPomodoro() {
  if (isRunning) return;

  isRunning = true;

  timer = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();

    if (timeLeft <= 0) {
      clearInterval(timer);
      isRunning = false;
      sessions++;
      saveSessions();
      updateDashboard();
      alert("Study session complete! Great job.");
      timeLeft = 25 * 60;
      updateTimerDisplay();
    }
  }, 1000);
}

function pausePomodoro() {
  clearInterval(timer);
  isRunning = false;
}

function resetPomodoro() {
  clearInterval(timer);
  isRunning = false;
  timeLeft = 25 * 60;
  updateTimerDisplay();
}

startTimer.addEventListener("click", startPomodoro);
pauseTimer.addEventListener("click", pausePomodoro);
resetTimer.addEventListener("click", resetPomodoro);

applyTheme();
renderTasks();
updateDashboard();
updateTimerDisplay();