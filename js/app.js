const API = "https://106API.azurewebsites.net/api/tasks"; // en SWA es misma origin; local con SWA CLI también.

const dom = {
  form: document.getElementById("taskForm"),
  list: document.getElementById("list"),
  empty: document.getElementById("empty"),
  title: document.getElementById("title"),
  desc: document.getElementById("desc"),
  color: document.getElementById("color"),
  date: document.getElementById("date"),
  status: document.getElementById("status"),
  budget: document.getElementById("budget"),
  name: document.getElementById("name"),
  isImportant: document.getElementById("isImportant"),
};

async function getJSON(url, opts) {
  const res = await fetch(url, { headers: { "Accept": "application/json" }, ...opts });
  if (res.status === 204) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function li(task) {
  const el = document.createElement("li");
  el.className = "item";
  el.style.borderLeftColor = task.color || "#444";
  el.dataset.id = task.id;

  el.innerHTML = `
    <div>
      <strong>${task.title}</strong>
      ${task.isImportant ? '<span class="badge">★ importante</span>' : ""}
      <div class="muted">${task.desc || ""}</div>
      <div class="muted">
        ${task.date || ""} · <span class="tag">${task.status}</span> · $${Number(task.budget||0).toFixed(2)}
        ${task.name ? ` · ${task.name}` : ""}
      </div>
    </div>
    <div class="actions">
      <button data-action="done">Done</button>
      <button data-action="del">Eliminar</button>
    </div>
  `;
  return el;
}

async function load() {
  try {
    const data = await getJSON(API);
    dom.list.innerHTML = "";
    if (!data || data.length === 0) {
      dom.empty.style.display = "block";
      return;
    }
    dom.empty.style.display = "none";
    data.forEach(t => dom.list.appendChild(li(t)));
  } catch (e) {
    console.error("GET /api/tasks failed", e);
  }
}

dom.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const task = {
    isImportant: dom.isImportant.checked,
    title: dom.title.value.trim(),
    desc: dom.desc.value.trim(),
    color: dom.color.value,
    date: dom.date.value,
    status: dom.status.value,
    budget: Number(dom.budget.value || 0),
    name: dom.name.value.trim() || null,
  };
  if (!task.title) { alert("El título es obligatorio"); return; }

  try {
    const created = await getJSON(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });
    dom.list.prepend(li(created));
    dom.empty.style.display = "none";
    dom.form.reset();
  } catch (e) {
    console.error("POST /api/tasks failed", e);
    alert("No se pudo guardar la tarea");
  }
});

dom.list.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const item = e.target.closest(".item");
  const id = item?.dataset?.id;
  if (!id) return;

  const action = btn.dataset.action;
  try {
    if (action === "del") {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (res.ok) item.remove();
    } else if (action === "done") {
      const updated = await getJSON(`${API}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "done" }),
      });
      item.replaceWith(li(updated));
    }
  } catch (e) {
    console.error("Action failed", e);
  }
});

load();
