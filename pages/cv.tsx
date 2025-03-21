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
import { useState } from 'react';
import { logAnalyticsEvent } from '@/lib/analytics';

// Props type definition
type CVPageProps = {
  cvData: CVData;
};

export default function CVPage({ cvData }: CVPageProps) {
  const { t } = useTranslation();
  const [showCareerJourney, setShowCareerJourney] = useState(false);
  
  // Log analytics event when career journey is viewed
  const handleCareerJourneyView = () => {
    setShowCareerJourney(true);
    
    try {
      logAnalyticsEvent('career_journey_view', {
        page: 'cv'
      });
    } catch (error) {
      console.error('Error logging career journey view:', error);
    }
  };
  
  // Close the career journey modal
  const closeCareerJourney = () => {
    setShowCareerJourney(false);
  };
  
  return (
    <Layout section="cv">
      <h1 className="text-3xl md:text-4xl font-bold text-accent mb-8">
        {t('cv.title', 'Curriculum Vitae')}
      </h1>
      
      {/* Visual Career Journey Link */}
      <div className="mb-8 bg-white rounded-lg shadow p-6 text-center">
        <h2 className="text-2xl font-bold text-accent mb-4">Visual Career Journey</h2>
        <p className="text-steel-blue mb-4">Explore my professional journey in a visual timeline format</p>
        <button 
          onClick={handleCareerJourneyView}
          className="inline-block bg-steel-blue hover:bg-accent text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          View Career Timeline
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
      
      <AboutSection about={cvData.about} />
      
      <ExperienceSection experience={cvData.experience} />
      
      <SkillsSection skills={cvData.skills} />
      
      <TrainingSection certifications={cvData.Training || []} />
      
      <EducationSection education={cvData.education} />
      
      {/* Visual Career Journey Modal */}
      {showCareerJourney && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={closeCareerJourney}
          style={{ backdropFilter: 'blur(5px)' }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transform animate-scaleIn"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button 
              onClick={closeCareerJourney}
              className="absolute top-3 right-3 bg-gray-200 hover:bg-gray-300 rounded-full p-2 text-gray-700 transition-colors z-10"
              aria-label="Close modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="p-6 pt-10">
              <h2 className="text-2xl font-bold text-accent mb-4">My Professional Journey</h2>
              
              <div className="relative py-8">
                {/* Timeline imagery will be loaded here */}
                <div className="w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <p className="text-gray-500">Career timeline image will be displayed here</p>
                  <p className="text-sm text-gray-400 mt-2">Upload an image to public/images/career-timeline.jpg</p>
                </div>
                
                <div className="text-center mt-4">
                  <p className="text-steel-blue">
                    This visual representation shows my career progression, highlighting key milestones, 
                    projects, and skills acquired along the way. The journey illustrates my growth from 
                    entry-level positions to more advanced roles and responsibilities.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
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