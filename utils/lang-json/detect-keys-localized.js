/**
 * DETECT LOCALIZED KEYS
 *
 * Analyzes code to detect translation key usage.
 *
 * USAGE:
 *   node utils/detect-keys-localized.js
 *
 * FUNCTIONALITY:
 *   - Detects keys used in code (localize, game.i18n.localize, etc.)
 *   - Identifies keys in lang/es.json that are NOT being used
 *   - Finds keys used in code but NOT existing in lang/es.json
 *   - Detects dynamic patterns (e.g., RYF.${variable})
 *   - Suggests corrections for missing keys based on similarity
 *
 * DETECTED PATTERNS:
 *   - localize('KEY')              - JavaScript function
 *   - localize "KEY"               - Handlebars helper
 *   - game.i18n.localize('KEY')    - Foundry API
 *   - game.i18n.format('KEY')      - Format with parameters
 *   - name: 'KEY'                  - Foundry settings (auto-localized)
 *   - hint: 'KEY'                  - Foundry settings (auto-localized)
 *   - label: 'KEY'                 - Foundry settings (auto-localized)
 *   - choices: { key: 'KEY' }      - Foundry settings choices (auto-localized)
 *   - system.json packs[].label    - Compendium labels (auto-localized)
 *   - condition ? 'KEY1' : 'KEY2'  - Ternary operators with translation keys
 *
 * OUTPUT:
 *   - Summary with statistics
 *   - Detected dynamic patterns
 *   - List of unused keys
 *   - Suggestions for missing keys (smart matching)
 *   - List of missing keys (with files where they are used)
 */

const fs = require("fs");
const path = require("path");

const LANG_FILE = path.join(__dirname, "../lang/es.json");
const SYSTEM_JSON = path.join(__dirname, "../system.json");
const ROOT_DIR = path.join(__dirname, "..");

// ---------------- HELPERS ----------------

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

function walk(dir, filelist = []) {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);

    if (full.includes("node_modules") || full.includes(".git") || full.includes("utils")) continue;

    if (fs.statSync(full).isDirectory()) {
      walk(full, filelist);
    } else {
      filelist.push(full);
    }
  }
  return filelist;
}

function extractUsedKeys(content) {
  const found = new Set();
  const dynamic = new Set();

  const patterns = [
    /localize\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
    /localize\s+['"`]([^'"`]+)['"`]/g,
    /game\.i18n\.localize\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
    /game\.i18n\.format\(\s*['"`]([^'"`]+)['"`]/g,
    /name:\s*['"`]([^'"`]+)['"`]/g,
    /hint:\s*['"`]([^'"`]+)['"`]/g,
    /label:\s*['"`]([^'"`]+)['"`]/g,
  ];

  for (const regex of patterns) {
    let match;
    while ((match = regex.exec(content))) {
      const key = match[1];
      if (key.includes('${')) {
        dynamic.add(key);
      } else {
        found.add(key);
      }
    }
  }

  const ternaryPattern = /\?\s*['"`](RYF\.[^'"`]+)['"`]\s*:\s*['"`](RYF\.[^'"`]+)['"`]/g;
  let ternaryMatch;
  while ((ternaryMatch = ternaryPattern.exec(content))) {
    const key1 = ternaryMatch[1];
    const key2 = ternaryMatch[2];
    if (key1.includes('${')) {
      dynamic.add(key1);
    } else {
      found.add(key1);
    }
    if (key2.includes('${')) {
      dynamic.add(key2);
    } else {
      found.add(key2);
    }
  }

  const choicesPattern = /choices:\s*\{([^}]+)\}/g;
  let choicesMatch;
  while ((choicesMatch = choicesPattern.exec(content))) {
    const choicesBlock = choicesMatch[1];
    const keyPattern = /['"`]([^'"`]+)['"`]/g;
    let keyMatch;
    while ((keyMatch = keyPattern.exec(choicesBlock))) {
      const key = keyMatch[1];
      if (key.startsWith('RYF.')) {
        if (key.includes('${')) {
          dynamic.add(key);
        } else {
          found.add(key);
        }
      }
    }
  }

  return { static: found, dynamic };
}

function extractSystemJsonKeys() {
  const found = new Set();

  try {
    const systemJson = JSON.parse(fs.readFileSync(SYSTEM_JSON, "utf8"));

    if (systemJson.packs && Array.isArray(systemJson.packs)) {
      for (const pack of systemJson.packs) {
        if (pack.label && pack.label.startsWith('RYF.')) {
          found.add(pack.label);
        }
      }
    }
  } catch (err) {
    console.error(`Error reading system.json: ${err.message}`);
  }

  return found;
}

function matchesDynamicPattern(key, pattern) {
  const escapedPattern = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\\\$\\\{[^}]+\\\}/g, '[^.]+');

  const regex = new RegExp(`^${escapedPattern}$`);
  return regex.test(key);
}

function levenshteinDistance(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function findSimilarKeys(missingKey, availableKeys, threshold = 0.6) {
  const suggestions = [];
  const missingLower = missingKey.toLowerCase();
  const missingParts = missingKey.split('.');

  for (const availableKey of availableKeys) {
    const availableLower = availableKey.toLowerCase();
    const availableParts = availableKey.split('.');

    let score = 0;
    let reasons = [];

    const distance = levenshteinDistance(missingLower, availableLower);
    const maxLength = Math.max(missingKey.length, availableKey.length);
    const similarity = 1 - (distance / maxLength);

    if (similarity >= threshold) {
      score = similarity;
      reasons.push(`similarity: ${(similarity * 100).toFixed(0)}%`);
    }

    const lastPartMissing = missingParts[missingParts.length - 1];
    const lastPartAvailable = availableParts[availableParts.length - 1];
    if (lastPartMissing.toLowerCase() === lastPartAvailable.toLowerCase()) {
      score += 0.3;
      reasons.push('same last segment');
    }

    const commonParts = missingParts.filter(part =>
      availableParts.some(ap => ap.toLowerCase() === part.toLowerCase())
    );
    if (commonParts.length > 0) {
      const commonRatio = commonParts.length / Math.max(missingParts.length, availableParts.length);
      score += commonRatio * 0.2;
      reasons.push(`${commonParts.length} common segments`);
    }

    if (score > 0.5 && reasons.length > 0) {
      suggestions.push({
        key: availableKey,
        score: score,
        reasons: reasons
      });
    }
  }

  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

// ---------------- MAIN ----------------

const langJson = JSON.parse(fs.readFileSync(LANG_FILE, "utf8"));
const langKeys = new Set(getKeys(langJson));

const files = walk(ROOT_DIR).filter(f =>
  (f.endsWith(".js") || f.endsWith(".mjs") || f.endsWith(".hbs") || f.endsWith(".html")) &&
  !f.includes(path.sep + "lang" + path.sep) &&
  !f.includes(path.sep + "utils" + path.sep)
);

const usedKeys = new Set();
const dynamicPatterns = new Set();
const fileUsage = new Map();

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  const { static: staticKeys, dynamic: dynamicKeys } = extractUsedKeys(content);

  staticKeys.forEach(k => {
    usedKeys.add(k);
    if (!fileUsage.has(k)) {
      fileUsage.set(k, []);
    }
    fileUsage.get(k).push(path.relative(ROOT_DIR, file));
  });

  dynamicKeys.forEach(k => {
    dynamicPatterns.add(k);
  });
}

const systemJsonKeys = extractSystemJsonKeys();
systemJsonKeys.forEach(k => {
  usedKeys.add(k);
  if (!fileUsage.has(k)) {
    fileUsage.set(k, []);
  }
  fileUsage.get(k).push("system.json");
});

// ---------------- REPORT ----------------

const potentiallyUsedByDynamic = new Set();
const dynamicMatches = new Map();

[...langKeys].forEach(key => {
  for (const pattern of dynamicPatterns) {
    if (matchesDynamicPattern(key, pattern)) {
      potentiallyUsedByDynamic.add(key);
      if (!dynamicMatches.has(pattern)) {
        dynamicMatches.set(pattern, []);
      }
      dynamicMatches.get(pattern).push(key);
      break;
    }
  }
});

const unused = [...langKeys].filter(k => !usedKeys.has(k) && !potentiallyUsedByDynamic.has(k));
const missing = [...usedKeys].filter(k => !langKeys.has(k));
const totalUsed = usedKeys.size + potentiallyUsedByDynamic.size;

const suggestions = new Map();
missing.forEach(missingKey => {
  const similar = findSimilarKeys(missingKey, [...langKeys]);
  if (similar.length > 0) {
    //suggestions.set(missingKey, similar);
  }
});

console.log("\n" + "=".repeat(60));
console.log("  I18N TRANSLATION KEYS ANALYSIS REPORT");
console.log("=".repeat(60) + "\n");

console.log("📊 SUMMARY");
console.log("-".repeat(60));
console.log(`📦 Total keys in es.json:              ${langKeys.size}`);
console.log(`✅ Used statically in code:             ${usedKeys.size}`);
console.log(`🔄 Used via dynamic patterns:           ${potentiallyUsedByDynamic.size}`);
console.log(`📈 Total used (static + dynamic):       ${totalUsed}`);
console.log(`🟡 Unused keys:                         ${unused.length}`);
console.log(`🔴 Missing keys (in code, not in JSON): ${missing.length}`);
console.log(`💡 Suggestions available:               ${suggestions.size}`);
console.log(`📁 Files analyzed:                      ${files.length}`);
console.log(`🔄 Dynamic patterns detected:           ${dynamicPatterns.size}\n`);

if (dynamicPatterns.size > 0) {
  console.log("🔄 DYNAMIC PATTERNS DETECTED");
  console.log("-".repeat(60));
  [...dynamicPatterns].sort().forEach(p => {
    console.log(`  Pattern: ${p}`);
    const matches = dynamicMatches.get(p) || [];
    if (matches.length > 0) {
      console.log(`  Matches (${matches.length}): ${matches.slice(0, 5).join(', ')}${matches.length > 5 ? '...' : ''}`);
    }
    console.log();
  });
}

console.log("🟡 UNUSED KEYS (" + unused.length + ")");
console.log("-".repeat(60));
if (unused.length > 0) {
  unused.sort().forEach(k => console.log(`  - ${k}`));
} else {
  console.log("  ✅ All keys are being used!");
}

if (suggestions.size > 0) {
  console.log("\n💡 SUGGESTIONS - Possible corrections");
  console.log("-".repeat(60));

  const missingWithSuggestions = [...missing].filter(k => suggestions.has(k)).sort();
  const missingWithoutSuggestions = [...missing].filter(k => !suggestions.has(k)).sort();

  missingWithSuggestions.forEach(missingKey => {
    console.log(`\n  ❌ ${missingKey}`);
    const files = fileUsage.get(missingKey) || [];
    files.forEach(f => console.log(`      📄 ${f}`));

    const similar = suggestions.get(missingKey);
    console.log(`      💡 Did you mean:`);
    similar.forEach((suggestion, index) => {
      console.log(`         ${index + 1}. ${suggestion.key}`);
      console.log(`            (${suggestion.reasons.join(', ')})`);
    });
  });

  if (missingWithoutSuggestions.length > 0) {
    console.log("\n  ❌ Missing keys without suggestions:");
    missingWithoutSuggestions.forEach(k => {
      console.log(`\n  - ${k}`);
      const files = fileUsage.get(k) || [];
      files.forEach(f => console.log(`      📄 ${f}`));
    });
  }
} else {
  console.log("\n🔴 MISSING KEYS - In code but NOT in JSON (" + missing.length + ")");
  console.log("-".repeat(60));
  if (missing.length > 0) {
    missing.sort().forEach(k => {
      console.log(`  - ${k}`);
      const files = fileUsage.get(k) || [];
      files.forEach(f => console.log(`      📄 ${f}`));
    });
  } else {
    console.log("  ✅ No missing keys!");
  }
}

console.log("\n" + "=".repeat(60));
console.log("  END OF REPORT");
console.log("=".repeat(60) + "\n");
