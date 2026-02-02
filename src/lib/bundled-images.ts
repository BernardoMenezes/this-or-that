// Library images loaded from manifest
// Standard library (102 curated items) for category browsing
// Extended library (748 additional items) for expanded offline coverage
// Search via SymboTalk API for remaining 28k+ ARASAAC symbols

import extendedManifest from "../../public/extended-manifest.json";

export interface BundledImage {
  id: string;
  label: string;
  url: string;
  category: string;
  isStandard: boolean;
  priority?: number;
}

interface ManifestItem {
  id: string;
  label: string;
  category: string;
  image: string;
  priority?: number;
}

// Convert manifest items to BundledImage format
function createImageFromManifest(
  item: ManifestItem,
  isStandard: boolean
): BundledImage {
  return {
    id: item.id,
    label: item.label,
    url: item.image,
    category: item.category,
    isStandard,
    priority: item.priority,
  };
}

// Load standard library items (original 102)
const STANDARD_IMAGES: BundledImage[] = extendedManifest.standard.map((item) =>
  createImageFromManifest(item as ManifestItem, true)
);

// Load extended library items (additional 748)
const EXTENDED_IMAGES: BundledImage[] = extendedManifest.extended.map((item) =>
  createImageFromManifest(item as ManifestItem, false)
);

// All bundled images (850 total)
export const ALL_IMAGES: BundledImage[] = [...STANDARD_IMAGES, ...EXTENDED_IMAGES];

// Get all image URLs for prefetching
export function getAllImageUrls(): string[] {
  return ALL_IMAGES.map((img) => img.url);
}

// Get unique categories from the manifest
const allCategories = new Set(ALL_IMAGES.map((img) => img.category));

// Standard categories (from original 102)
const standardCategories = new Set(STANDARD_IMAGES.map((img) => img.category));
export const STANDARD_CATEGORIES = [
  "All",
  ...Array.from(standardCategories).sort(),
] as const;

// All categories (including from extended)
export const ALL_CATEGORIES = [
  "All",
  ...Array.from(allCategories).sort(),
] as const;

// Use standard categories for the main category tabs (for now)
export const CATEGORIES = STANDARD_CATEGORIES;
export type Category = string;

// Get images by category (standard items only for category browsing)
export function getImagesByCategory(category: Category): BundledImage[] {
  if (category === "All") {
    return STANDARD_IMAGES;
  }
  return STANDARD_IMAGES.filter((img) => img.category === category);
}

// Search all bundled images (standard + extended) for local/offline search
export function searchLocalImages(query: string): BundledImage[] {
  if (!query.trim()) return STANDARD_IMAGES;

  const lowerQuery = query.toLowerCase().trim();
  const words = lowerQuery.split(/\s+/);

  // Search through all bundled images (850 total)
  const scored = ALL_IMAGES.map((img) => {
    const labelLower = img.label.toLowerCase();
    const categoryLower = img.category.toLowerCase();

    let score = 0;

    const allWordsMatch = words.every(
      (word) => labelLower.includes(word) || categoryLower.includes(word)
    );

    if (!allWordsMatch) return { img, score: 0 };

    // Exact match gets highest score
    if (labelLower === lowerQuery) score += 100;
    // Starts with query
    else if (labelLower.startsWith(lowerQuery)) score += 50;
    // Contains full query
    else if (labelLower.includes(lowerQuery)) score += 25;
    // Category contains query
    else if (categoryLower.includes(lowerQuery)) score += 10;
    // Partial match
    else score += 5;

    // Boost standard items slightly (they're the most curated)
    if (img.isStandard) score += 3;

    // Boost by priority (lower priority number = higher score)
    if (img.priority) {
      score += (4 - img.priority) * 2;
    }

    return { img, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.img);
}

// Export counts for UI
export const STANDARD_COUNT = STANDARD_IMAGES.length;
export const EXTENDED_COUNT = EXTENDED_IMAGES.length;
export const TOTAL_BUNDLED_COUNT = ALL_IMAGES.length;

// Get stats for display
export function getBundledStats() {
  return {
    standard: STANDARD_COUNT,
    extended: EXTENDED_COUNT,
    total: TOTAL_BUNDLED_COUNT,
    categories: ALL_CATEGORIES.length - 1, // Exclude 'All'
  };
}
