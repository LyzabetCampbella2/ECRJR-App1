import fs from "fs";
import path from "path";

function loadJson(absPath) {
  if (!fs.existsSync(absPath)) return null;
  return JSON.parse(fs.readFileSync(absPath, "utf-8"));
}

export function loadBlueprint(testId) {
  const p = path.join(process.cwd(), "data", "tests", `${testId}.blueprint.json`);
  return loadJson(p);
}

export function loadBank(testId) {
  const p = path.join(process.cwd(), "data", "tests", `${testId}.bank.json`);
  return loadJson(p);
}
