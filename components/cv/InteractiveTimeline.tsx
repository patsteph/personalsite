import React, { useState, useRef, useEffect } from 'react';
import { Experience } from '@/types/cv';
import { motion } from 'framer-motion';

type InteractiveTimelineProps = {
  experience: Experience[];
};

export default function InteractiveTimeline({ experience }: InteractiveTimelineProps) {
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Sort experience by date (assuming period is in format "YYYY - YYYY" or "YYYY - Present")
  const sortedExperience = [...experience].sort((a, b) => {
    const aStartYear = parseInt(a.period.split(' - ')[0], 10);
    const bStartYear = parseInt(b.period.split(' - ')[0], 10);
    return bStartYear - aStartYear; // Most recent first
  });
  
  // Calculate years for timeline
  const years = sortedExperience.map(job => {
    const [startYear, endYear] = job.period.split(' - ');
    return {
      start: parseInt(startYear, 10),
      end: endYear === 'Present' ? new Date().getFullYear() : parseInt(endYear, 10)
    };
  });
  
  const earliestYear = Math.min(...years.map(y => y.start));
  const latestYear = Math.max(...years.map(y => y.end));
  const timelineYears = Array.from({ length: latestYear - earliestYear + 1 }, (_, i) => earliestYear + i);
  
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
  
  // Determine colors for each experience entry
  const colors = [
    'bg-blue-500', 'bg-purple-500', 'bg-green-500', 
    'bg-yellow-500', 'bg-red-500', 'bg-indigo-500'
  ];
  
  return (
    <div className="my-8 p-4 bg-white rounded-lg shadow-lg" ref={timelineRef}>
      <h3 className="text-xl font-bold text-center mb-8 text-steel-blue">Interactive Career Timeline</h3>
      
      {/* Year markers */}
      <div className="flex justify-between mb-2 px-4">
        {timelineYears.filter((_, i) => i % 2 === 0).map(year => (
          <div key={year} className="text-xs text-gray-500">{year}</div>
        ))}
      </div>
      
      {/* Timeline bar */}
      <div className="h-2 bg-gray-200 rounded-full mb-8 relative">
        {sortedExperience.map((job, index) => {
          const startYear = parseInt(job.period.split(' - ')[0], 10);
          const endYear = job.period.split(' - ')[1] === 'Present' 
            ? new Date().getFullYear() 
            : parseInt(job.period.split(' - ')[1], 10);
          
          const startPercent = ((startYear - earliestYear) / (latestYear - earliestYear)) * 100;
          const endPercent = ((endYear - earliestYear) / (latestYear - earliestYear)) * 100;
          const width = endPercent - startPercent;
          
          return (
            <motion.div
              key={index}
              className={`absolute h-2 rounded-full cursor-pointer ${colors[index % colors.length]}`}
              style={{
                left: `${startPercent}%`,
                width: `${width}%`
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={isVisible ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedJob(selectedJob === index ? null : index)}
              whileHover={{ y: -2 }}
            />
          );
        })}
      </div>
      
      {/* Job markers */}
      <div className="flex justify-between relative px-4 mb-8">
        {sortedExperience.map((job, index) => {
          const startYear = parseInt(job.period.split(' - ')[0], 10);
          const position = ((startYear - earliestYear) / (latestYear - earliestYear)) * 100;
          
          return (
            <motion.div
              key={index}
              className="absolute transform -translate-x-1/2"
              style={{ left: `${position}%` }}
              initial={{ y: 20, opacity: 0 }}
              animate={isVisible ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
            >
              <div 
                className={`w-3 h-3 rounded-full ${colors[index % colors.length]} cursor-pointer`}
                onClick={() => setSelectedJob(selectedJob === index ? null : index)}
              />
            </motion.div>
          );
        })}
      </div>
      
      {/* Detailed job cards */}
      <div className="space-y-4">
        {sortedExperience.map((job, index) => (
          <motion.div 
            key={index}
            className={`bg-white border rounded-lg p-4 ${selectedJob === index ? 'border-accent shadow-md' : 'border-gray-200'}`}
            initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
            animate={{ 
              height: selectedJob === index ? 'auto' : '60px',
              opacity: 1
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center cursor-pointer" onClick={() => setSelectedJob(selectedJob === index ? null : index)}>
              <div>
                <h4 className="font-medium text-lg">{job.title}</h4>
                <p className="text-sm text-gray-600">{job.company}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">{job.period}</p>
                <p className="text-xs text-gray-500">{job.location}</p>
              </div>
            </div>
            
            {selectedJob === index && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mt-4"
              >
                <p className="text-gray-700">{job.description}</p>
                
                {job.achievements && (
                  <div className="mt-2">
                    <h5 className="font-medium text-sm text-accent mb-1">Key Achievements:</h5>
                    <ul className="list-disc pl-5 text-sm">
                      {job.achievements.map((achievement, i) => (
                        <li key={i} className="text-gray-700">{achievement}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {job.technologies && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {job.technologies.map((tech, i) => (
                      <span key={i} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
