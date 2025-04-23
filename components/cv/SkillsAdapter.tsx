import { useTranslation } from '@/lib/translations';
import { Skill } from '@/types/cv';
import SkillsSection from './SkillsSection';

type SkillsAdapterProps = {
  skills: Skill[] | string[];
};

export default function SkillsAdapter({ skills }: SkillsAdapterProps) {
  // Check if the skills array contains objects (new Skill type) or strings (old type)
  const isNewSkillFormat = skills.length > 0 && typeof skills[0] !== 'string';
  
  // Convert skills objects to strings for the legacy component if needed
  const stringSkills = isNewSkillFormat 
    ? (skills as Skill[]).map(skill => skill.name) 
    : (skills as string[]);
  
  return <SkillsSection skills={stringSkills} />;
}
