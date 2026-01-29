const fs = require("fs");
const path = require("path");

const LANG_DIR = path.join(__dirname, "../lang");

// ---- helpers ----
function getKeys(obj, prefix = "") {
  let keys = [];
  for (const k in obj) {
    const current = prefix ? `${prefix}.${k}` : k;
    if (obj[k] && typeof obj[k] === "object" && !Array.isArray(obj[k])) {
      keys = keys.concat(getKeys(obj[k], current));
    } else {
      keys.push(current);
    }
  }
  return keys;
}

// ---- load files ----
const files = fs
  .readdirSync(LANG_DIR)
  .filter(f => f.endsWith(".json"));

if (!files.length) {
  console.log("No hay archivos JSON en lang/");
  process.exit(0);
}

const allKeys = {};
const union = new Set();

// ---- parse ----
for (const file of files) {
  const filePath = path.join(LANG_DIR, file);
  const json = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const keys = getKeys(json);
  allKeys[file] = new Set(keys);

  keys.forEach(k => union.add(k));
}

// ---- compare ----
console.log("\n===== RESULTS =====\n");

for (const file of files) {
  const missing = [...union].filter(k => !allKeys[file].has(k));

  if (!missing.length) {
    console.log(`✅ ${file} OK`);
  } else {
    console.log(`❌ ${file} it's missing ${missing.length} keys:`);
    missing.forEach(k => console.log("   -", k));
  }

  console.log("");
}
