import * as fs from "fs";
import * as path from "path";

const API_TOKEN = "temp::1769918944:1769918944:9b672fd6d21dc3638df8d1dd:48f25fad96db527cd50792813d0bf12bca3ab8580474b9577794e61cb223225205cd434e11bcb0a1164f6589f065125a1cc009a6f2f937f776c221df9c9d026b";
const PREFERRED_REPOS = ["arasaac", "jellow", "tawasol"];

interface ManifestItem {
  id: string;
  label: string;
  category: string;
  image: string;
}

interface OpenSymbolResult {
  id: string;
  name: string;
  image_url: string;
  repo_key: string;
  license: string;
}

interface SearchResponse {
  symbols?: OpenSymbolResult[];
}

async function searchSymbol(query: string): Promise<OpenSymbolResult | null> {
  const url = `https://www.opensymbols.org/api/v1/symbols/search?q=${encodeURIComponent(query)}&access_token=${API_TOKEN}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`API error for "${query}": ${response.status}`);
      return null;
    }

    const data = (await response.json()) as OpenSymbolResult[];

    if (!data || data.length === 0) {
      return null;
    }

    // Sort by preferred repos
    for (const repo of PREFERRED_REPOS) {
      const match = data.find(
        (s) => s.repo_key?.toLowerCase().includes(repo.toLowerCase())
      );
      if (match) {
        return match;
      }
    }

    // Return first result if no preferred repo match
    return data[0];
  } catch (error) {
    console.error(`Error searching for "${query}":`, error);
    return null;
  }
}

async function main() {
  const manifestPath = path.join(
    __dirname,
    "../public/library-manifest.json"
  );
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

  const standardItems: ManifestItem[] = manifest.standard;
  const results: {
    id: string;
    label: string;
    category: string;
    oldImage: string;
    newImage: string | null;
    repo: string | null;
  }[] = [];

  console.log(`Processing ${standardItems.length} items...\n`);

  for (let i = 0; i < standardItems.length; i++) {
    const item = standardItems[i];
    console.log(`[${i + 1}/${standardItems.length}] Searching: ${item.label}`);

    const result = await searchSymbol(item.label);

    if (result) {
      console.log(`  ✓ Found: ${result.repo_key} - ${result.image_url}`);
      results.push({
        id: item.id,
        label: item.label,
        category: item.category,
        oldImage: item.image,
        newImage: result.image_url,
        repo: result.repo_key,
      });

      // Update manifest item
      item.image = result.image_url;
    } else {
      console.log(`  ✗ Not found, keeping original: ${item.image}`);
      results.push({
        id: item.id,
        label: item.label,
        category: item.category,
        oldImage: item.image,
        newImage: null,
        repo: null,
      });
    }

    // Rate limiting - wait 200ms between requests
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  // Write updated manifest
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nUpdated manifest saved to ${manifestPath}`);

  // Summary
  const found = results.filter((r) => r.newImage !== null).length;
  const notFound = results.filter((r) => r.newImage === null).length;

  console.log(`\n=== SUMMARY ===`);
  console.log(`Found: ${found}`);
  console.log(`Not found (kept original): ${notFound}`);

  // Save detailed results
  const resultsPath = path.join(__dirname, "opensymbols-results.json");
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\nDetailed results saved to ${resultsPath}`);
}

main().catch(console.error);
