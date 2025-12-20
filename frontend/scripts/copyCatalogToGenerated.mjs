import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "src", "data");
const SRC = path.join(DATA_DIR, "archetypesCatalog.json");
const DST = path.join(DATA_DIR, "archetypesCatalog.generated.json");

if (!fs.existsSync(SRC)) {
  console.error("❌ Source catalog not found:", SRC);
  process.exit(1);
}

fs.copyFileSync(SRC, DST);
console.log(`✅ Copied ${SRC} -> ${DST}`);
