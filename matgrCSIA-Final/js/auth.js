// auth.js

let currentUser = null;

function getSb() {
  if (!window.sb) {
    throw new Error("Supabase client not ready. window.sb is undefined. Check db.js.");
  }
  return window.sb;
}

async function signIn(email, password) {
  const sb = getSb();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, message: error.message };

  currentUser = data.user;
  return { ok: true, user: data.user };
}

async function signOut() {
  const sb = getSb();
  await sb.auth.signOut();
  currentUser = null;
}

async function getSessionUser() {
  const sb = getSb();
  const { data, error } = await sb.auth.getUser();
  if (error) return null;
  return data.user || null;
}

async function updateMyPassword(newPassword) {
  const sb = window.sb;
  const { data, error } = await sb.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, message: error.message };
  return { ok: true, data };
}

async function updateMyFullName(newName) {
  // current user id is the same as profiles.id
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Session expired. Please log in again." };

  const { data, error } = await window.sb
    .from("profiles")
    .update({ full_name: newName })
    .eq("id", user.id)
    .select("full_name")
    .single();

  if (error) return { ok: false, message: error.message };
  return { ok: true, full_name: data.full_name };
}