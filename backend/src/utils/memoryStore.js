const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../../data/devDb.json");

let store = {
  profiles: {},
  progressLogs: [],
  resultsByProfile: {}
};

function load() {
  try {
    if (fs.existsSync(DB_PATH)) {
      store = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
      console.log("✅ Dev DB loaded");
    }
  } catch (e) {
    console.error("❌ Failed to load dev DB:", e.message);
  }
}

function save() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(store, null, 2));
  } catch (e) {
    console.error("❌ Failed to save dev DB:", e.message);
  }
}

function id() {
  return Math.random().toString(36).substring(2, 10);
}

load();

module.exports = {
  store,
  save,
  id
};
