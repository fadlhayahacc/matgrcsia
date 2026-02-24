// main.js

function displayRole(role) {
  const map = {
    ceo: "CEO",
    admin: "Administrator",
    branch_manager: "Branch Manager",
    sales_staff: "Sales Representative",
    pending: "Pending Approval"
  };
  return map[role] || role;
}

let profile = null; // { role, branch_id, approved, ... }
window.profile = null;

let appState = {
  branches: [],
  clients: [],
  products: [],
  sales: [],
  profiles: []
};

document.addEventListener("DOMContentLoaded", () => {
  wireNavigation();
  wireLoginForm();
  wireFeatureButtons();
  wireSettings();
  boot();
});

// ---------- NAV ----------
function wireNavigation() {
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const pageId = btn.getAttribute("data-page");
      showPage(pageId, btn);
    });
  });
}

// ---------- BUTTONS ----------
function wireFeatureButtons() {
  const addClientBtn = document.getElementById("add-client-btn");
  if (addClientBtn) addClientBtn.addEventListener("click", () => window.addClient());

  const addProductBtn = document.getElementById("add-product-btn");
  if (addProductBtn) addProductBtn.addEventListener("click", () => window.addProduct());

  const addSaleBtn = document.getElementById("add-sale-btn");
  if (addSaleBtn) addSaleBtn.addEventListener("click", () => window.addSale());

  const addBranchBtn = document.getElementById("add-branch-btn");
  if (addBranchBtn) addBranchBtn.addEventListener("click", () => window.addBranch());
}

// ---------- BOOT ----------
async function boot() {
  const user = await getSessionUser();
  if (!user) {
    showLogin();
    return;
  }
  await afterLogin(user);
}

// ---------- LOGIN FLOW ----------
async function afterLogin(user) {
  const prof = await fetchMyProfile(user.id);
  if (!prof) {
    showLogin();
    alert("Profile not found. Check profiles table for this user.");
    return;
  }

  profile = prof;
  window.profile = profile;

  console.log("PROFILE LOADED:", profile);

  if (profile.approved !== true) {
    alert("Your account is pending approval. Please contact admin.");
    await signOut();
    showLogin();
    return;
  }

  await refreshAllData();

  showDashboard(user.email, profile.role);
  applyRoleVisibility(profile.role);

  renderAll();
  renderSettings();

  const dashBtn = document.querySelector(".nav-btn[data-page='dashboard-page']");
  showPage("dashboard-page", dashBtn);
}

function wireLoginForm() {
  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    const errEl = document.getElementById("login-error");
    if (errEl) errEl.textContent = "";

    const res = await signIn(email, password);
    if (!res.ok) {
      if (errEl) errEl.textContent = res.message;
      else alert(res.message);
      return;
    }

    await afterLogin(res.user);
  });

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await signOut();
      showLogin();
    });
  }
}

// ---------- PROFILE ----------
async function fetchMyProfile(userId) {
  const { data, error } = await window.sb
    .from("profiles")
    .select("role, branch_id, email, full_name, approved")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("fetchMyProfile error:", error);
    return null;
  }
  return data;
}

// ---------- DATA LOAD ----------
async function refreshAllData() {
  // order doesn't matter much, but branches first helps display names
  appState.branches = await apiGetBranches();
  appState.profiles = await apiGetProfiles();

  appState.clients = await apiGetClients();
  appState.products = await apiGetProducts();
  appState.sales = await apiGetSales();

  // quick stats
  const c = document.getElementById("stat-clients");
  const p = document.getElementById("stat-products");
  const s = document.getElementById("stat-sales");
  if (c) c.textContent = appState.clients.length;
  if (p) p.textContent = appState.products.length;
  if (s) s.textContent = appState.sales.length;
}

// ---------- UI HELPERS ----------
function showLogin() {
  const login = document.getElementById("login-container");
  const app = document.getElementById("app");
  if (login) login.classList.remove("hidden");
  if (app) app.classList.add("hidden");
}

function showDashboard(email, role) {
  const login = document.getElementById("login-container");
  const app = document.getElementById("app");
  if (login) login.classList.add("hidden");
  if (app) app.classList.remove("hidden");

  const sidebarUser = document.getElementById("sidebar-user");
  const sidebarRole = document.getElementById("sidebar-role");
  const welcomeText = document.getElementById("welcome-text");

  if (sidebarUser) sidebarUser.textContent = email;
  if (sidebarRole) sidebarRole.textContent = displayRole(role);
  if (welcomeText) welcomeText.textContent = `Welcome, ${email}`;
}

function applyRoleVisibility(role) {
  const analyticsNav = document.getElementById("nav-analytics");
  const usersNav = document.getElementById("nav-users");
  const branchesNav = document.querySelector('[data-page="branches-page"]');

  // Analytics visible to managers+
  const canSeeAnalytics = (role === "ceo" || role === "admin" || role === "branch_manager");
  if (analyticsNav) analyticsNav.classList.toggle("hidden", !canSeeAnalytics);

  // User management only CEO/admin
  const canManageUsers = (role === "ceo" || role === "admin");
  if (usersNav) usersNav.classList.toggle("hidden", !canManageUsers);

  // Branch page only CEO/admin
  const canSeeBranches = (role === "ceo" || role === "admin");
  if (branchesNav) branchesNav.classList.toggle("hidden", !canSeeBranches);
}

function renderAll() {
  if (typeof renderUsers === "function") {
    renderUsers(appState.profiles, appState.branches);
  }
  renderClients(appState.clients);
  renderProducts(appState.products);
  renderSalesForm(appState.clients, appState.products);
  renderSalesTable(appState.sales, appState.clients, appState.products);
  renderAnalytics(appState.sales, appState.products, appState.clients);
  if (typeof renderBranches === "function") {
    renderBranches(appState.branches);
  }
}

function showPage(pageId, clickedButton) {
  const pages = document.querySelectorAll(".page");
  pages.forEach(p => p.classList.add("hidden"));

  const page = document.getElementById(pageId);
  if (page) page.classList.remove("hidden");

  const buttons = document.querySelectorAll(".nav-btn");
  buttons.forEach(b => b.classList.remove("active"));
  if (clickedButton) clickedButton.classList.add("active");
}

window.refreshAndRender = async function () {
  await refreshAllData();
  renderAll();
  renderSettings();
};

// ---------- SETTINGS ----------
function wireSettings() {
  const btn = document.getElementById("btn-change-password");
  if (btn) {
    btn.addEventListener("click", async () => {
      const newPass = document.getElementById("new-password").value;
      const msg = document.getElementById("password-msg");
      if (msg) msg.textContent = "";

      if (!newPass || newPass.length < 6) {
        if (msg) msg.textContent = "Password must be at least 6 characters.";
        return;
      }

      const res = await updateMyPassword(newPass);
      if (!res.ok) {
        if (msg) msg.textContent = res.message;
        return;
      }

      document.getElementById("new-password").value = "";
      if (msg) msg.textContent = "Password updated successfully ✅";
    });
  }

  const saveNameBtn = document.getElementById("btn-save-name");
  if (saveNameBtn) {
    saveNameBtn.addEventListener("click", async () => {
      const input = document.getElementById("set-fullname-input");
      const msg = document.getElementById("name-msg");
      if (msg) msg.textContent = "";

      const newName = input.value.trim();
      if (!newName) {
        if (msg) msg.textContent = "Please enter your name.";
        return;
      }

      const res = await updateMyFullName(newName);
      if (!res.ok) {
        if (msg) msg.textContent = res.message;
        return;
      }

      if (profile) profile.full_name = res.full_name;
      if (window.profile) window.profile.full_name = res.full_name;

      if (msg) msg.textContent = "Name saved ✅";
      renderSettings();
    });
  }
}

function renderSettings() {
  const emailEl = document.getElementById("set-email");
  const roleEl = document.getElementById("set-role");
  const branchEl = document.getElementById("set-branch");
  const sessionEl = document.getElementById("session-status");
  const nameInput = document.getElementById("set-fullname-input");

  if (emailEl) emailEl.textContent = profile?.email || "—";
  if (roleEl) roleEl.textContent = displayRole(profile?.role || "—");
  if (nameInput) nameInput.value = profile?.full_name || "";

  const branches = appState.branches || [];
  const myBranch = branches.find(b => b.id === profile?.branch_id);
  if (branchEl) branchEl.textContent = myBranch ? myBranch.name : "—";

  if (sessionEl) {
    getSessionUser().then(user => {
      sessionEl.textContent = user ? "Logged in ✅" : "Not logged in ❌";
    });
  }
}
