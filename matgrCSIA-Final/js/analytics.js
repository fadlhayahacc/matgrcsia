// analytics.js

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderAnalytics(sales, products, clients) {
  // --------------------------
  // Basic totals
  // --------------------------
  const totalRevenue = sales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);

  const totalEl = document.getElementById("total-revenue");
  if (totalEl) totalEl.textContent = Math.round(totalRevenue);

  const totalSalesEl = document.getElementById("total-sales");
  if (totalSalesEl) totalSalesEl.textContent = sales.length;

  const avg = sales.length === 0 ? 0 : Math.round(totalRevenue / sales.length);
  const avgEl = document.getElementById("avg-order");
  if (avgEl) avgEl.textContent = avg;

  // --------------------------
  // Revenue by category
  // --------------------------
  const categoryRevenue = {};
  sales.forEach(s => {
    const product = products.find(p => p.id === s.product_id);
    if (!product) return;

    const cat = product.category || "Uncategorized";
    categoryRevenue[cat] = (categoryRevenue[cat] || 0) + (Number(s.total) || 0);
  });

  const catTable = document.getElementById("category-table");
  if (catTable) {
    catTable.innerHTML = "";
    Object.keys(categoryRevenue).forEach(cat => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${escapeHtml(cat)}</td><td>${Math.round(categoryRevenue[cat])}</td>`;
      catTable.appendChild(row);
    });
  }

  // --------------------------
  // Revenue by date
  // --------------------------
  const revenueByDate = {};
  sales.forEach(s => {
    const d = s.date || "Unknown";
    revenueByDate[d] = (revenueByDate[d] || 0) + (Number(s.total) || 0);
  });

  const dateTable = document.getElementById("date-table");
  if (dateTable) {
    dateTable.innerHTML = "";
    Object.keys(revenueByDate).sort().forEach(d => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${escapeHtml(d)}</td><td>${Math.round(revenueByDate[d])}</td>`;
      dateTable.appendChild(row);
    });
  }

  // --------------------------
  // Top product by quantity
  // --------------------------
  const productCounts = {};
  sales.forEach(s => {
    const pid = s.product_id;
    productCounts[pid] = (productCounts[pid] || 0) + (Number(s.qty) || 0);
  });

  let topPid = null;
  let topQty = 0;
  Object.keys(productCounts).forEach(pid => {
    if (productCounts[pid] > topQty) {
      topQty = productCounts[pid];
      topPid = pid;
    }
  });

  const topProduct = products.find(p => p.id === topPid);
  const topProductEl = document.getElementById("top-product");
  if (topProductEl) {
    topProductEl.textContent = topProduct ? `${topProduct.name} (${topQty} sold)` : "—";
  }

  // --------------------------
  // Best client by spend
  // --------------------------
  const clientSpend = {};
  sales.forEach(s => {
    const cid = s.client_id;
    clientSpend[cid] = (clientSpend[cid] || 0) + (Number(s.total) || 0);
  });

  let bestCid = null;
  let bestSpend = 0;
  Object.keys(clientSpend).forEach(cid => {
    if (clientSpend[cid] > bestSpend) {
      bestSpend = clientSpend[cid];
      bestCid = cid;
    }
  });

  const bestClient = clients.find(c => c.id === bestCid);
  const bestClientEl = document.getElementById("best-client");
  if (bestClientEl) {
    bestClientEl.textContent = bestClient ? `${bestClient.name} (${Math.round(bestSpend)})` : "—";
  }

  // --------------------------
  // Branch Performance Comparison
  // --------------------------
  const branchMap = {}; // branch_id -> { revenue, count }

  sales.forEach(s => {
    const bid = s.branch_id || "unknown";
    if (!branchMap[bid]) branchMap[bid] = { revenue: 0, count: 0 };
    branchMap[bid].revenue += Number(s.total) || 0;
    branchMap[bid].count += 1;
  });

  const branches = window.appState?.branches || [];
  const tbody = document.getElementById("branch-performance-table");

  if (tbody) {
    tbody.innerHTML = "";

    let topBranchId = null;
    let topRevenue = -1;

    Object.keys(branchMap).forEach(branchId => {
      const revenue = branchMap[branchId].revenue;
      const count = branchMap[branchId].count;
      const avgOrder = count === 0 ? 0 : Math.round(revenue / count);

      const branch = branches.find(b => b.id === branchId);
      const branchName = branch ? branch.name : (branchId === "unknown" ? "Unknown" : "Branch");

      if (revenue > topRevenue) {
        topRevenue = revenue;
        topBranchId = branchId;
      }

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${escapeHtml(branchName)}</td>
        <td>${Math.round(revenue)}</td>
        <td>${count}</td>
        <td>${avgOrder}</td>
      `;
      tbody.appendChild(row);
    });

    const topText = document.getElementById("top-branch-text");
    if (topText) {
      const topBranch = branches.find(b => b.id === topBranchId);
      topText.textContent = topBranch
        ? `Top branch: ${topBranch.name} (${Math.round(topRevenue)} revenue)`
        : "";
    }
  }

  // --------------------------
  // Employee Performance Ranking
  // --------------------------
  const repMap = {}; // user_id -> { revenue, count }

  sales.forEach(s => {
    const uid = s.created_by || "unknown";
    if (!repMap[uid]) repMap[uid] = { revenue: 0, count: 0 };
    repMap[uid].revenue += Number(s.total) || 0;
    repMap[uid].count += 1;
  });

  const profiles = window.appState?.profiles || [];

  const repRows = Object.keys(repMap).map(uid => {
    const prof = profiles.find(p => p.id === uid);
    return {
      uid,
      email: prof?.email || (uid === "unknown" ? "Unknown" : uid),
      revenue: Math.round(repMap[uid].revenue),
      count: repMap[uid].count
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const repTbody = document.getElementById("rep-performance-table");
  if (repTbody) {
    repTbody.innerHTML = "";

    repRows.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(r.email)}</td>
        <td>${r.revenue}</td>
        <td>${r.count}</td>
      `;
      repTbody.appendChild(tr);
    });
  }
}