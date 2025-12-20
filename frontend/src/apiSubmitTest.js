// src/apiSubmitTest.js
import { apiPost } from "./apiClient";

/**
 * Submit final answers to backend
 * Expects backend endpoint: POST /api/tests/submit
 */
export async function submitTest({ testId, answers }) {
  return apiPost("/api/tests/submit", { testId, answers });
}
