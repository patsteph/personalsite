import { GetStaticProps } from 'next';
import Layout from '@/components/layout/Layout';
import AboutSection from '@/components/cv/AboutSection';
import ExperienceSection from '@/components/cv/ExperienceSection';
import SkillsSection from '@/components/cv/SkillsSection';
import EducationSection from '@/components/cv/EducationSection';
import TrainingSection from '@/components/cv/TrainingSection';
import { getCVData } from '@/lib/cv';
import { CVData } from '@/types/cv';
import { useTranslation } from '@/lib/translations';

// Props type definition
type CVPageProps = {
  cvData: CVData;
};

export default function CVPage({ cvData }: CVPageProps) {
  const { t } = useTranslation();
  
  return (
    <Layout section="cv">
      <h1 className="text-3xl md:text-4xl font-bold text-accent mb-8">
        {t('cv.title', 'Curriculum Vitae')}
      </h1>
      
      <AboutSection about={cvData.about} />
      
      <ExperienceSection experience={cvData.experience} />
      
      <SkillsSection skills={cvData.skills} />
      
      <TrainingSection certifications={cvData.Training || []} />
      
      <EducationSection education={cvData.education} />
      
      {/* Publications section if available */}
      {cvData.publications && cvData.publications.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-accent mb-4">Publications</h2>
          <div className="bg-white rounded-lg shadow p-6">
            <ul className="space-y-3">
              {cvData.publications.map((pub, index) => (
                <li key={index}>
                  <div className="font-medium text-steel-blue">{pub.title}</div>
                  <div className="text-sm text-gray-600">{pub.publisher}, {pub.year}</div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      
      {/* Languages section if available */}
      {cvData.languages && cvData.languages.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-accent mb-4">Languages</h2>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-wrap gap-4">
              {cvData.languages.map((lang, index) => (
                <div key={index} className="bg-light-accent rounded-lg px-4 py-2">
                  <span className="font-medium">{lang.name}</span>
                  <span className="text-sm text-gray-600 ml-2">({lang.proficiency})</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      
      {/* Download CV button */}
      <div className="mt-8 text-center">
        <a
          href="/files/cv.pdf"
          download
          className="inline-block bg-steel-blue hover:bg-accent text-white font-medium py-2 px-6 rounded transition-colors"
        >
          {t('cv.download', 'Download CV')}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </a>
      </div>
    </Layout>
  );
}

// Fetch data at build time
export const getStaticProps: GetStaticProps<CVPageProps> = async () => {
  // Get CV data
  const cvData = getCVData();
  
  return {
    props: {
      cvData,
    },
  };
};