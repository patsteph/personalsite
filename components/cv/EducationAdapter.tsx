import { Education } from '@/types/cv';
import EducationSection from './EducationSection';

type EducationAdapterProps = {
  education: Education[];
};

export default function EducationAdapter({ education }: EducationAdapterProps) {
  // Convert the new education structure to the format expected by the existing component
  const adaptedEducation = education.map(edu => ({
    ...edu,
    // Ensure school property exists for backward compatibility
    school: 'institution' in edu ? (edu as any).institution : (edu as any).school,
    // If it's the new format with degree, add it to the school property
    ...(('degree' in edu) && { school: `${(edu as any).degree} - ${(edu as any).institution}` })
  }));
  
  return <EducationSection education={adaptedEducation} />;
}
