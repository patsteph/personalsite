import { Certification } from '@/types/cv';
import { useTranslation } from '@/lib/translations';

type TrainingSectionProps = {
  certifications: Certification[];
};

export default function TrainingSection({ certifications }: TrainingSectionProps) {
  const { t } = useTranslation();
  
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-accent mb-4">
        {t('cv.training', 'Training & Certification')}
      </h2>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-3">
          {certifications.map((cert, index) => (
            <div key={index} className="flex flex-col">
              <div className="font-medium text-steel-blue">{cert.name}</div>
              <div className="text-sm text-gray-600">{cert.year}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

