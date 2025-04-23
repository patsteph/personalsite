import { GetStaticProps } from 'next';
import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { CVData } from '@/types/cv';
import { useTranslation } from '@/lib/translations';
import { trackUserAction } from '@/lib/analytics';
import { motion, AnimatePresence } from 'framer-motion';
import InteractiveTimeline from '@/components/cv/InteractiveTimeline';
import SkillsVisualization from '@/components/cv/SkillsVisualization';
import EducationTimeline from '@/components/cv/EducationTimeline';
import AboutSection from '@/components/cv/AboutSection';
import { getInteractiveCVData } from '@/lib/cv-interactive';
import Image from 'next/image';
import Link from 'next/link';

// Props type definition
type InteractiveResumeProps = {
  cvData: CVData;
};

export default function InteractiveResumePage({ cvData }: InteractiveResumeProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>('experience');
  const [isLoaded, setIsLoaded] = useState(false);
  const [showTestimonial, setShowTestimonial] = useState<number | null>(null);
  
  // Log analytics event when page is viewed
  useEffect(() => {
    setIsLoaded(true);
    
    try {
      trackUserAction('interactive_resume_view', 'cv', 'interactive');
    } catch (error) {
      console.error('Error logging interactive resume view:', error);
    }
  }, []);
  
  // Handle tab changing
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    try {
      trackUserAction('interactive_resume_tab', 'cv', tab);
    } catch (error) {
      console.error('Error logging tab change:', error);
    }
  };
  
  // Handle testimonial viewing
  const handleTestimonialView = (index: number) => {
    setShowTestimonial(showTestimonial === index ? null : index);
  };
  
  return (
    <Layout section="cv">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-accent">
            {t('cv.interactive_title', 'Interactive Resume')}
          </h1>
          <Link href="/cv" className="text-steel-blue hover:text-accent transition-colors">
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {t('cv.standard_view', 'Standard View')}
            </span>
          </Link>
        </div>
        
        {/* Introduction with animation */}
        <motion.div
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="w-32 h-32 rounded-full overflow-hidden flex-shrink-0 border-4 border-light-accent">
              <Image 
                src="/images/profile.jpg" 
                alt="Profile" 
                width={128} 
                height={128}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-steel-blue mb-2">About Me</h2>
              <p className="text-gray-700">{cvData.about}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a 
                  href="https://github.com/yourusername" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-full transition-colors"
                >
                  <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  GitHub
                </a>
                <a 
                  href="https://linkedin.com/in/yourusername" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-full transition-colors"
                >
                  <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  LinkedIn
                </a>
                <a 
                  href="/files/cv.pdf" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm bg-accent hover:bg-steel-blue text-white px-3 py-1 rounded-full transition-colors"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download CV
                </a>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Tabs Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-2 border-b border-gray-200 overflow-x-auto pb-1">
            <button
              className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'experience'
                  ? 'text-accent border-b-2 border-accent -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => handleTabChange('experience')}
            >
              Experience
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'skills'
                  ? 'text-accent border-b-2 border-accent -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => handleTabChange('skills')}
            >
              Skills
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'education'
                  ? 'text-accent border-b-2 border-accent -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => handleTabChange('education')}
            >
              Education
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'projects'
                  ? 'text-accent border-b-2 border-accent -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => handleTabChange('projects')}
            >
              Projects
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'testimonials'
                  ? 'text-accent border-b-2 border-accent -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => handleTabChange('testimonials')}
            >
              Testimonials
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Experience Tab */}
            {activeTab === 'experience' && (
              <div>
                <InteractiveTimeline experience={cvData.experience} />
              </div>
            )}
            
            {/* Skills Tab */}
            {activeTab === 'skills' && (
              <div>
                <SkillsVisualization skills={cvData.skills} />
              </div>
            )}
            
            {/* Education Tab */}
            {activeTab === 'education' && (
              <div>
                <EducationTimeline education={cvData.education} />
                
                {/* Certifications */}
                {cvData.Training && cvData.Training.length > 0 && (
                  <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-xl font-bold text-steel-blue mb-4">Certifications & Training</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {cvData.Training.map((cert, index) => (
                        <motion.div
                          key={index}
                          className="bg-light-accent rounded-lg p-4"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ y: -5 }}
                        >
                          <div className="font-medium text-accent">{cert.name}</div>
                          <div className="text-sm text-gray-600">{cert.year}</div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Projects Tab */}
            {activeTab === 'projects' && cvData.projects && (
              <div className="space-y-6">
                {cvData.projects.map((project, index) => (
                  <motion.div
                    key={index}
                    className="bg-white rounded-lg shadow-lg overflow-hidden"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                  >
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-steel-blue">{project.name}</h3>
                      <div className="text-sm text-gray-600 mb-3">
                        {project.role && <span className="mr-2">{project.role}</span>}
                        <span>{project.period}</span>
                      </div>
                      <p className="text-gray-700 mb-3">{project.description}</p>
                      
                      {/* Technologies */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {project.technologies.map((tech, i) => (
                          <span 
                            key={i}
                            className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                      
                      {/* Achievements */}
                      {project.achievements && (
                        <div className="mt-3">
                          <h4 className="font-medium text-sm text-accent mb-1">Key Results:</h4>
                          <ul className="list-disc pl-5 text-sm">
                            {project.achievements.map((achievement, i) => (
                              <li key={i} className="text-gray-700">{achievement}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Project Link */}
                      {project.url && (
                        <div className="mt-4">
                          <a 
                            href={project.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-accent hover:text-steel-blue transition-colors"
                          >
                            <span>View Project</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            
            {/* Testimonials Tab */}
            {activeTab === 'testimonials' && cvData.testimonials && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cvData.testimonials.map((testimonial, index) => (
                  <motion.div
                    key={index}
                    className="bg-white rounded-lg shadow-lg p-6"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    onClick={() => handleTestimonialView(index)}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-4">
                        {testimonial.image ? (
                          <Image 
                            src={testimonial.image} 
                            alt={testimonial.name} 
                            width={50}
                            height={50}
                            className="w-12 h-12 rounded-full object-cover border-2 border-light-accent"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-light-accent flex items-center justify-center text-accent font-bold text-xl">
                            {testimonial.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-steel-blue">{testimonial.name}</h3>
                        <p className="text-sm text-gray-600">
                          {testimonial.role}, {testimonial.company}
                        </p>
                        <div className="mt-2 text-gray-700">
                          <p className="line-clamp-3">{testimonial.content}</p>
                        </div>
                        <button 
                          className="mt-2 text-sm text-accent hover:text-steel-blue transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTestimonialView(index);
                          }}
                        >
                          {showTestimonial === index ? 'Read less' : 'Read more'}
                        </button>
                      </div>
                    </div>
                    
                    {/* Full testimonial modal */}
                    <AnimatePresence>
                      {showTestimonial === index && (
                        <motion.div
                          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setShowTestimonial(null)}
                        >
                          <motion.div 
                            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button 
                              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                              onClick={() => setShowTestimonial(null)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                            <div className="flex items-center mb-4">
                              {testimonial.image ? (
                                <Image 
                                  src={testimonial.image} 
                                  alt={testimonial.name} 
                                  width={50}
                                  height={50}
                                  className="w-12 h-12 rounded-full object-cover border-2 border-light-accent mr-4"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-light-accent flex items-center justify-center text-accent font-bold text-xl mr-4">
                                  {testimonial.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <h3 className="font-bold text-steel-blue">{testimonial.name}</h3>
                                <p className="text-sm text-gray-600">
                                  {testimonial.role}, {testimonial.company}
                                </p>
                              </div>
                            </div>
                            <div className="text-gray-700">
                              <p>{testimonial.content}</p>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </Layout>
  );
}

// Fetch data at build time
export const getStaticProps: GetStaticProps<InteractiveResumeProps> = async () => {
  // Get enhanced CV data
  const cvData = getInteractiveCVData();
  
  return {
    props: {
      cvData,
    },
  };
};
