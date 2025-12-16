const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

async function parseJson(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

export async function apiGet(path) {
  const res = await fetch(`${API}${path}`);
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data?.message || `GET ${path} failed`);
  return data;
}

export async function apiPost(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {})
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data?.message || `POST ${path} failed`);
  return data;
}
export async function getResults(profileId) {
  return apiGet(`/api/tests/results/${profileId}`);
}
