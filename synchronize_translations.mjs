#!/usr/bin/env node

import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

// --- Helper Functions ---

/**
 * Placeholder translation function.
 * In a real scenario, this would call a translation API.
 */
async function translate(text, sourceLang, targetLang) {
  console.warn(`NEEDS_TRANSLATION: [${targetLang.toUpperCase()}] From ${sourceLang.toUpperCase()}: "${text}"`);
  if (targetLang === 'zh') {
    return `[待翻译ZH] ${text}`;
  } else if (targetLang === 'en') {
    return `[NEEDS_TRANSLATION_EN] ${text}`;
  } else if (targetLang === 'ja') {
    return `[待翻訳JA] ${text}`;
  }
  return text; // Fallback
}

/**
 * Loads a JSON file.
 * Returns an empty object if the file doesn't exist or is invalid JSON.
 */
async function loadJsonFile(filePath) {
  try {
    const data = await readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`File not found: ${filePath}. Starting with an empty object.`);
      return {};
    }
    console.error(`Error reading or parsing JSON from ${filePath}:`, error.message);
    return {}; // Default to empty object on other errors too
  }
}

/**
 * Saves an object to a JSON file, pretty-printed.
 * Creates the directory if it doesn't exist.
 */
async function saveJsonFile(filePath, data) {
  try {
    const dirname = path.dirname(filePath);
    await mkdir(dirname, { recursive: true });
    // Sort keys alphabetically for consistent output
    const sortedData = Object.keys(data).sort().reduce((obj, key) => {
        obj[key] = data[key];
        return obj;
    }, {});
    await writeFile(filePath, JSON.stringify(sortedData, null, 2), 'utf-8');
    console.log(`Successfully saved ${filePath}`);
  } catch (error) {
    console.error(`Error writing JSON to ${filePath}:`, error.message);
  }
}

/**
 * Generates a default English string from a key.
 * e.g., "myNewKey" -> "My new key", "common.submit" -> "Submit"
 */
function generateDefaultEnglish(key) {
  // Take the last part of a dot-separated key
  const lastPart = key.includes('.') ? key.substring(key.lastIndexOf('.') + 1) : key;
  // Convert camelCase to Title Case with spaces
  const withSpaces = lastPart.replace(/([A-Z]+)/g, ' $1').replace(/([A-Z][a-z])/g, ' $1');
  // Capitalize the first letter and trim, handle multiple spaces
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1).toLowerCase().trim().replace(/\s+/g, ' ');
}


// --- Main Synchronization Logic ---

async function synchronize(keysFilePath, enFilePath, zhFilePath, jaFilePath) {
  try {
    const keysFromSourceFile = await loadJsonFile(keysFilePath);
    if (!Array.isArray(keysFromSourceFile)) {
      console.error(`Error: Keys file ${keysFilePath} does not contain a JSON array.`);
      process.exit(1);
    }

    let enTranslations = await loadJsonFile(enFilePath);
    let zhTranslations = await loadJsonFile(zhFilePath);
    let jaTranslations = {};
    if (jaFilePath) {
      jaTranslations = await loadJsonFile(jaFilePath);
    }

    const masterKeySet = new Set(keysFromSourceFile);
    Object.keys(enTranslations).forEach(key => masterKeySet.add(key));
    Object.keys(zhTranslations).forEach(key => masterKeySet.add(key));
    if (jaFilePath) {
      Object.keys(jaTranslations).forEach(key => masterKeySet.add(key));
    }
    
    console.log('\n--- Synchronizing translations for all known keys ---');

    for (const key of masterKeySet) {
      let englishTextForKey = enTranslations[key];

      // 1. Ensure English translation exists
      if (!englishTextForKey || englishTextForKey.trim() === "" || englishTextForKey.startsWith("[NEEDS_TRANSLATION_EN]")) {
        const defaultEnglishText = generateDefaultEnglish(key);
        enTranslations[key] = defaultEnglishText;
        englishTextForKey = defaultEnglishText; // Update for immediate use
        console.log(`EN: Added/Updated key "${key}" with default: "${defaultEnglishText}"`);
      }

      // 2. Ensure Chinese translation exists or is updated (based on current English text)
      if (
        !zhTranslations[key] ||
        zhTranslations[key].trim() === "" ||
        zhTranslations[key].startsWith('[NEEDS_TRANSLATION_ZH]') ||
        zhTranslations[key].startsWith('[待翻译ZH]')
      ) {
        const newChineseTranslation = await translate(englishTextForKey, 'en', 'zh');
        if (zhTranslations[key] !== newChineseTranslation) {
            zhTranslations[key] = newChineseTranslation;
            console.log(`ZH: Translated/Updated key "${key}" from English: "${englishTextForKey}"`);
        }
      }

      // 3. Ensure Japanese translation exists or is updated (if jaFilePath provided)
      if (jaFilePath) {
        if (
          !jaTranslations[key] ||
          jaTranslations[key].trim() === "" ||
          jaTranslations[key].startsWith('[NEEDS_TRANSLATION_JA]') || // More specific placeholder
          jaTranslations[key].startsWith('[待翻訳JA]')
        ) {
          const newJapaneseTranslation = await translate(englishTextForKey, 'en', 'ja');
          if (jaTranslations[key] !== newJapaneseTranslation) {
              jaTranslations[key] = newJapaneseTranslation;
              console.log(`JA: Translated/Updated key "${key}" from English: "${englishTextForKey}"`);
          }
        }
      }
    }
    
    // Optional: Cleanup step - Remove keys from translation objects if they are not in keysFromSourceFile
    // This can be added if desired, but for now, we are additive or update based on masterKeySet.
    // Example for English:
    // enTranslations = Object.fromEntries(Object.entries(enTranslations).filter(([k]) => keysFromSourceFile.includes(k)));
    // Similar for zhTranslations and jaTranslations.

    console.log('\n--- Saving updated translation files ---');
    await saveJsonFile(enFilePath, enTranslations);
    await saveJsonFile(zhFilePath, zhTranslations);
    if (jaFilePath) {
      await saveJsonFile(jaFilePath, jaTranslations);
    }

    console.log('\nSynchronization complete.');

  } catch (error) {
    console.error('An unexpected error occurred during synchronization:', error);
    process.exit(1);
  }
}

// --- Script Execution ---

if (process.argv.length < 5 || process.argv.length > 6) { // node, script, keys, en, zh, [ja]
  console.error('Usage: node synchronize_translations.mjs <keysFilePath> <enFilePath> <zhFilePath> [jaFilePath]');
  console.error('Example: node synchronize_translations.mjs internationalization_keys.json public/locales/en/translation.json public/locales/zh/translation.json public/locales/ja/translation.json');
  process.exit(1);
}

const [,, keysFilePath, enFilePath, zhFilePath, jaFilePath] = process.argv; // jaFilePath will be undefined if not passed

synchronize(keysFilePath, enFilePath, zhFilePath, jaFilePath);
