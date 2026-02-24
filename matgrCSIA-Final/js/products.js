// products.js

async function apiGetProducts() {
  const { data, error } = await window.sb
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("apiGetProducts:", error);
    return [];
  }
  return data || [];
}

async function apiAddProduct(payload) {
  const { data, error } = await window.sb
    .from("products")
    .insert([payload])
    .select()
    .single();

  if (error) return { ok: false, message: error.message };
  return { ok: true, product: data };
}

async function apiDeleteProduct(id) {
  const { error } = await window.sb.from("products").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

async function apiUpdateProduct(id, payload) {
  const { data, error } = await window.sb
    .from("products")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, message: error.message };
  return { ok: true, product: data };
}

window.addProduct = async function addProduct() {
  const name = document.getElementById("product-name").value.trim();
  const category = document.getElementById("product-category").value.trim();
  const priceRaw = document.getElementById("product-price").value;
  const errEl = document.getElementById("product-error");

  if (errEl) errEl.textContent = "";

  const price = Number(priceRaw);
  if (!name || !category || !priceRaw) {
    if (errEl) errEl.textContent = "All fields are required.";
    return;
  }
  if (!Number.isFinite(price) || price <= 0) {
    if (errEl) errEl.textContent = "Price must be a positive number.";
    return;
  }

  const branchId = window.profile?.branch_id || null;

  const res = await apiAddProduct({
    name,
    category,
    price,
    branch_id: branchId
  });

  if (!res.ok) {
    if (errEl) errEl.textContent = res.message;
    return;
  }

  document.getElementById("product-name").value = "";
  document.getElementById("product-category").value = "";
  document.getElementById("product-price").value = "";

  await window.refreshAndRender();
};

function renderProducts(products) {
  const table = document.getElementById("products-table");
  if (!table) return;

  table.innerHTML = "";

  products.forEach(p => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td data-cell="name">${escapeHtml(p.name)}</td>
      <td data-cell="category">${escapeHtml(p.category || "")}</td>
      <td data-cell="price">${p.price}</td>
      <td>
        <button data-edit="${p.id}">Edit</button>
        <button data-del="${p.id}">Delete</button>
      </td>
    `;

    table.appendChild(row);

    // Delete
    row.querySelector(`[data-del="${p.id}"]`).addEventListener("click", async () => {
      const res = await apiDeleteProduct(p.id);
      if (!res.ok) return alert(res.message);
      await window.refreshAndRender();
    });

    // Edit
    row.querySelector(`[data-edit="${p.id}"]`).addEventListener("click", () => {
      enterProductEditMode(row, p);
    });
  });
}

function enterProductEditMode(row, product) {
  const nameCell = row.querySelector(`[data-cell="name"]`);
  const categoryCell = row.querySelector(`[data-cell="category"]`);
  const priceCell = row.querySelector(`[data-cell="price"]`);
  const actionCell = row.lastElementChild;

  nameCell.innerHTML = `<input type="text" value="${escapeAttr(product.name)}" />`;
  categoryCell.innerHTML = `<input type="text" value="${escapeAttr(product.category || "")}" />`;
  priceCell.innerHTML = `<input type="number" min="1" value="${escapeAttr(product.price)}" />`;

  actionCell.innerHTML = `
    <button data-save="${product.id}">Save</button>
    <button data-cancel="${product.id}">Cancel</button>
  `;

  actionCell.querySelector(`[data-cancel="${product.id}"]`).addEventListener("click", async () => {
    await window.refreshAndRender();
  });

  actionCell.querySelector(`[data-save="${product.id}"]`).addEventListener("click", async () => {
    const newName = nameCell.querySelector("input").value.trim();
    const newCategory = categoryCell.querySelector("input").value.trim();
    const newPrice = Number(priceCell.querySelector("input").value);

    if (!newName || !newCategory) return alert("Name and category are required.");
    if (!Number.isFinite(newPrice) || newPrice <= 0) return alert("Price must be positive.");

    const res = await apiUpdateProduct(product.id, {
      name: newName,
      category: newCategory,
      price: newPrice
    });

    if (!res.ok) return alert(res.message);

    await window.refreshAndRender();
  });
}