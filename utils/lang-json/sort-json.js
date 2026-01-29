/**
 * SORT JSON TRANSLATION FILE
 * 
 * Sorts the translation JSON file with the following structure:
 * 1. Simple keys (strings) sorted alphabetically
 * 2. Object keys sorted alphabetically
 * 
 * This is applied recursively to all nested objects.
 * 
 * USAGE:
 *   node utils/sort-json.js
 */

const fs = require("fs");
const path = require("path");

const LANG_FILE = path.join(__dirname, "../lang/es.json");

function sortObject(obj) {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return obj;
  }

  const simpleKeys = [];
  const objectKeys = [];

  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      objectKeys.push(key);
    } else {
      simpleKeys.push(key);
    }
  }

  simpleKeys.sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
  objectKeys.sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));

  const sorted = {};

  for (const key of simpleKeys) {
    sorted[key] = obj[key];
  }

  for (const key of objectKeys) {
    sorted[key] = sortObject(obj[key]);
  }

  return sorted;
}

try {
  console.log("📖 Reading lang/es.json...");
  const content = fs.readFileSync(LANG_FILE, "utf8");
  const json = JSON.parse(content);

  console.log("🔄 Sorting keys...");
  const sorted = sortObject(json);

  console.log("💾 Writing sorted JSON...");
  fs.writeFileSync(LANG_FILE, JSON.stringify(sorted, null, 2) + "\n", "utf8");

  console.log("✅ Done! lang/es.json has been sorted.");
  console.log("\nStructure:");
  console.log("  1. Simple keys (strings) - alphabetically");
  console.log("  2. Object keys - alphabetically");
  console.log("  (Applied recursively to all nested objects)");

} catch (err) {
  console.error("❌ Error:", err.message);
  process.exit(1);
}

