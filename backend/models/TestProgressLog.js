// backend/utils/testProgressLog.js
/**
 * testProgressLog.js
 * ------------------
 * Lightweight progress/event logger for debugging + audit during pilot.
 *
 * - NO Express logic
 * - NO database requirements
 * - Safe even if unused
 *
 * Usage:
 *   const progressLog = require("../utils/testProgressLog");
 *   progressLog.log({ userId, testId, event: "SUBMIT_OK", meta: {...} });
 *   const items = progressLog.get(userId);
 */

const MAX_PER_USER = 200; // keep memory bounded

// In-memory store: Map<userId, Array<event>>
const store = new Map();

function nowIso() {
  return new Date().toISOString();
}

function safeUserId(userId) {
  if (!userId) return "unknown";
  return String(userId);
}

function clampArray(arr, max) {
  if (!Array.isArray(arr)) return [];
  if (arr.length <= max) return arr;
  return arr.slice(arr.length - max);
}

function log({ userId, testId = "", event = "EVENT", meta = {} }) {
  const uid = safeUserId(userId);

  const entry = {
    ts: nowIso(),
    userId: uid,
    testId: typeof testId === "string" ? testId : String(testId || ""),
    event: typeof event === "string" ? event : String(event || "EVENT"),
    meta: meta && typeof meta === "object" ? meta : { value: String(meta) },
  };

  const existing = store.get(uid) || [];
  existing.push(entry);

  store.set(uid, clampArray(existing, MAX_PER_USER));
  return entry;
}

function get(userId, { limit = 50 } = {}) {
  const uid = safeUserId(userId);
  const existing = store.get(uid) || [];
  const lim = typeof limit === "number" ? Math.max(1, Math.min(500, limit)) : 50;
  return existing.slice(Math.max(0, existing.length - lim));
}

function getAll({ limitPerUser = 25 } = {}) {
  const lim = typeof limitPerUser === "number" ? Math.max(1, Math.min(200, limitPerUser)) : 25;

  const out = [];
  for (const [uid, events] of store.entries()) {
    const tail = Array.isArray(events) ? events.slice(Math.max(0, events.length - lim)) : [];
    out.push({ userId: uid, events: tail });
  }
  return out;
}

function clear(userId) {
  const uid = safeUserId(userId);
  store.delete(uid);
  return true;
}

function clearAll() {
  store.clear();
  return true;
}

function summary(userId) {
  const uid = safeUserId(userId);
  const events = store.get(uid) || [];
  if (!events.length) return { userId: uid, count: 0, last: null };

  const last = events[events.length - 1];
  const counts = events.reduce((acc, e) => {
    acc[e.event] = (acc[e.event] || 0) + 1;
    return acc;
  }, {});

  return {
    userId: uid,
    count: events.length,
    counts,
    last,
  };
}

module.exports = {
  log,
  get,
  getAll,
  clear,
  clearAll,
  summary,
};
