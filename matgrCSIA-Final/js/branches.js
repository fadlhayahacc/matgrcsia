// branches.js

async function apiGetBranches() {
  const { data, error } = await window.sb
    .from("branches")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("apiGetBranches:", error);
    return [];
  }
  return data || [];
}

async function apiAddBranch(payload) {
  const { data, error } = await window.sb
    .from("branches")
    .insert([payload])
    .select()
    .single();

  if (error) return { ok: false, message: error.message };
  return { ok: true, branch: data };
}

async function apiDeleteBranch(id) {
  const { error } = await window.sb.from("branches").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

async function apiUpdateBranch(id, payload) {
  const { data, error } = await window.sb
    .from("branches")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, message: error.message };
  return { ok: true, branch: data };
}

window.addBranch = async function addBranch() {
  const name = document.getElementById("branch-name").value.trim();
  const city = document.getElementById("branch-city").value.trim();
  const errEl = document.getElementById("branch-error");
  if (errEl) errEl.textContent = "";

  if (!name) {
    if (errEl) errEl.textContent = "Branch name is required.";
    return;
  }

  const res = await apiAddBranch({ name, city });
  if (!res.ok) {
    if (errEl) errEl.textContent = res.message;
    return;
  }

  document.getElementById("branch-name").value = "";
  document.getElementById("branch-city").value = "";

  await window.refreshAndRender();
};

function renderBranches(branches) {
  const table = document.getElementById("branches-table");
  if (!table) return;

  table.innerHTML = "";

  branches.forEach(b => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td data-cell="name">${escapeHtml(b.name)}</td>
      <td data-cell="city">${escapeHtml(b.city || "")}</td>
      <td>
        <button data-edit="${b.id}">Edit</button>
        <button data-del="${b.id}">Delete</button>
      </td>
    `;

    table.appendChild(row);

    row.querySelector(`[data-del="${b.id}"]`).addEventListener("click", async () => {
      const res = await apiDeleteBranch(b.id);
      if (!res.ok) return alert(res.message);
      await window.refreshAndRender();
    });

    row.querySelector(`[data-edit="${b.id}"]`).addEventListener("click", () => {
      enterBranchEditMode(row, b);
    });
  });
}

function enterBranchEditMode(row, branch) {
  const nameCell = row.querySelector(`[data-cell="name"]`);
  const cityCell = row.querySelector(`[data-cell="city"]`);
  const actionCell = row.lastElementChild;

  nameCell.innerHTML = `<input type="text" value="${escapeAttr(branch.name)}" />`;
  cityCell.innerHTML = `<input type="text" value="${escapeAttr(branch.city || "")}" />`;

  actionCell.innerHTML = `
    <button data-save="${branch.id}">Save</button>
    <button data-cancel="${branch.id}">Cancel</button>
  `;

  actionCell.querySelector(`[data-cancel="${branch.id}"]`).addEventListener("click", async () => {
    await window.refreshAndRender();
  });

  actionCell.querySelector(`[data-save="${branch.id}"]`).addEventListener("click", async () => {
    const newName = nameCell.querySelector("input").value.trim();
    const newCity = cityCell.querySelector("input").value.trim();

    if (!newName) return alert("Branch name is required.");

    const res = await apiUpdateBranch(branch.id, {
      name: newName,
      city: newCity
    });

    if (!res.ok) return alert(res.message);

    await window.refreshAndRender();
  });
}