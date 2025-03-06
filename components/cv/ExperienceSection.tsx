import { Experience } from '@/types/cv';
import { useTranslation } from '@/lib/translations';

type ExperienceSectionProps = {
  experience: Experience[];
};

export default function ExperienceSection({ experience }: ExperienceSectionProps) {
  const { t } = useTranslation();
  
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-accent mb-4">
        {t('cv.experience', 'Experience')}
      </h2>
      
      <div className="space-y-4">
        {experience.map((job, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-steel-blue">{job.title}</h3>
            <div className="text-gray-600 mb-2">
              {job.company} | {job.location} | {job.period}
            </div>
            <p className="text-gray-700 mt-3">{job.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}