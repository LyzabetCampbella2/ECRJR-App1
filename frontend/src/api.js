export async function apiGet(path) {
  const res = await fetch(path, { headers: { Accept: "application/json" } });
  const text = await res.text();

  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg = data?.message || data?.error || `Request failed: ${res.status}`;
    throw new Error(msg);
  }
  return data;
}
