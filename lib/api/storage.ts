import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a unique filename for an image using UUID
 * @param file The file to generate a unique name for
 * @returns A unique filename with the original extension
 */
export const generateUniqueFilename = (file: File): string => {
  const fileExtension = file.name.split('.').pop();
  return `${uuidv4()}.${fileExtension}`;
};

/**
 * Uploads an image to Firebase Storage
 * @param file The file to upload
 * @param path The path in storage where the file should be stored
 * @returns Promise that resolves to the download URL of the uploaded file
 */
export const uploadImage = async (): Promise<string> => { // Removed _path parameter
  throw new Error('Direct Firebase storage access is not available. Use server-side API.');
};

/**
 * Creates a thumbnail of an image and uploads it to Firebase Storage
 * @param file The original image file
 * @param maxWidth The maximum width of the thumbnail
 * @param maxHeight The maximum height of the thumbnail
 * @param path The path in storage where the thumbnail should be stored
 * @returns Promise that resolves to the download URL of the thumbnail
 */
export const createAndUploadThumbnail = async (
): Promise<string> => {
  throw new Error('Direct Firebase storage access is not available. Use server-side API.');
};

/**
 * Uploads both an image and its thumbnail to Firebase Storage
 * @param file The image file to upload
 * @param imagePath The path for the original image
 * @param thumbnailPath The path for the thumbnail
 * @returns Promise that resolves to an object with URLs for both the image and thumbnail
 */
export const uploadImageWithThumbnail = async (
  file: File,
  imagePath: string = 'images',
  thumbnailPath: string = 'thumbnails'
): Promise<{ imageURL: string; thumbnailURL: string }> => {
  throw new Error('Direct Firebase storage access is not available. Use server-side API.');
};
