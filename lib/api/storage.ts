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
    if (!storage) {
      console.error('Firebase storage not initialized');
      throw new Error('Firebase storage is not initialized. Please check your connection and try again.');
    }
    
    console.log('Storage initialized, creating reference for path:', path);
    const uniqueFilename = generateUniqueFilename(file);
    const storageRef = ref(storage, `${path}/${uniqueFilename}`);
    
    // Upload the file
    console.log('Uploading file to Firebase Storage...');
    const snapshot = await uploadBytes(storageRef, file);
    console.log('Upload completed, getting download URL...');
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Successfully retrieved download URL');
    
    return downloadURL;
  } catch (error) {
    // Provide more detailed error information
    console.error('Detailed error uploading image:', error);
    
    // Determine specific error types for better user feedback
    if (error instanceof Error) {
      if (error.message.includes('storage/unauthorized')) {
        throw new Error('Permission denied: You do not have permission to upload to this location');
      } else if (error.message.includes('storage/quota-exceeded')) {
        throw new Error('Storage quota exceeded. Please try a smaller image or contact support.');
      } else if (error.message.includes('storage/canceled')) {
        throw new Error('Upload was canceled');
      } else if (error.message.includes('storage/unknown')) {
        throw new Error('Unknown error occurred. Please check your connection and try again.');
      }
      
      // Rethrow the original error message if it's specific
      throw error;
    }
    
    // Generic error if we can't determine a specific reason
    throw new Error('Failed to upload image. Please try again later.');
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
  console.log('Creating thumbnail for file:', file.name, 'size:', file.size);
  
  if (!storage) {
    console.error('Firebase storage not initialized for thumbnail creation');
    throw new Error('Firebase storage is not initialized for thumbnail creation');
  }
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (!e.target || !e.target.result) {
        console.error('Failed to read file for thumbnail creation');
        reject(new Error('Failed to read file for thumbnail creation'));
        return;
      }
      
      console.log('File read successfully, creating image object');
      const img = new Image();
      img.src = e.target.result as string;
      
      img.onload = async () => {
        try {
          console.log('Image loaded, original dimensions:', img.width, 'x', img.height);
          
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
          
          console.log('Calculated thumbnail dimensions:', newWidth, 'x', newHeight);
          
          // Create canvas and resize image
          const canvas = document.createElement('canvas');
          canvas.width = newWidth;
          canvas.height = newHeight;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            console.error('Could not get canvas context');
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
          console.log('Image drawn on canvas, converting to blob');
          
          // Convert canvas to Blob with quality parameter for JPEG
          const quality = file.type === 'image/jpeg' ? 0.85 : undefined;
          canvas.toBlob(async (blob) => {
            if (!blob) {
              console.error('Failed to convert canvas to blob');
              reject(new Error('Failed to convert canvas to blob'));
              return;
            }
            
            console.log('Blob created successfully, size:', blob.size);
            
            // Create a File from the Blob
            const thumbnailFile = new File([blob], `thumb_${file.name}`, {
              type: file.type,
              lastModified: Date.now(),
            });
            
            try {
              console.log('Uploading thumbnail to path:', path);
              // Upload the thumbnail
              const downloadURL = await uploadImage(thumbnailFile, path);
              console.log('Thumbnail uploaded successfully, URL:', downloadURL);
              resolve(downloadURL);
            } catch (error) {
              console.error('Error uploading thumbnail:', error);
              reject(error);
            }
          }, file.type, quality);
        } catch (err) {
          console.error('Error in thumbnail processing:', err);
          reject(err);
        }
      };
      
      img.onerror = (err) => {
        console.error('Failed to load image for thumbnail:', err);
        reject(new Error('Failed to load image for thumbnail'));
      };
    };
    
    reader.onerror = (err) => {
      console.error('Failed to read file for thumbnail:', err);
      reject(new Error('Failed to read file for thumbnail'));
    };
    
    console.log('Starting to read file as data URL');
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
    if (!storage) {
      throw new Error('Firebase storage is not initialized');
    }
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

