import { GetStaticProps } from 'next';
import Layout from '@/components/layout/Layout';
import AboutSection from '@/components/cv/AboutSection';
import ExperienceSection from '@/components/cv/ExperienceSection';
import SkillsAdapter from '@/components/cv/SkillsAdapter';
import EducationAdapter from '@/components/cv/EducationAdapter';
import TrainingSection from '@/components/cv/TrainingSection';
import { getCVData } from '@/lib/cv';
import { CVData } from '@/types/cv';
import { useTranslation } from '@/lib/translations';
import { useState } from 'react';
import { trackUserAction } from '@/lib/analytics';
import Image from 'next/image';
import Link from 'next/link';

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
      trackUserAction('career_journey_view', 'cv', 'career_timeline');
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
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl md:text-4xl font-bold text-accent">
          {t('cv.title', 'Curriculum Vitae')}
        </h1>
        <Link href="/interactive-resume" className="inline-block bg-accent hover:bg-steel-blue text-white font-medium py-2 px-4 rounded transition-colors">
          {t('cv.interactive_view', 'Interactive View')}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
      
      {/* Under Construction Banner */}
      <div className="mb-8 bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-medium text-yellow-700">Under Construction</p>
            <p className="text-sm text-yellow-600">The Interactive Resume feature is currently being developed. The placeholder content does not reflect my actual experience or skills.</p>
          </div>
        </div>
      </div>
      
      {/* Visual Career Journey Link - Compact Version */}
      <div className="mb-4 bg-white rounded-lg shadow p-3 text-center">
        <h2 className="text-lg font-bold text-accent mb-1">Visual Career Journey</h2>
        <div className="flex items-center justify-between">
          <p className="text-steel-blue text-sm ml-2">Timeline visualization of my professional path</p>
          <button 
            onClick={handleCareerJourneyView}
            className="inline-block bg-steel-blue hover:bg-accent text-white font-medium py-1 px-3 text-sm rounded-lg transition-colors"
          >
            View
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
      
      <AboutSection about={cvData.about} />
      
      <ExperienceSection experience={cvData.experience} />
      
      <SkillsAdapter skills={cvData.skills} />
      
      <TrainingSection certifications={cvData.Training || []} />
      
      <EducationAdapter education={cvData.education} />
      
      {/* Visual Career Journey Modal */}
      {showCareerJourney && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={closeCareerJourney}
          style={{ backdropFilter: 'blur(5px)' }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto transform animate-scaleIn"
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
            
            <div className="p-4 pt-8">
              <h2 className="text-xl font-bold text-accent mb-2">My Professional Journey</h2>
              
              <div className="relative py-4">
                {/* Timeline imagery */}
                <div className="w-full h-[350px] bg-gray-100 rounded-lg overflow-hidden mb-2">
                  <Image 
                    src="/images/career-timeline.jpg" 
                    alt="Career Timeline" 
                    width={800}
                    height={350}
                    className="w-full h-full object-contain"
                    priority
                  />
                </div>
                
                <div className="text-center mt-2">
                  <p className="text-steel-blue text-sm">
                    A visual representation of my career progression, highlighting key milestones and skills acquired along the way.
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