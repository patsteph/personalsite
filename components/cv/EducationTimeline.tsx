import React, { useRef, useEffect, useState } from 'react';
import { Education } from '@/types/cv';
import { motion } from 'framer-motion';

type EducationTimelineProps = {
  education: Education[];
};

export default function EducationTimeline({ education }: EducationTimelineProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Sort education by date (starting with most recent)
  const sortedEducation = [...education].sort((a, b) => {
    const aYear = parseInt(a.year.split(' - ')[1] || a.year, 10);
    const bYear = parseInt(b.year.split(' - ')[1] || b.year, 10);
    return bYear - aYear;
  });
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    
    if (timelineRef.current) {
      observer.observe(timelineRef.current);
    }
    
    return () => {
      if (timelineRef.current) {
        observer.unobserve(timelineRef.current);
      }
    };
  }, []);
  
  return (
    <div className="my-8" ref={timelineRef}>
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-0 sm:left-1/2 ml-4 sm:ml-0 w-0.5 h-full bg-gray-200 transform -translate-x-1/2"></div>
        
        {/* Education items */}
        {sortedEducation.map((edu, index) => (
          <motion.div 
            key={index}
            className="relative mb-12"
            initial={{ opacity: 0, y: 50 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ delay: index * 0.2 }}
          >
            <div className={`flex items-center ${index % 2 === 0 ? 'sm:flex-row-reverse' : ''}`}>
              {/* Timeline dot */}
              <div className="absolute left-0 sm:left-1/2 ml-4 sm:ml-0 w-8 h-8 bg-accent rounded-full flex items-center justify-center transform -translate-x-1/2 z-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </div>
              
              {/* Content card */}
              <div className={`bg-white rounded-lg shadow p-6 ml-12 sm:ml-0 w-full sm:w-5/12 ${
                index % 2 === 0 ? 'sm:mr-auto sm:text-right' : 'sm:ml-auto'
              }`}>
                <h3 className="text-xl font-semibold text-steel-blue">{edu.degree}</h3>
                <div className="text-gray-600 mb-2">{edu.institution}</div>
                <div className="inline-block px-3 py-1 bg-light-accent text-accent text-sm rounded-full mb-2">
                  {edu.year}
                </div>
                {edu.description && (
                  <motion.p 
                    className="text-gray-700 mt-2"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    transition={{ delay: 0.3 + index * 0.2 }}
                  >
                    {edu.description}
                  </motion.p>
                )}
                {edu.achievements && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 + index * 0.2 }}
                    className="mt-2"
                  >
                    <ul className={`list-disc ${index % 2 === 0 ? 'sm:ml-auto sm:mr-5 sm:text-right' : 'ml-5'}`}>
                      {edu.achievements.map((achievement, i) => (
                        <li key={i} className="text-gray-700 text-sm">{achievement}</li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
