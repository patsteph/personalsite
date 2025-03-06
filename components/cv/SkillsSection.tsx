import { useTranslation } from '@/lib/translations';

type SkillsSectionProps = {
  skills: string[];
};

export default function SkillsSection({ skills }: SkillsSectionProps) {
  const { t } = useTranslation();
  
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-accent mb-4">
        {t('cv.skills', 'Skills')}
      </h2>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <span 
              key={index}
              className="bg-light-accent text-steel-blue px-3 py-1 rounded-full text-sm"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}