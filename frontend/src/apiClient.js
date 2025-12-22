// src/apiClient.js
/**
 * Eirden API Client (CRA proxy mode)
 * ---------------------------------
 * You have "proxy": "http://localhost:5000" in frontend/package.json
 * That means:
 *   fetch("/api/....") -> http://localhost:3000/api/... -> proxied to http://localhost:5000/api/...
 *
 * IMPORTANT:
 * - API_BASE should be "" (relative) in dev.
 * - For production builds, you can set REACT_APP_API_BASE to your deployed backend origin.
 */

const RAW_BASE = (process.env.REACT_APP_API_BASE || "").trim();
export const API_BASE = RAW_BASE.replace(/\/+$/, ""); // usually "" in dev

function joinUrl(base, path) {
  const p = String(path || "");
  if (!p) return base || "";
  if (/^https?:\/\//i.test(p)) return p;

  if (!base) {
    // CRA proxy mode
    return p.startsWith("/") ? p : `/${p}`;
  }

  if (p.startsWith("/")) return base + p;
  return base + "/" + p;
}

async function readResponseBody(res) {
  // Always read as text first, then try JSON. Prevents:
  // Unexpected token 'P', "Proxy erro"... is not valid JSON
  const text = await res.text().catch(() => "");
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text; // return raw text (proxy errors, html, etc.)
  }
}

function normalizeFetchError(err) {
  const msg = String(err?.message || err || "");

  // Browser network error often shows "Failed to fetch"
  if (err?.name === "TypeError" && /failed to fetch/i.test(msg)) {
    return new Error(
      "Failed to fetch. Check:\n" +
        "• backend is running: http://localhost:5000\n" +
        "• CRA proxy is set (it is) and frontend is running: http://localhost:3000\n" +
        "• endpoint path is correct (no /api/api double prefix)\n"
    );
  }

  return err instanceof Error ? err : new Error(msg || "Unknown error");
}

async function request(method, path, options = {}) {
  const url = joinUrl(API_BASE, path);

  const {
    body,
    headers = {},
    credentials = "include",
    signal,
    raw = false,
  } = options;

  const init = {
    method,
    credentials,
    signal,
    headers: { ...headers },
  };

  // If body is FormData, do not set Content-Type
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  if (body !== undefined) {
    if (isFormData) {
      init.body = body;
    } else {
      init.headers["Content-Type"] = init.headers["Content-Type"] || "application/json";
      init.body = typeof body === "string" ? body : JSON.stringify(body);
    }
  }

  try {
    const res = await fetch(url, init);
    if (raw) return res;

    const data = await readResponseBody(res);

    if (!res.ok) {
      // Prefer JSON message fields if present, else raw text.
      let msgOut =
        (data && typeof data === "object" && (data.message || data.error)) ||
        (typeof data === "string" && data) ||
        `Request failed (${res.status})`;

      // Special hint if proxy error text returned
      if (typeof data === "string" && /^proxy error/i.test(data.trim())) {
        msgOut =
          data +
          "\n\nProxy notes:\n" +
          "• Make sure backend is running on port 5000.\n" +
          "• Restart CRA dev server after changing proxy/package.json.\n";
      }

      const e = new Error(msgOut);
      e.status = res.status;
      e.data = data;
      e.url = url;
      throw e;
    }

    return data;
  } catch (e) {
    throw normalizeFetchError(e);
  }
}

/** Basic JSON helpers */
export function apiGet(path, opts) {
  return request("GET", path, opts);
}
export function apiPost(path, body, opts = {}) {
  return request("POST", path, { ...opts, body });
}
export function apiPut(path, body, opts = {}) {
  return request("PUT", path, { ...opts, body });
}
export function apiDelete(path, opts) {
  return request("DELETE", path, opts);
}

/**
 * Upload helper
 * Backend: POST /api/uploads/image (multipart/form-data field "file")
 * Returns: { ok:true, file:{ url, filename, ... } }
 */
export async function apiUploadImage(file) {
  if (!file) throw new Error("No file selected.");

  const form = new FormData();
  form.append("file", file);

  const data = await request("POST", "/api/uploads/image", { body: form });

  const url = data?.file?.url;
  if (!url) throw new Error("Upload succeeded but no URL returned.");
  return data;
}

/**
 * Compatibility exports (some pages import these names).
 * Adjust endpoints if your backend differs.
 */
export function submitMiniTest(payload) {
  return apiPost("/api/mini-tests/score", payload);
}
export function finishMiniSuite(payload) {
  return apiPost("/api/mini-tests/finish", payload);
}
export function startTest(payload) {
  return apiPost("/api/tests/start", payload);
}

/**
 * Convert returned paths like "/uploads/xyz.png" into an absolute URL.
 * In CRA proxy mode, <img src="/uploads/xyz.png"> would hit 3000 (not proxied),
 * so we point directly to backend when API_BASE is empty.
 */
export function toAbsoluteUrl(maybePath) {
  const p = String(maybePath || "");
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;

  // If API_BASE is set (prod), use it
  if (API_BASE) return joinUrl(API_BASE, p);

  // Dev proxy mode: uploads must be fetched from backend static server
  // because CRA proxy does NOT proxy static <img> requests reliably.
  // (It proxies API calls; images are better direct)
  const normalized = p.startsWith("/") ? p : `/${p}`;
  return `http://localhost:5000${normalized}`;
}
