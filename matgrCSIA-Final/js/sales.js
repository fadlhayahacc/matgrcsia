// sales.js

async function apiGetSales() {
  const { data, error } = await window.sb
    .from("sales")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("apiGetSales:", error);
    return [];
  }
  return data || [];
}

async function apiAddSale(payload) {
  const { data, error } = await window.sb
    .from("sales")
    .insert([payload])
    .select()
    .single();

  if (error) return { ok: false, message: error.message };
  return { ok: true, sale: data };
}

async function apiDeleteSale(id) {
  const { error } = await window.sb.from("sales").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

function renderSalesForm(clients, products) {
  const clientSelect = document.getElementById("sale-client");
  const productSelect = document.getElementById("sale-product");
  if (!clientSelect || !productSelect) return;

  clientSelect.innerHTML = "";
  productSelect.innerHTML = "";

  clients.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.name;
    clientSelect.appendChild(opt);
  });

  products.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `${p.name} (${p.price})`;
    productSelect.appendChild(opt);
  });
}

// sales.js (inside your addSale handler)
window.addSale = async function addSale() {
  const client_id = document.getElementById("sale-client").value;
  const product_id = document.getElementById("sale-product").value;
  const qty = Number(document.getElementById("sale-qty").value);
  const errEl = document.getElementById("sale-error");
  if (errEl) errEl.textContent = "";

  if (!client_id || !product_id) {
    if (errEl) errEl.textContent = "Select client + product.";
    return;
  }
  if (!Number.isFinite(qty) || qty < 1) {
    if (errEl) errEl.textContent = "Quantity must be 1 or more.";
    return;
  }

  // get logged-in user id
  const { data: uData, error: uErr } = await window.sb.auth.getUser();
  if (uErr || !uData?.user) {
    if (errEl) errEl.textContent = "Session error. Please log in again.";
    return;
  }

  const created_by = uData.user.id;

  // branch_id must come from profile (global)
  const branch_id = window.profile?.branch_id || null;
  if (!branch_id) {
    if (errEl) errEl.textContent = "No branch assigned to your account.";
    return;
  }

  // get product price from current loaded products in appState
  const prod = (window.appState?.products || []).find(p => p.id === product_id);
  if (!prod) {
    if (errEl) errEl.textContent = "Product not found (refresh).";
    return;
  }

  const total = Number(prod.price) * qty;

  const { error } = await window.sb.from("sales").insert([{
    client_id,
    product_id,
    qty,
    total,
    branch_id,
    created_by
  }]);

  if (error) {
    if (errEl) errEl.textContent = error.message;
    return;
  }

  await window.refreshAndRender();
};

  const res = await apiAddSale(payload);
  if (!res.ok) return (errEl.textContent = res.message);

  document.getElementById("sale-qty").value = "1";
  document.getElementById("sale-final").value = "";
  await window.refreshAndRender();
};

function renderSalesTable(sales, clients, products) {
  const table = document.getElementById("sales-table");
  if (!table) return;

  table.innerHTML = "";

  sales.forEach(s => {
    const client = clients.find(c => c.id === s.client_id);
    const product = products.find(p => p.id === s.product_id);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${s.date || ""}</td>
      <td>${client ? client.name : "Unknown"}</td>
      <td>${product ? product.name : "Unknown"}</td>
      <td>${s.qty}</td>
      <td>${sale.payment_type || "—"}</td>
      <td>${s.total}</td>
      <td><button data-sale-del="${s.id}">Delete</button></td>
    `;
    table.appendChild(row);
  });

  table.querySelectorAll("[data-sale-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-sale-del");
      const res = await apiDeleteSale(id);
      if (!res.ok) return alert(res.message);
      await window.refreshAndRender();
    });
  });
}
