import { useTranslation } from '@/lib/translations';

type AboutSectionProps = {
  about: string;
};

export default function AboutSection({ about }: AboutSectionProps) {
  const { t } = useTranslation();
  
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-accent mb-4">
        {t('cv.about', 'About Me')}
      </h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-steel-blue leading-relaxed">{about}</p>
      </div>
    </section>
  );
}