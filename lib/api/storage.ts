import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
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
export const uploadImage = async (file: File, path: string = 'images'): Promise<string> => {
  try {
    const uniqueFilename = generateUniqueFilename(file);
    const storageRef = ref(storage, `${path}/${uniqueFilename}`);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
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
  file: File,
  maxWidth: number = 300,
  maxHeight: number = 300,
  path: string = 'thumbnails'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (!e.target || !e.target.result) {
        reject(new Error('Failed to read file'));
        return;
      }
      
      const img = new Image();
      img.src = e.target.result as string;
      
      img.onload = async () => {
        // Calculate new dimensions while maintaining aspect ratio
        const originalWidth = img.width;
        const originalHeight = img.height;
        
        let newWidth = originalWidth;
        let newHeight = originalHeight;
        
        if (originalWidth > maxWidth) {
          newWidth = maxWidth;
          newHeight = (originalHeight * maxWidth) / originalWidth;
        }
        
        if (newHeight > maxHeight) {
          newHeight = maxHeight;
          newWidth = (newWidth * maxHeight) / newHeight;
        }
        
        // Create canvas and resize image
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        
        // Convert canvas to Blob
        canvas.toBlob(async (blob) => {
          if (!blob) {
            reject(new Error('Failed to convert canvas to blob'));
            return;
          }
          
          // Create a File from the Blob
          const thumbnailFile = new File([blob], `thumb_${file.name}`, {
            type: file.type,
            lastModified: Date.now(),
          });
          
          try {
            // Upload the thumbnail
            const downloadURL = await uploadImage(thumbnailFile, path);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }, file.type);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
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
  try {
    // Upload the original image
    const imageURL = await uploadImage(file, imagePath);
    
    // Create and upload the thumbnail
    const thumbnailURL = await createAndUploadThumbnail(file, 300, 300, thumbnailPath);
    
    return {
      imageURL,
      thumbnailURL
    };
  } catch (error) {
    console.error('Error uploading image with thumbnail:', error);
    throw new Error('Failed to upload image with thumbnail');
  }
};

