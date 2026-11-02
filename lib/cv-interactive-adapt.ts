import { CVData, Skill, Education } from '@/types/cv';

/**
 * The interactive CV components need the newer Skill/Education shapes
 * (category, institution/degree/year). content/cv/cv-data.json still has
 * entries in the legacy shape (plain skill strings, education with only a
 * `school` field). Normalize those here instead of guessing at values
 * (proficiency, degree, etc.) the legacy data doesn't contain.
 */
export function toInteractiveCVData(data: CVData): CVData {
  return {
    ...data,
    skills: normalizeSkills(data.skills),
    education: normalizeEducation(data.education),
  };
}

function normalizeSkills(skills: CVData['skills']): Skill[] {
  return skills.map(skill =>
    typeof skill === 'string' ? { name: skill, category: 'General' } : skill
  );
}

function normalizeEducation(education: CVData['education']): Education[] {
  return education.map(edu => {
    const legacy = edu as Education & { school?: string };
    return {
      ...edu,
      institution: edu.institution || legacy.school || '',
      degree: edu.degree || '',
      year: edu.year || '',
    };
  });
}
