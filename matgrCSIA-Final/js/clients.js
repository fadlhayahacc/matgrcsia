// clients.js

// -------------------- API --------------------
async function apiGetClients() {
  const { data, error } = await window.sb
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("apiGetClients:", error);
    return [];
  }
  return data || [];
}

async function apiAddClient(payload) {
  const { data, error } = await window.sb
    .from("clients")
    .insert([payload])
    .select()
    .single();

  if (error) return { ok: false, message: error.message };
  return { ok: true, client: data };
}

async function apiDeleteClient(id) {
  const { error } = await window.sb.from("clients").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

async function apiUpdateClient(id, payload) {
  const { data, error } = await window.sb
    .from("clients")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, message: error.message };
  return { ok: true, client: data };
}

// -------------------- UI ACTIONS --------------------
window.addClient = async function addClient() {
  const name = document.getElementById("client-name")?.value.trim();
  const phone = document.getElementById("client-phone")?.value.trim();
  const city = document.getElementById("client-city")?.value.trim();
  const errEl = document.getElementById("client-error");

  if (errEl) errEl.textContent = "";
  if (!name || !phone || !city) {
    if (errEl) errEl.textContent = "All fields are required.";
    return;
  }

  const branchId = window.profile?.branch_id || null;

  const res = await apiAddClient({ name, phone, city, branch_id: branchId });
  if (!res.ok) {
    if (errEl) errEl.textContent = res.message;
    return;
  }

  document.getElementById("client-name").value = "";
  document.getElementById("client-phone").value = "";
  document.getElementById("client-city").value = "";

  await window.refreshAndRender();
};

// -------------------- UI RENDER --------------------
function renderClients(clients) {
  const table = document.getElementById("clients-table");
  if (!table) return;

  table.innerHTML = "";

  clients.forEach(client => {
    const row = document.createElement("tr");
    
    const sales = window.appState?.sales || [];
    const purchases = sales.filter(s => s.client_id === client.id).length;

 row.innerHTML = `
   <td>${escapeHtml(client.name)}</td>
   <td>${escapeHtml(client.phone || "")}</td>
   <td>${escapeHtml(client.city || "")}</td>
   <td>${purchases}</td>
   <td>
   <button type="button" data-del="${client.id}">Delete</button>
   </td>
  `;

    table.appendChild(row);

    // Delete
    row.querySelector(`[data-del="${client.id}"]`).addEventListener("click", async () => {
      const res = await apiDeleteClient(client.id);
      if (!res.ok) return alert(res.message);
      await window.refreshAndRender();
    });

    // Edit
    row.querySelector(`[data-edit="${client.id}"]`).addEventListener("click", () => {
      enterClientEditMode(row, client);
    });
  });
}

// -------------------- EDIT MODE --------------------
function enterClientEditMode(row, client) {
  const nameCell = row.querySelector(`[data-cell="name"]`);
  const phoneCell = row.querySelector(`[data-cell="phone"]`);
  const cityCell = row.querySelector(`[data-cell="city"]`);
  const actionCell = row.lastElementChild;

  nameCell.innerHTML = `<input type="text" value="${escapeAttr(client.name)}" />`;
  phoneCell.innerHTML = `<input type="text" value="${escapeAttr(client.phone || "")}" />`;
  cityCell.innerHTML = `<input type="text" value="${escapeAttr(client.city || "")}" />`;

  actionCell.innerHTML = `
    <button type="button" data-save="${client.id}">Save</button>
    <button type="button" data-cancel="${client.id}">Cancel</button>
  `;

  actionCell.querySelector(`[data-cancel="${client.id}"]`).addEventListener("click", async () => {
    await window.refreshAndRender();
  });

  actionCell.querySelector(`[data-save="${client.id}"]`).addEventListener("click", async () => {
    const newName = nameCell.querySelector("input").value.trim();
    const newPhone = phoneCell.querySelector("input").value.trim();
    const newCity = cityCell.querySelector("input").value.trim();

    if (!newName || !newPhone || !newCity) {
      alert("All fields are required.");
      return;
    }

    const res = await apiUpdateClient(client.id, {
      name: newName,
      phone: newPhone,
      city: newCity
    });

    if (!res.ok) return alert(res.message);

    await window.refreshAndRender();
  });
}

// -------------------- HELPERS --------------------
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttr(str) {
  return escapeHtml(str).replaceAll('"', "&quot;");
}