// src/apiAccess.js
// Frontend helper for validating pilot tester codes

const API_BASE = "http://localhost:5000"; // change if needed

export async function validatePilotCode(code) {
  const res = await fetch(`${API_BASE}/api/access/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data?.success === false) {
    throw new Error(data?.message || "Invalid pilot code");
  }

  return data; // expected: { success:true, role:"pilot", accessLevel:"pilot"|"founder"|... }
}
