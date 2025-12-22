const KEY = "eirden.miniSuite.latest";

export function saveMiniSuiteResult(payload) {
  try {
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch (e) {
    // ignore storage errors
  }
}

export function loadMiniSuiteResult() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function clearMiniSuiteResult() {
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    // ignore
  }
}
