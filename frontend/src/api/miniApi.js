const API_BASE = "http://localhost:5000";

export async function fetchMiniTest(miniId) {
  const res = await fetch(`${API_BASE}/api/mini-tests/${encodeURIComponent(miniId)}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
  return json;
}

export async function scoreMiniSuite(answersByTest) {
  const res = await fetch(`${API_BASE}/api/mini-tests/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answersByTest }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.details || json?.error || `HTTP ${res.status}`);
  return json;
}
