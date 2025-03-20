import fs from 'fs';
import path from 'path';
import { CVData } from '@/types/cv';

/**
 * Get CV data from JSON file
 */
export function getCVData(): CVData {
  try {
    // Read CV data from JSON file
    const dataPath = path.join(process.cwd(), 'content/cv/cv-data.json');
    const fileContents = fs.readFileSync(dataPath, 'utf8');
    
    // Parse and return data
    return JSON.parse(fileContents) as CVData;
  } catch (error) {
    console.error('Error loading CV data:', error);
    
    // Return empty data structure on error
    return {
      about: 'Experienced engineering leader with a passion for building teams and products.',
      experience: [{
        title: 'Engineering Manager',
        company: 'Example Inc.',
        location: 'Remote',
        period: '2020 - Present',
        description: 'Leading engineering teams to deliver high-quality products.'
      }],
      skills: ['Leadership', 'Engineering', 'Product Management'],
      education: [{
        school: 'University of Example',
        location: 'Example City',
        year: '2015'
      }],
      Training: [],
      publications: [],
      languages: []
    };
  }
}