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
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
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
  const withSpaces = lastPart.replace(/([A-Z])/g, ' $1');
  // Capitalize the first letter and trim
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1).toLowerCase().trim();
}


// --- Main Synchronization Logic ---

async function synchronize(keysFilePath, enFilePath, zhFilePath) {
  try {
    const keysFromFile = await loadJsonFile(keysFilePath);
    if (!Array.isArray(keysFromFile)) {
      console.error(`Error: Keys file ${keysFilePath} does not contain a JSON array.`);
      process.exit(1);
    }

    let enTranslations = await loadJsonFile(enFilePath);
    let zhTranslations = await loadJsonFile(zhFilePath);

    const allKnownKeys = new Set(keysFromFile);

    console.log('\n--- Synchronizing translations ---');

    // 1. Iterate through keys from keysFilePath
    for (const key of keysFromFile) {
      // Ensure English translation exists
      if (!enTranslations[key] || enTranslations[key].trim() === "") {
        const defaultEnglishText = generateDefaultEnglish(key);
        enTranslations[key] = defaultEnglishText;
        console.log(`EN: Added/Updated key "${key}" with default: "${defaultEnglishText}"`);
        // If English text was missing or just generated, Chinese translation needs update
        const chineseTranslation = await translate(defaultEnglishText, 'en', 'zh');
        if (zhTranslations[key] !== chineseTranslation) {
             zhTranslations[key] = chineseTranslation;
             console.log(`ZH: Updated key "${key}" by translating from new/updated English text.`);
        }
      }

      // Ensure Chinese translation exists or is updated if it's a placeholder
      const englishTextForKey = enTranslations[key];
      if (
        !zhTranslations[key] ||
        zhTranslations[key].trim() === "" ||
        zhTranslations[key].startsWith('[NEEDS_TRANSLATION_ZH]') ||
        zhTranslations[key].startsWith('[待翻译ZH]')
      ) {
        if (!englishTextForKey) { // Should not happen if previous block worked
            console.warn(`WARN: English text for key "${key}" is missing. Cannot translate to Chinese.`);
            continue;
        }
        const newChineseTranslation = await translate(englishTextForKey, 'en', 'zh');
        if (zhTranslations[key] !== newChineseTranslation) {
            zhTranslations[key] = newChineseTranslation;
            console.log(`ZH: Translated/Updated key "${key}" from English: "${englishTextForKey}"`);
        }
      }
    }

    // 2. Iterate through keys in Chinese translations not in keysFilePath
    // These are potentially unused keys, but we ensure they also exist in English for now.
    console.log('\n--- Handling keys present in Chinese but not in keys file ---');
    const zhOnlyKeys = Object.keys(zhTranslations).filter(k => !allKnownKeys.has(k));

    for (const keyInZhOnly of zhOnlyKeys) {
      allKnownKeys.add(keyInZhOnly); // Add to known keys to avoid reprocessing if it was also in enTranslations
      if (!enTranslations[keyInZhOnly] || enTranslations[keyInZhOnly].trim() === "") {
        const chineseTextForKey = zhTranslations[keyInZhOnly];
        // Avoid translating if the Chinese text itself is a placeholder
        if (chineseTextForKey.startsWith('[NEEDS_TRANSLATION_ZH]') || chineseTextForKey.startsWith('[待翻译ZH]')) {
            console.log(`EN: Skipped translating placeholder Chinese text for key "${keyInZhOnly}" to English.`);
            // Optionally, generate default English if it's truly missing
            enTranslations[keyInZhOnly] = generateDefaultEnglish(keyInZhOnly);
            console.log(`EN: Added key "${keyInZhOnly}" from Chinese file with default English: "${enTranslations[keyInZhOnly]}"`);
        } else {
            const newEnglishTranslation = await translate(chineseTextForKey, 'zh', 'en');
            enTranslations[keyInZhOnly] = newEnglishTranslation;
            console.log(`EN: Translated key "${keyInZhOnly}" from Chinese: "${chineseTextForKey}"`);
        }
      }
    }
    
    // Optional: Clean up keys in translation files that are not in allKnownKeys (from keysFile + zhFile)
    // For now, we are additive or update existing ones.
    // A cleanup step could be:
    // enTranslations = Object.fromEntries(Object.entries(enTranslations).filter(([k]) => allKnownKeys.has(k)));
    // zhTranslations = Object.fromEntries(Object.entries(zhTranslations).filter(([k]) => allKnownKeys.has(k)));
    // console.log('\n--- Cleanup: Removed keys not found in source keys file or Chinese translations ---');


    console.log('\n--- Saving updated translation files ---');
    await saveJsonFile(enFilePath, enTranslations);
    await saveJsonFile(zhFilePath, zhTranslations);

    console.log('\nSynchronization complete.');

  } catch (error) {
    console.error('An unexpected error occurred during synchronization:', error);
    process.exit(1);
  }
}

// --- Script Execution ---

if (process.argv.length !== 5) {
  console.error('Usage: node synchronize_translations.mjs <keysFilePath> <enFilePath> <zhFilePath>');
  console.error('Example: node synchronize_translations.mjs internationalization_keys.json public/locales/en/translation.json public/locales/zh/translation.json');
  process.exit(1);
}

const [,, keysFilePath, enFilePath, zhFilePath] = process.argv;

synchronize(keysFilePath, enFilePath, zhFilePath);
