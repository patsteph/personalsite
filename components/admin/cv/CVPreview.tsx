import React from 'react';
import { CVData } from '@/types/cv';
import AboutSection from '@/components/cv/AboutSection';
import SkillsAdapter from '@/components/cv/SkillsAdapter';
import EducationAdapter from '@/components/cv/EducationAdapter';
import ExperienceSection from '@/components/cv/ExperienceSection';
import TrainingSection from '@/components/cv/TrainingSection';
import InteractiveTimeline from '@/components/cv/InteractiveTimeline';
import SkillsVisualization from '@/components/cv/SkillsVisualization';
import EducationTimeline from '@/components/cv/EducationTimeline';

type CVPreviewProps = {
  data: CVData;
  mode: 'standard' | 'interactive';
};

export default function CVPreview({ data, mode }: CVPreviewProps) {
  if (mode === 'standard') {
    return (
      <div className="bg-white rounded-lg shadow p-6 max-h-[60vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 mb-4">
          <h3 className="text-lg font-medium text-gray-900">Standard CV Preview</h3>
          <p className="text-sm text-gray-500">This is how your CV will appear in the standard view.</p>
        </div>
        
        <div className="space-y-6">
          <AboutSection about={data.about} />
          <ExperienceSection experience={data.experience} />
          <SkillsAdapter skills={data.skills} />
          <EducationAdapter education={data.education} />
          {data.Training && data.Training.length > 0 && (
            <TrainingSection certifications={data.Training} />
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6 max-h-[60vh] overflow-y-auto">
      <div className="p-4 border-b border-gray-200 mb-4">
        <h3 className="text-lg font-medium text-gray-900">Interactive CV Preview</h3>
        <p className="text-sm text-gray-500">This is how your CV will appear in the interactive view.</p>
      </div>
      
      <div className="space-y-6">
        <div className="p-4 bg-white rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">About Me</h3>
          <p>{data.about}</p>
        </div>
        
        <div className="p-4 bg-white rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Experience</h3>
          <InteractiveTimeline experience={data.experience} />
        </div>
        
        <div className="p-4 bg-white rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Skills</h3>
          <SkillsVisualization skills={data.skills} />
        </div>
        
        <div className="p-4 bg-white rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Education</h3>
          <EducationTimeline education={data.education} />
        </div>
      </div>
    </div>
  );
}
