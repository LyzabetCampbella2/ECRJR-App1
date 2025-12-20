// src/apiClient.js

const API_ORIGIN =
  process.env.REACT_APP_API_ORIGIN ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000";

/**
 * Ensures we never end up with /api/api or double slashes
 */
function joinUrl(origin, path) {
  const o = String(origin || "").replace(/\/+$/, "");
  let p = String(path || "");
  if (!p.startsWith("/")) p = `/${p}`;
  // collapse accidental double /api/api -> /api
  p = p.replace(/^\/api\/api\//, "/api/");
  // collapse any double slashes (keep protocol //)
  return `${o}${p}`.replace(/([^:]\/)\/+/g, "$1");
}

async function request(method, path, body) {
  const url = joinUrl(API_ORIGIN, path);

  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  };

  if (body !== undefined) {
    opts.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(url, opts);
  } catch (err) {
    // Network / CORS / server down
    throw new Error(`Failed to fetch: ${url}`);
  }

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");

  if (!res.ok) {
    // Prefer backend JSON message if present
    const msg =
      (payload && typeof payload === "object" && (payload.message || payload.error)) ||
      (typeof payload === "string" && payload) ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return payload;
}

export function apiGet(path) {
  return request("GET", path);
}

export function apiPost(path, body) {
  return request("POST", path, body);
}

export function apiPut(path, body) {
  return request("PUT", path, body);
}

export function apiDelete(path) {
  return request("DELETE", path);
}
// ---- Mini suite helpers (wrappers used by MiniSuiteRunner) ----

export function startTest(payload) {
  // payload: { profileId } (or whatever your backend expects)
  return apiPost("/api/tests/start", payload);
}

export function submitMiniTest(payload) {
  // payload: { profileId, miniTestId, answers } (adjust keys if your backend expects different)
  return apiPost("/api/mini-tests/submit", payload);
}

export function finishMiniSuite(payload) {
  // payload: { profileId } or { profileId, suiteId }
  return apiPost("/api/mini-tests/finish", payload);
}

