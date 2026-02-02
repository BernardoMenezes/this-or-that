// SymboTalk API for searching 28k+ ARASAAC symbols
// API docs: https://elelad.github.io/SymboTalkAPIDocs/
// No auth required, no CORS restrictions

import { type BundledImage } from './bundled-images';

const BASE_URL = 'https://symbotalkapiv1.azurewebsites.net';

interface SymboTalkSymbol {
  _id: string;
  id: number;
  name: string;
  image_url: string;
  image_url_alt?: string;
  repo?: string;
  license?: string;
}

/**
 * Clean up label by removing trailing numbers (e.g., "salmon 1" -> "salmon")
 */
function cleanLabel(name: string): string {
  return name.replace(/\s+\d+$/, '').trim();
}

/**
 * Search for symbols via SymboTalk API
 * Returns results from ARASAAC library (28k+ symbols)
 */
export async function searchSymboTalkAPI(
  query: string,
  limit: number = 50
): Promise<BundledImage[]> {
  if (!query.trim()) return [];

  try {
    const params = new URLSearchParams({
      name: query.trim(),
      lang: 'en',
      repo: 'arasaac',
      limit: String(limit),
    });

    const response = await fetch(`${BASE_URL}/search/?${params}`);

    if (!response.ok) {
      console.log('SymboTalk API returned status:', response.status);
      return [];
    }

    const text = await response.text();

    // Check if response is valid JSON
    if (!text || text.trim() === '' || !text.startsWith('[')) {
      console.log('SymboTalk API returned non-JSON response');
      return [];
    }

    const data: SymboTalkSymbol[] = JSON.parse(text);

    if (!Array.isArray(data)) {
      console.log('SymboTalk API returned non-array data');
      return [];
    }

    return data.map((symbol) => ({
      id: `symbotalk-${symbol.id}`,
      label: cleanLabel(symbol.name),
      url: symbol.image_url,
      category: 'Search Results',
      isStandard: false,
    }));
  } catch (error) {
    // Silently fail - don't spam console with API errors
    return [];
  }
}
