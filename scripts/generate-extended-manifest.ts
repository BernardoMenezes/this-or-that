/**
 * Script to generate an extended library manifest by fetching icons from SymboTalk API
 * This creates a comprehensive manifest with ~1000 icons for offline use
 *
 * Run with: bun run scripts/generate-extended-manifest.ts
 */

import * as fs from "fs";
import * as path from "path";
import { getTopWords, type WordEntry } from "./curated-word-list";

const BASE_URL = "https://symbotalkapiv1.azurewebsites.net";

interface SymboTalkSymbol {
  _id: string;
  id: number;
  name: string;
  image_url: string;
  image_url_alt?: string;
  repo?: string;
  license?: string;
}

interface ManifestItem {
  id: string;
  label: string;
  category: string;
  image: string;
  priority: number;
}

interface ExtendedManifest {
  version: string;
  generated: string;
  standard: ManifestItem[];
  extended: ManifestItem[];
  totalCount: number;
}

// Clean up label by removing trailing numbers (e.g., "salmon 1" -> "salmon")
function cleanLabel(name: string): string {
  return name.replace(/\s+\d+$/, "").trim();
}

// Search for a symbol via SymboTalk API
async function searchSymbol(query: string): Promise<SymboTalkSymbol | null> {
  try {
    const params = new URLSearchParams({
      name: query.trim(),
      lang: "en",
      repo: "arasaac",
      limit: "1",
    });

    const response = await fetch(`${BASE_URL}/search/?${params}`);

    if (!response.ok) {
      return null;
    }

    const text = await response.text();
    if (!text || text.trim() === "" || !text.startsWith("[")) {
      return null;
    }

    const data: SymboTalkSymbol[] = JSON.parse(text);

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    return data[0];
  } catch {
    return null;
  }
}

// Convert word to a slug-style ID
function toId(word: string): string {
  return word
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Capitalize first letter of each word
function toLabel(word: string): string {
  return word
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function main() {
  console.log("=== Generating Extended Library Manifest ===\n");

  // Load existing standard manifest
  const manifestPath = path.join(
    __dirname,
    "../public/library-manifest.json"
  );
  const existingManifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  const existingStandard: ManifestItem[] = existingManifest.standard.map(
    (item: any) => ({
      ...item,
      priority: 1,
    })
  );

  // Check if we have an existing extended manifest to resume from
  const extendedManifestPath = path.join(
    __dirname,
    "../public/extended-manifest.json"
  );
  let existingExtended: ManifestItem[] = [];
  if (fs.existsSync(extendedManifestPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(extendedManifestPath, "utf-8"));
      if (existing.extended && Array.isArray(existing.extended)) {
        existingExtended = existing.extended;
        console.log(`Resuming from existing manifest with ${existingExtended.length} extended items\n`);
      }
    } catch {
      console.log("Could not parse existing manifest, starting fresh\n");
    }
  }

  // Create a set of existing words to avoid duplicates (including already fetched extended)
  const existingWords = new Set([
    ...existingStandard.map((item) => item.label.toLowerCase()),
    ...existingExtended.map((item) => item.label.toLowerCase()),
  ]);

  console.log(`Existing standard items: ${existingStandard.length}`);
  console.log(`Words already in library: ${Array.from(existingWords).slice(0, 10).join(", ")}...\n`);

  // Get top words from curated list, excluding existing ones
  const targetCount = 900; // We want ~900 new words to reach ~1000 total
  const allWords = getTopWords(1200); // Get more than needed to account for failures
  const wordsToFetch = allWords.filter(
    (w) => !existingWords.has(w.word.toLowerCase())
  );

  console.log(`Words to fetch (after filtering existing): ${wordsToFetch.length}\n`);

  const extendedItems: ManifestItem[] = [];
  const failedWords: string[] = [];
  let processed = 0;
  let successCount = 0;

  for (const wordEntry of wordsToFetch) {
    if (successCount >= targetCount) {
      console.log(`\nReached target of ${targetCount} extended items!`);
      break;
    }

    processed++;
    process.stdout.write(
      `\r[${processed}/${wordsToFetch.length}] Searching: ${wordEntry.word.padEnd(25)} (Success: ${successCount}/${targetCount})`
    );

    const symbol = await searchSymbol(wordEntry.word);

    if (symbol) {
      extendedItems.push({
        id: toId(wordEntry.word),
        label: toLabel(wordEntry.word),
        category: wordEntry.category,
        image: symbol.image_url,
        priority: wordEntry.priority,
      });
      successCount++;
    } else {
      failedWords.push(wordEntry.word);
    }

    // Rate limiting - wait 100ms between requests
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log("\n");

  // Combine existing extended items with newly fetched ones
  const allExtendedItems = [...existingExtended, ...extendedItems];

  // Create extended manifest
  const extendedManifest: ExtendedManifest = {
    version: "2.0.0",
    generated: new Date().toISOString(),
    standard: existingStandard,
    extended: allExtendedItems,
    totalCount: existingStandard.length + allExtendedItems.length,
  };

  // Save extended manifest
  fs.writeFileSync(extendedManifestPath, JSON.stringify(extendedManifest, null, 2));

  // Also create a simple list of all icons for easy reference
  const allItems = [...existingStandard, ...allExtendedItems];
  const iconListPath = path.join(__dirname, "../public/icon-list.json");
  fs.writeFileSync(
    iconListPath,
    JSON.stringify(
      allItems.map((item) => ({
        id: item.id,
        label: item.label,
        category: item.category,
        url: item.image,
      })),
      null,
      2
    )
  );

  // Summary
  console.log("=== SUMMARY ===\n");
  console.log(`Standard items: ${existingStandard.length}`);
  console.log(`Previously fetched extended items: ${existingExtended.length}`);
  console.log(`Newly fetched extended items: ${extendedItems.length}`);
  console.log(`Total extended items: ${allExtendedItems.length}`);
  console.log(`Total icons: ${extendedManifest.totalCount}`);
  console.log(`Failed words: ${failedWords.length}`);

  if (failedWords.length > 0) {
    console.log("\nFailed words (first 20):");
    failedWords.slice(0, 20).forEach((w) => console.log(`  - ${w}`));

    // Save failed words for review
    const failedPath = path.join(__dirname, "failed-words.json");
    fs.writeFileSync(failedPath, JSON.stringify(failedWords, null, 2));
    console.log(`\nFull list saved to: ${failedPath}`);
  }

  // Category breakdown
  const categoryCount: Record<string, number> = {};
  allItems.forEach((item) => {
    categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
  });

  console.log("\nCategory breakdown:");
  Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}`);
    });

  console.log(`\nManifest saved to: ${extendedManifestPath}`);
  console.log(`Icon list saved to: ${iconListPath}`);
}

main().catch(console.error);
