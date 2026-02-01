// Library images loaded from manifest
// Standard library (~100 items) shown first, extended library (~3k items) below

import libraryManifest from '../../public/library-manifest.json';

export interface BundledImage {
  id: string;
  label: string;
  url: string;
  category: string;
  isStandard: boolean;
}

const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/BernardoMenezes/this-or-that-assets/main';

// Map category names to folder names in the repo
function getCategoryFolder(category: string, isStandard: boolean): string {
  const libraryFolder = isStandard ? 'default-library' : 'extended-library';
  const folderName = category.toLowerCase().replace(/\s+/g, '-');
  return `${libraryFolder}/${folderName}`;
}

// Convert manifest items to BundledImage format
function createImageFromManifest(
  item: { id: string; label: string; category: string; image: string },
  isStandard: boolean
): BundledImage {
  const categoryFolder = getCategoryFolder(item.category, isStandard);
  return {
    id: item.id,
    label: item.label,
    url: `${GITHUB_BASE_URL}/${categoryFolder}/${item.image}`,
    category: item.category,
    isStandard,
  };
}

// Load standard library items
const STANDARD_IMAGES: BundledImage[] = libraryManifest.standard.map((item) =>
  createImageFromManifest(item, true)
);

// Load extended library items
const EXTENDED_IMAGES: BundledImage[] = libraryManifest.extended.map((item) =>
  createImageFromManifest(item, false)
);

// Combined library (standard first, then extended)
export const ALL_IMAGES: BundledImage[] = [...STANDARD_IMAGES, ...EXTENDED_IMAGES];

// Get unique categories from the manifest
const standardCategories = new Set(STANDARD_IMAGES.map((img) => img.category));
const allCategories = new Set(ALL_IMAGES.map((img) => img.category));

// Standard categories (from standard library only)
export const STANDARD_CATEGORIES = ['All', ...Array.from(standardCategories).sort()] as const;

// All categories (for search results)
export const ALL_CATEGORY_NAMES = ['All', ...Array.from(allCategories).sort()] as const;

// Use standard categories for the main category tabs
export const CATEGORIES = STANDARD_CATEGORIES;
export type Category = string;

// Get images by category - standard items first, then extended
export function getImagesByCategory(category: Category): BundledImage[] {
  if (category === 'All') {
    return ALL_IMAGES;
  }

  // Get standard items for this category first
  const standardInCategory = STANDARD_IMAGES.filter((img) => img.category === category);
  // Then extended items for this category
  const extendedInCategory = EXTENDED_IMAGES.filter((img) => img.category === category);

  return [...standardInCategory, ...extendedInCategory];
}

// Search across all images (both standard and extended)
export function searchImages(query: string): BundledImage[] {
  if (!query.trim()) return ALL_IMAGES;

  const lowerQuery = query.toLowerCase().trim();
  const words = lowerQuery.split(/\s+/);

  // Score-based search: exact matches and standard items ranked higher
  const scored = ALL_IMAGES.map((img) => {
    const labelLower = img.label.toLowerCase();
    const categoryLower = img.category.toLowerCase();

    let score = 0;

    // Check if all words match
    const allWordsMatch = words.every(
      (word) => labelLower.includes(word) || categoryLower.includes(word)
    );

    if (!allWordsMatch) return { img, score: 0 };

    // Exact label match
    if (labelLower === lowerQuery) score += 100;
    // Label starts with query
    else if (labelLower.startsWith(lowerQuery)) score += 50;
    // Label contains query
    else if (labelLower.includes(lowerQuery)) score += 25;
    // Category match
    else if (categoryLower.includes(lowerQuery)) score += 10;
    // Partial word matches
    else score += 5;

    // Boost standard library items
    if (img.isStandard) score += 30;

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
export const TOTAL_COUNT = ALL_IMAGES.length;
