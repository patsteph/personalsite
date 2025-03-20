import { Education } from '@/types/cv';
import { useTranslation } from '@/lib/translations';

type EducationSectionProps = {
  education: Education[];
};

export default function EducationSection({ education }: EducationSectionProps) {
  const { t } = useTranslation();
  
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-accent mb-4">
        {t('cv.education', 'Education')}
      </h2>
      
      <div className="space-y-4">
        {education.map((edu, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-steel-blue">{edu.school}</h3>
            <div className="text-gray-600">
              {edu.location && edu.location} {edu.year && `| ${edu.year}`}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}