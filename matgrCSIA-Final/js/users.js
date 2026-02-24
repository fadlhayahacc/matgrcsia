// users.js
console.log("users.js loaded ✅");

async function apiGetProfiles() {
  const { data, error } = await window.sb
    .from("profiles")
    .select("id, email, role, branch_id, approved, requested_at")
    .order("requested_at", { ascending: false });

  if (error) {
    console.error("apiGetProfiles:", error);
    return [];
  }
  return data || [];
}

async function apiUpdateProfile(id, payload) {
  const { data, error } = await window.sb
    .from("profiles")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, message: error.message };
  return { ok: true, profile: data };
}

function renderUsers(profiles, branches) {
  const pendingTbody = document.getElementById("pending-users-table");
  const allTbody = document.getElementById("all-users-table");
  if (!pendingTbody || !allTbody) return;

  const branchName = (id) => {
    const b = branches.find(x => x.id === id);
    return b ? b.name : "—";
  };

  const pending = profiles.filter(p => p.approved !== true);
  const approved = profiles.filter(p => p.approved === true);

  // Pending table
  pendingTbody.innerHTML = "";
  pending.forEach(p => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${p.email || ""}</td>
      <td>Pending</td>
      <td>
        <select id="role-${p.id}">
          <option value="sales_staff">Sales Rep</option>
          <option value="branch_manager">Branch Manager</option>
          <option value="admin">Admin</option>
          <option value="ceo">CEO</option>
        </select>
      </td>
      <td>
        <select id="branch-${p.id}">
          ${branches.map(b => `<option value="${b.id}">${b.name}</option>`).join("")}
        </select>
      </td>
      <td><button type="button" onclick="approveUser('${p.id}')">Approve</button></td>
    `;
    pendingTbody.appendChild(row);
  });

  // All users table
  allTbody.innerHTML = "";
  approved.forEach(p => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${p.email || ""}</td>
      <td>${p.role || ""}</td>
      <td>${branchName(p.branch_id)}</td>
      <td>${p.approved ? "✅" : "❌"}</td>
    `;
    allTbody.appendChild(row);
  });
}

async function approveUser(id) {
  const role = document.getElementById(`role-${id}`).value;
  const branchId = document.getElementById(`branch-${id}`).value;

  const { error } = await window.sb
    .from("profiles")
    .update({ approved: true, role: role, branch_id: branchId })
    .eq("id", id);

  if (error) return alert(error.message);

  await window.refreshAndRender();
}

function roleOption(value, current) {
  const sel = value === current ? "selected" : "";
  return `<option value="${value}" ${sel}>${value}</option>`;
}

function escapeHtml(str) {
  return String(str).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}