// src/apiUpload.js
import { apiPost } from "./apiClient";

/**
 * Upload files for a test/question
 * Expects backend endpoint: POST /api/uploads
 * Body: multipart/form-data
 */
export async function uploadFiles({ testId, questionId, files }) {
  const fd = new FormData();
  fd.append("testId", testId);
  fd.append("questionId", questionId);
  files.forEach((f) => fd.append("files", f));

  // If your apiPost doesn’t support FormData, use fetch directly:
  const res = await fetch("/api/uploads", {
    method: "POST",
    body: fd,
  });

  const data = await res.json();
  if (!res.ok || data?.success === false) {
    throw new Error(data?.message || "Upload failed");
  }
  return data; // should include urls
}
