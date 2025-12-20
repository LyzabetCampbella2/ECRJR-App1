const KEY = "eirden_access_v1";

export function setAccess(payload) {
  localStorage.setItem(KEY, JSON.stringify(payload));
}

export function getAccess() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAccess() {
  localStorage.removeItem(KEY);
}

export function hasPilotAccess() {
  const a = getAccess();
  return Boolean(a?.role === "pilot" && a?.code);
}
