document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("lead-form");
  const msg = document.getElementById("lead-msg");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (msg) msg.textContent = "";

    const payload = {
      name: document.getElementById("lead-name").value.trim(),
      phone: document.getElementById("lead-phone").value.trim(),
      city: document.getElementById("lead-city").value.trim(),
      product_interest: document.getElementById("lead-interest").value.trim()
    };

    if (!payload.name) {
      if (msg) msg.textContent = "Name is required.";
      return;
    }

    const { error } = await window.sb.from("leads").insert([payload]);
    if (error) {
      if (msg) msg.textContent = error.message;
      return;
    }

    form.reset();
    if (msg) msg.textContent = "Submitted ✅ We will contact you soon.";
  });
});