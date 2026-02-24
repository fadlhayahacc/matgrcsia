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

window.addSale = async function addSale() {
  const clientId = document.getElementById("sale-client").value;
  const productId = document.getElementById("sale-product").value;
  const qty = Number(document.getElementById("sale-qty").value);
  const paymentType = document.getElementById("sale-payment").value;
  const finalRaw = document.getElementById("sale-final").value;
  const errEl = document.getElementById("sale-error");
  if (errEl) errEl.textContent = "";

  if (!clientId || !productId) return (errEl.textContent = "Select client & product.");
  if (!Number.isFinite(qty) || qty < 1) return (errEl.textContent = "Qty must be 1+.");

  // product price lookup (from appState)
  const product = window.appState?.products?.find(p => p.id === productId);
  if (!product) return (errEl.textContent = "Product not found.");

  const autoTotal = (Number(product.price) || 0) * qty;

  // final price optional override
  const finalPrice = finalRaw === "" ? autoTotal : Number(finalRaw);
  if (!Number.isFinite(finalPrice) || finalPrice < 0) return (errEl.textContent = "Final price must be valid.");

  // created_by = current user
  const user = await getSessionUser();
  if (!user) return (errEl.textContent = "Session expired. Please log in again.");

  const payload = {
    client_id: clientId,
    product_id: productId,
    qty: qty,
    total: finalPrice,          // keep using total for analytics
    final_price: finalPrice,    // explicit final price column
    payment_type: paymentType,
    branch_id: window.profile?.branch_id || null,
    created_by: user.id
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