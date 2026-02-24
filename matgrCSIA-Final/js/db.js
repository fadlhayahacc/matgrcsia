// db.js
console.log("db.js loaded ✅");
console.log("window.supabase =", window.supabase);

const SUPABASE_URL = "https://qruxiybjlaqnljauhbwq.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFydXhpeWJqbGFxbmxqYXVoYndxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MzU3NjEsImV4cCI6MjA4NzMxMTc2MX0.IndQk0a3Vio9luUcCQ9DUPSCvt7QwCxArkyIbAK-r9U"

if (!window.supabase || typeof window.supabase.createClient !== "function") {
  throw new Error("Supabase CDN not loaded correctly. Check the script tag order.");
}

// Create client
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Simple alias used by all files
window.sb = window.supabaseClient;

console.log("✅ window.sb ready =", window.sb);