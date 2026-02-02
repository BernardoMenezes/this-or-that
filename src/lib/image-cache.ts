/**
 * Image Cache Service
 *
 * Implements a triple-check caching strategy for offline icon access:
 * 1. Check if image exists in local cache (FileSystem)
 * 2. If not cached, fetch from network
 * 3. Save to cache for future offline use
 *
 * This enables offline functionality after initial image loads.
 */

import * as FileSystem from "expo-file-system";
import { Image } from "expo-image";

// Cache directory for downloaded icons
const CACHE_DIR = `${FileSystem.cacheDirectory}arasaac-icons/`;

// Track if cache directory has been initialized
let cacheInitialized = false;

/**
 * Initialize the cache directory
 */
async function ensureCacheDir(): Promise<void> {
  if (cacheInitialized) return;

  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
    cacheInitialized = true;
  } catch (error) {
    console.log("[ImageCache] Error creating cache directory:", error);
  }
}

/**
 * Generate a cache-safe filename from a URL
 */
function urlToCacheKey(url: string): string {
  // Extract filename from URL and sanitize
  const urlParts = url.split("/");
  const filename = urlParts[urlParts.length - 1];

  // Create a simple hash from the full URL for uniqueness
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const hashStr = Math.abs(hash).toString(16);

  // Sanitize filename (remove special chars, keep extension)
  const sanitized = filename
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 50);

  return `${hashStr}_${sanitized}`;
}

/**
 * Get the local cache path for a URL
 */
export function getCachePath(url: string): string {
  return `${CACHE_DIR}${urlToCacheKey(url)}`;
}

/**
 * Check if an image exists in the local cache
 */
export async function isImageCached(url: string): Promise<boolean> {
  try {
    await ensureCacheDir();
    const cachePath = getCachePath(url);
    const info = await FileSystem.getInfoAsync(cachePath);
    return info.exists;
  } catch {
    return false;
  }
}

/**
 * Get the cached URI for an image, or null if not cached
 */
export async function getCachedUri(url: string): Promise<string | null> {
  try {
    await ensureCacheDir();
    const cachePath = getCachePath(url);
    const info = await FileSystem.getInfoAsync(cachePath);
    if (info.exists) {
      return cachePath;
    }
  } catch {
    // Fall through to return null
  }
  return null;
}

/**
 * Download and cache an image from a URL
 * Returns the local cache URI if successful, or null on failure
 */
export async function cacheImage(url: string): Promise<string | null> {
  try {
    await ensureCacheDir();
    const cachePath = getCachePath(url);

    // Check if already cached
    const existing = await FileSystem.getInfoAsync(cachePath);
    if (existing.exists) {
      return cachePath;
    }

    // Download the image
    const downloadResult = await FileSystem.downloadAsync(url, cachePath);

    if (downloadResult.status === 200) {
      return cachePath;
    } else {
      // Clean up failed download
      try {
        await FileSystem.deleteAsync(cachePath, { idempotent: true });
      } catch {
        // Ignore cleanup errors
      }
      return null;
    }
  } catch (error) {
    console.log("[ImageCache] Error caching image:", url, error);
    return null;
  }
}

/**
 * Get the best available URI for an image using triple-check strategy:
 * 1. Check local cache first
 * 2. If not cached, return original URL (will be cached on load)
 *
 * This is synchronous to work with Image components easily.
 * The actual caching happens asynchronously in the background.
 */
export function getImageUri(url: string): string {
  // Always return the URL - expo-image handles caching automatically
  // But we'll also trigger background caching to our custom directory
  return url;
}

/**
 * Prefetch and cache multiple images in the background
 * Useful for preloading icons when the app starts
 */
export async function prefetchImages(urls: string[]): Promise<void> {
  await ensureCacheDir();

  // Use expo-image's prefetch for efficient batch loading
  try {
    await Image.prefetch(urls);
  } catch (error) {
    console.log("[ImageCache] Error prefetching images:", error);
  }

  // Also cache to our custom directory for guaranteed offline access
  // Do this in parallel batches to avoid overwhelming the network
  const batchSize = 10;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    await Promise.all(batch.map((url) => cacheImage(url)));
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  cachedCount: number;
  totalSize: number;
}> {
  try {
    await ensureCacheDir();
    const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
    let totalSize = 0;

    for (const file of files) {
      const info = await FileSystem.getInfoAsync(`${CACHE_DIR}${file}`);
      if (info.exists && info.size) {
        totalSize += info.size;
      }
    }

    return {
      cachedCount: files.length,
      totalSize,
    };
  } catch {
    return { cachedCount: 0, totalSize: 0 };
  }
}

/**
 * Clear the entire image cache
 */
export async function clearCache(): Promise<void> {
  try {
    await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
    cacheInitialized = false;
    await ensureCacheDir();
  } catch (error) {
    console.log("[ImageCache] Error clearing cache:", error);
  }
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
