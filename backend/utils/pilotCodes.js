export function makePilotCode(nameOrHandle) {
  const base = String(nameOrHandle || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // short checksum-ish suffix
  const seed = base || "PILOT";
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const suffix = (hash % 10000).toString().padStart(4, "0");

  return `EIRDEN-PILOT-${base || "TESTER"}-${suffix}`;
}
