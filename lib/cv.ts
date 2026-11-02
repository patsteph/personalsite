import fs from 'fs';
import path from 'path';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { CVData } from '@/types/cv';

/**
 * CV data as checked into content/cv/cv-data.json. This is the fallback/seed
 * used before the admin editor has ever saved to Firestore, and if Firestore
 * is unreachable. Not the live source of truth once a Firestore doc exists -
 * see getCVData().
 */
export function getStaticCVData(): CVData {
  try {
    const dataPath = path.join(process.cwd(), 'content/cv/cv-data.json');
    const fileContents = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(fileContents) as CVData;
  } catch (error) {
    console.error('Error loading CV data from content/cv/cv-data.json:', error);

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
      skills: [
        { name: 'Leadership', category: 'Soft Skills', proficiency: 5 },
        { name: 'Engineering', category: 'Technical', proficiency: 5 },
        { name: 'Product Management', category: 'Management', proficiency: 4 }
      ],
      education: [{
        institution: 'University of Example',
        degree: 'Bachelor of Science',
        location: 'Example City',
        year: '2015'
      }],
      Training: [],
      publications: [],
      languages: []
    };
  }
}

/**
 * Live CV data: Firestore's content/cv doc, the same doc the admin CV
 * editor (pages/admin/cv.tsx via pages/api/admin/cv.ts) saves to. Falls
 * back to the static seed file if that doc doesn't exist yet or Firestore
 * can't be reached, so the site never regresses to empty data.
 */
export async function getCVData(): Promise<CVData> {
  try {
    const db = getAdminFirestore();
    const doc = await db.collection('content').doc('cv').get();
    if (doc.exists) {
      return doc.data() as CVData;
    }
  } catch (error) {
    console.error('Error loading CV data from Firestore:', error);
  }

  return getStaticCVData();
}
