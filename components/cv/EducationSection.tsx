import { Education, Certification } from '@/types/cv';
import { useTranslation } from '@/lib/translations';

type EducationSectionProps = {
  education: Education[];
  certifications?: Certification[];
};

export default function EducationSection({ education, certifications }: EducationSectionProps) {
  const { t } = useTranslation();
  
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-accent mb-4">
        {t('cv.education', 'Education & Training')}
      </h2>
      
      {/* Education */}
      <div className="space-y-4 mb-6">
        {education.map((edu, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-steel-blue">{edu.degree}</h3>
            <div className="text-gray-600">
              {edu.institution} | {edu.location} | {edu.year}
            </div>
          </div>
        ))}
      </div>
      
      {/* Certifications */}
      {certifications && certifications.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-accent mb-3">Certifications</h3>
          <div className="space-y-2">
            {certifications.map((cert, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-4">
                <div className="font-medium">{cert.name}</div>
                <div className="text-sm text-gray-600">{cert.year}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}