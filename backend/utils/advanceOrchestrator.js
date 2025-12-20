// backend/utils/advanceOrchestrator.js
// ESM (works with "type":"module")
//
// Advanced orchestrator:
// - Enforces day-gated flow (default 7 days, configurable via definition.schedule.days)
// - Enforces daily Likert batches via definition.schedule.dayMap[day].likertIds (Option A)
// - Enforces 3 small art assignments/day (configurable via definition.schedule.assignmentsPerDay)
// - Supports optional day-gated uploads via definition.schedule.dayMap[day].uploadIds
// - Prevents skipping days
// - Saves computed results payload on completion (archetype + luminary/shadow + scores)
//
// Expected call:
// advanceOrchestrator({
//   userId,
//   attemptId,
//   testId,
//   definition,   // locked attempt snapshot
//   progress,     // stored progress object
//   submitted: {
//     day,
//     answers: [{ questionId, value }],
//     uploads: [{ uploadId, url, questionId?, meta? }],
//     assignments: [{ day, assignmentId, responseText?, uploadUrl? }]
//   }
// })

import { buildResultPayload } from "./resultsEngine.js";

function nowIso() {
  return new Date().toISOString();
}

function asArray(v) {
  return Array.isArray(v) ? v : [];
}

function toInt(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function getMaxDays(definition) {
  const d = toInt(definition?.schedule?.days, null);
  if (d && d > 0) return d;
  const d2 = toInt(definition?.days, null);
  if (d2 && d2 > 0) return d2;
  return 7;
}

function getAssignmentsPerDay(definition) {
  const a = toInt(definition?.schedule?.assignmentsPerDay, null);
  if (a && a > 0) return a;
  return 3;
}

function flattenQuestions(definition) {
  const out = [];
  for (const cat of asArray(definition?.categories)) {
    const catId = cat.categoryId || cat.id || cat.name || "uncategorized";
    const catTitle = cat.title || cat.name || catId;
    for (const q of asArray(cat?.questions)) {
      out.push({
        ...q,
        _categoryId: catId,
        _categoryTitle: catTitle
      });
    }
  }
  return out;
}

function getLikertQuestionIds(definition) {
  return flattenQuestions(definition)
    .filter((q) => q.type === "likert" && q.questionId)
    .map((q) => q.questionId);
}

function getRequiredLikertForDay(definition, day) {
  // Option A: daily batches come from dayMap
  const dayMap = definition?.schedule?.dayMap;
  const entry = dayMap?.[String(day)];
  if (entry && Array.isArray(entry.likertIds) && entry.likertIds.length) {
    return entry.likertIds;
  }

  // Fallback: require all likerts if no dayMap (keeps system usable)
  return getLikertQuestionIds(definition);
}

function getRequiredUploadsForDay(definition, day) {
  // Optional day-based upload requirements
  const dayMap = definition?.schedule?.dayMap;
  const entry = dayMap?.[String(day)];
  if (entry && Array.isArray(entry.uploadIds) && entry.uploadIds.length) {
    return entry.uploadIds;
  }
  return [];
}

function answersSatisfy(answers, requiredLikertIds) {
  const set = new Set(asArray(answers).map((a) => a?.questionId).filter(Boolean));
  return requiredLikertIds.every((id) => set.has(id));
}

function uploadsSatisfy(uploads, requiredUploadQuestionIds) {
  if (!requiredUploadQuestionIds.length) return true;

  const withQid = asArray(uploads).filter((u) => u?.questionId);

  // If upload items include questionId, validate exactly
  if (withQid.length) {
    const set = new Set(withQid.map((u) => u.questionId));
    return requiredUploadQuestionIds.every((qid) => set.has(qid));
  }

  // Otherwise, accept count-based satisfaction
  return asArray(uploads).length >= requiredUploadQuestionIds.length;
}

function mergeAnswers(prevAnswers, submittedAnswers) {
  const map = new Map();

  for (const a of asArray(prevAnswers)) {
    if (!a?.questionId) continue;
    map.set(a.questionId, a);
  }

  for (const a of asArray(submittedAnswers)) {
    if (!a?.questionId) continue;
    map.set(a.questionId, { ...a, updatedAt: nowIso() });
  }

  return Array.from(map.values());
}

function mergeUploads(prevUploads, submittedUploads) {
  const uploads = [...asArray(prevUploads), ...asArray(submittedUploads)]
    .filter(Boolean)
    .map((u) => ({ ...u, createdAt: u.createdAt || nowIso() }));

  // Dedupe by uploadId if present
  const byId = new Map();
  const noId = [];
  for (const u of uploads) {
    if (u?.uploadId) byId.set(u.uploadId, u);
    else noId.push(u);
  }
  return [...Array.from(byId.values()), ...noId];
}

function mergeAssignments(prevAssignments, submittedAssignments) {
  // Dedupe by (day + assignmentId): latest wins
  const map = new Map();

  for (const a of asArray(prevAssignments)) {
    if (!a) continue;
    const k = `${toInt(a.day, 0)}:${a.assignmentId || "unknown"}`;
    map.set(k, a);
  }

  for (const a of asArray(submittedAssignments)) {
    if (!a) continue;
    const k = `${toInt(a.day, 0)}:${a.assignmentId || "unknown"}`;
    map.set(k, { ...a, updatedAt: nowIso() });
  }

  return Array.from(map.values());
}

function countAssignmentsForDay(assignments, day) {
  return asArray(assignments).filter((a) => toInt(a?.day, 0) === day).length;
}

function buildNextPayload(definition, progress) {
  const day = toInt(progress?.day, 1);
  const requiredLikertIds = getRequiredLikertForDay(definition, day);
  const requiredUploadIds = getRequiredUploadsForDay(definition, day);
  const assignmentsPerDay = getAssignmentsPerDay(definition);

  const answeredSet = new Set(asArray(progress?.answers).map((a) => a?.questionId).filter(Boolean));
  const missingLikertIds = requiredLikertIds.filter((id) => !answeredSet.has(id));

  const uploadsOk = uploadsSatisfy(progress?.uploads, requiredUploadIds);
  const assignmentsDone = countAssignmentsForDay(progress?.assignments, day);

  return {
    day,
    required: {
      likertCount: requiredLikertIds.length,
      uploadCount: requiredUploadIds.length,
      assignmentsPerDay
    },
    status: {
      missingLikertCount: missingLikertIds.length,
      missingLikertIds,
      uploadsOk,
      assignmentsDone,
      assignmentsRemaining: Math.max(0, assignmentsPerDay - assignmentsDone)
    }
  };
}

function clampUploadCountIfNeeded(definition, uploads) {
  // User requirement: only 1-10 uploads total (cap at 10).
  // If you want exact per-day windows, use dayMap uploadIds.
  const cap = toInt(definition?.schedule?.maxUploadsTotal, 10);
  const arr = asArray(uploads);
  if (arr.length <= cap) return arr;
  return arr.slice(0, cap);
}

// Lightweight scoring (kept for mid-test feedback)
// Final results come from resultsEngine.buildResultPayload
function normalizeLikert(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n >= 1 && n <= 5) return (n - 1) / 4;
  if (n >= 0 && n <= 10) return n / 10;
  return null;
}

function scoreByCategory(definition, answers) {
  const qs = flattenQuestions(definition).filter((q) => q.type === "likert");
  const byQ = new Map(qs.map((q) => [q.questionId, q]));

  const catTotals = new Map(); // catId -> { sum, n, title }
  for (const a of asArray(answers)) {
    const q = byQ.get(a?.questionId);
    if (!q) continue;

    const v = normalizeLikert(a?.value);
    if (v === null) continue;

    const prev = catTotals.get(q._categoryId) || { sum: 0, n: 0, title: q._categoryTitle };
    catTotals.set(q._categoryId, { sum: prev.sum + v, n: prev.n + 1, title: prev.title });
  }

  const categories = [];
  for (const [catId, t] of catTotals.entries()) {
    categories.push({
      categoryId: catId,
      title: t.title,
      average01: t.n ? t.sum / t.n : 0,
      answered: t.n
    });
  }

  const overall01 =
    categories.length
      ? categories.reduce((acc, c) => acc + c.average01, 0) / categories.length
      : 0;

  return { overall01, categories };
}

export async function advanceOrchestrator({
  userId,
  attemptId,
  testId,
  definition,
  progress = {},
  submitted = {}
}) {
  // --- Guard: definition snapshot required
  if (!definition) {
    return {
      completed: false,
      message: "Missing definition snapshot.",
      progress,
      next: { error: "missing_definition" }
    };
  }

  const maxDays = getMaxDays(definition);
  const assignmentsPerDay = getAssignmentsPerDay(definition);

  const currentDay = toInt(progress?.day, 1);
  const submittedDay = toInt(submitted?.day, currentDay);

  // --- Guard: no skipping/rewinding days
  if (submittedDay !== currentDay) {
    return {
      completed: false,
      message: `Cannot submit this day right now. Expected day ${currentDay}, received day ${submittedDay}.`,
      progress,
      next: buildNextPayload(definition, progress)
    };
  }

  // --- Merge submission into progress
  const updatedAnswers = mergeAnswers(progress.answers, submitted.answers);
  const updatedUploadsRaw = mergeUploads(progress.uploads, submitted.uploads);
  const updatedUploads = clampUploadCountIfNeeded(definition, updatedUploadsRaw);
  const updatedAssignments = mergeAssignments(progress.assignments, submitted.assignments);

  const updatedProgress = {
    ...progress,
    day: currentDay,
    answers: updatedAnswers,
    uploads: updatedUploads,
    assignments: updatedAssignments,
    lastSubmittedAt: nowIso()
  };

  // --- Requirements for day completion
  const requiredLikertIds = getRequiredLikertForDay(definition, currentDay);
  const requiredUploadIds = getRequiredUploadsForDay(definition, currentDay);

  const hasAllAnswers = answersSatisfy(updatedAnswers, requiredLikertIds);
  const hasUploads = uploadsSatisfy(updatedUploads, requiredUploadIds);
  const assignmentCount = countAssignmentsForDay(updatedAssignments, currentDay);
  const hasAssignments = assignmentCount >= assignmentsPerDay;

  // Mid-test scoring snapshot (optional; useful for feedback)
  const scores = scoreByCategory(definition, updatedAnswers);

  // --- Not complete for day: save + return what’s missing
  if (!hasAllAnswers || !hasUploads || !hasAssignments) {
    const reasons = [];
    if (!hasAllAnswers) reasons.push("missing_answers");
    if (!hasUploads) reasons.push("missing_uploads");
    if (!hasAssignments) reasons.push("missing_assignments");

    return {
      completed: false,
      message: `Submission saved, but day ${currentDay} is not complete: ${reasons.join(", ")}.`,
      scores,
      progress: updatedProgress,
      next: buildNextPayload(definition, updatedProgress)
    };
  }

  // --- Day complete → advance or complete test
  const isFinalDay = currentDay >= maxDays;

  if (isFinalDay) {
    // Build final user-facing results (archetype + luminary/shadow + scores)
    const results = buildResultPayload(definition, updatedAnswers);

    const completedProgress = {
      ...updatedProgress,
      day: maxDays,
      completedAt: nowIso(),
      results
    };

    return {
      completed: true,
      message: "Test completed.",
      scores,
      results,
      progress: completedProgress,
      next: null
    };
  }

  const nextDay = currentDay + 1;

  const progressed = {
    ...updatedProgress,
    day: nextDay
  };

  return {
    completed: false,
    message: `Day ${currentDay} completed. Advancing to day ${nextDay}.`,
    scores,
    progress: progressed,
    next: buildNextPayload(definition, progressed)
  };
}
