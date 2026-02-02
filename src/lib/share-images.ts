import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { CustomImage } from './custom-images-store';

const EXPORT_VERSION = 2;

interface ExportedImage {
  label: string;
  createdAt: number;
  // For local images, we store base64 data
  base64Data?: string;
  // For remote URLs (like bundled library), we store the URL
  remoteUrl?: string;
}

interface ExportData {
  version: number;
  exportedAt: number;
  images: ExportedImage[];
}

/**
 * Check if a URL is a local file (camera roll photo)
 */
function isLocalFile(url: string): boolean {
  return url.startsWith('file://') || url.startsWith('/');
}

/**
 * Convert a local image to base64
 */
async function imageToBase64(uri: string): Promise<string | null> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error('Failed to convert image to base64:', error);
    return null;
  }
}

/**
 * Save base64 image to local file system
 */
async function saveBase64ToFile(base64: string, label: string): Promise<string | null> {
  try {
    const fileName = `custom-image-${Date.now()}-${label.replace(/[^a-z0-9]/gi, '_')}.jpg`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return filePath;
  } catch (error) {
    console.error('Failed to save image:', error);
    return null;
  }
}

/**
 * Exports custom images to a shareable JSON file
 * Local images are converted to base64, remote URLs are kept as-is
 */
export async function exportCustomImages(images: CustomImage[]): Promise<boolean> {
  if (images.length === 0) {
    return false;
  }

  try {
    const exportedImages: ExportedImage[] = [];

    for (const img of images) {
      if (isLocalFile(img.url)) {
        // Convert local image to base64
        const base64 = await imageToBase64(img.url);
        if (base64) {
          exportedImages.push({
            label: img.label,
            createdAt: img.createdAt,
            base64Data: base64,
          });
        }
      } else {
        // Keep remote URL as-is
        exportedImages.push({
          label: img.label,
          createdAt: img.createdAt,
          remoteUrl: img.url,
        });
      }
    }

    if (exportedImages.length === 0) {
      return false;
    }

    const exportData: ExportData = {
      version: EXPORT_VERSION,
      exportedAt: Date.now(),
      images: exportedImages,
    };

    const jsonContent = JSON.stringify(exportData);
    const fileName = `choice-helper-images-${Date.now()}.choicehelper`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, jsonContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      return false;
    }

    await Sharing.shareAsync(filePath, {
      mimeType: 'application/octet-stream',
      dialogTitle: 'Share Custom Images',
    });

    return true;
  } catch (error) {
    console.error('Failed to export images:', error);
    return false;
  }
}

/**
 * Imports images from a file URI
 * Returns array of CustomImage objects ready to be added to the store
 */
export async function importFromFile(fileUri: string): Promise<CustomImage[] | null> {
  try {
    const content = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const data = JSON.parse(content) as ExportData;

    if (!data.version || !Array.isArray(data.images)) {
      return null;
    }

    const importedImages: CustomImage[] = [];

    for (const img of data.images) {
      if (!img.label || typeof img.createdAt !== 'number') {
        continue;
      }

      if (img.base64Data) {
        // Save base64 image to local file
        const localPath = await saveBase64ToFile(img.base64Data, img.label);
        if (localPath) {
          importedImages.push({
            label: img.label,
            url: localPath,
            createdAt: img.createdAt,
          });
        }
      } else if (img.remoteUrl) {
        // Use remote URL directly
        importedImages.push({
          label: img.label,
          url: img.remoteUrl,
          createdAt: img.createdAt,
        });
      }
    }

    return importedImages.length > 0 ? importedImages : null;
  } catch (error) {
    console.error('Failed to import images:', error);
    return null;
  }
}

/**
 * Parses import data from a JSON string (legacy support)
 */
export function parseImportData(jsonString: string): CustomImage[] | null {
  try {
    const data = JSON.parse(jsonString) as ExportData;

    if (!data.version || !Array.isArray(data.images)) {
      return null;
    }

    // For v1 format (URL only)
    if (data.version === 1) {
      const validImages = (data.images as unknown as CustomImage[]).filter(
        (img) => img.label && img.url && typeof img.createdAt === 'number'
      );
      return validImages.length > 0 ? validImages : null;
    }

    return null;
  } catch {
    return null;
  }
}
