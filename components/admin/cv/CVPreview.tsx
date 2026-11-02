import React from 'react';
import { CVData } from '@/types/cv';
import AboutSection from '@/components/cv/AboutSection';
import SkillsAdapter from '@/components/cv/SkillsAdapter';
import EducationAdapter from '@/components/cv/EducationAdapter';
import ExperienceSection from '@/components/cv/ExperienceSection';
import TrainingSection from '@/components/cv/TrainingSection';

type CVPreviewProps = {
  data: CVData;
};

export default function CVPreview({ data }: CVPreviewProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 max-h-[60vh] overflow-y-auto">
      <div className="p-4 border-b border-gray-200 mb-4">
        <h3 className="text-lg font-medium text-gray-900">CV Preview</h3>
        <p className="text-sm text-gray-500">This is how your CV will appear on the site.</p>
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
