export function makePilotCode() {
  const prefix = "PILOT";
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `${prefix}-${date}-${rand}`;
}

// Optional alias (so either name works elsewhere)
export const generatePilotCode = makePilotCode;
