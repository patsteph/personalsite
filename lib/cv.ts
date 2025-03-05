import fs from 'fs';
import path from 'path';
import { CVData } from '@/types/cv';

// Path to CV data file
const cvDataPath = path.join(process.cwd(), 'content/cv/cv-data.json');

/**
 * Get CV data from the JSON file
 */
export function getCVData(): CVData {
  try {
    // Ensure the file exists
    if (!fs.existsSync(cvDataPath)) {
      console.warn('CV data file not found, returning empty data structure');
      return {
        about: '',
        experience: [],
        skills: [],
        education: []
      };
    }
    
    // Read and parse the JSON file
    const fileContents = fs.readFileSync(cvDataPath, 'utf8');
    return JSON.parse(fileContents) as CVData;
  } catch (error) {
    console.error('Error reading CV data:', error);
    // Return a default structure on error
    return {
      about: '',
      experience: [],
      skills: [],
      education: []
    };
  }
}