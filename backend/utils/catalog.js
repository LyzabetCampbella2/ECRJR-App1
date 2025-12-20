import fs from "fs";
import path from "path";

let cache = null;

export function loadCatalogs() {
  if (cache) return cache;

  const lumPath = path.join(process.cwd(), "data", "luminaries.catalog.json");
  const shadPath = path.join(process.cwd(), "data", "shadows.catalog.json");

  const luminaries = JSON.parse(fs.readFileSync(lumPath, "utf-8"));
  const shadows = JSON.parse(fs.readFileSync(shadPath, "utf-8"));

  const lumById = Object.fromEntries(luminaries.map(x => [x.id, x]));
  const shadById = Object.fromEntries(shadows.map(x => [x.id, x]));

  cache = { luminaries, shadows, lumById, shadById };
  return cache;
}
