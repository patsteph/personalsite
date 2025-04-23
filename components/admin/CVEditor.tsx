import { useState } from 'react';
import { CVData } from '@/types/cv';
import AboutEditor from './cv/AboutEditor';
import ExperienceEditor from './cv/ExperienceEditor';
import SkillsEditor from './cv/SkillsEditor';
import EducationEditor from './cv/EducationEditor';
import TrainingEditor from './cv/TrainingEditor';
import CVPreview from './cv/CVPreview';

type CVEditorProps = {
  initialData?: CVData;
  onSave: (data: CVData) => void;
  saving: boolean;
};

// Default data structure if none is provided
const defaultCVData: CVData = {
  about: '',
  experience: [],
  skills: [],
  education: [],
  Training: [],
  publications: [],
  languages: [],
  projects: [],
  testimonials: []
};

export default function CVEditor({ initialData, onSave, saving }: CVEditorProps) {
  // Use initial data or default structure
  const [cvData, setCvData] = useState<CVData>(initialData || defaultCVData);
  const [activeTab, setActiveTab] = useState<string>('about');
  const [previewMode, setPreviewMode] = useState<'standard' | 'interactive' | null>(null);
  
  // Update CV data
  const updateCvData = (key: keyof CVData, value: any) => {
    setCvData(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(cvData);
  };
  
  // Tab configuration
  const tabs = [
    { id: 'about', label: 'About' },
    { id: 'experience', label: 'Experience' },
    { id: 'skills', label: 'Skills' },
    { id: 'education', label: 'Education' },
    { id: 'training', label: 'Training & Certifications' },
    { id: 'projects', label: 'Projects' },
    { id: 'languages', label: 'Languages' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'preview', label: 'Preview' }
  ];
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      {/* Tabs Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex -mb-px space-x-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPreviewMode(null);
              }}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* About Section */}
        {activeTab === 'about' && (
          <AboutEditor
            about={cvData.about}
            onChange={(value) => updateCvData('about', value)}
          />
        )}
        
        {/* Experience Section */}
        {activeTab === 'experience' && (
          <ExperienceEditor
            experience={cvData.experience}
            onChange={(value) => updateCvData('experience', value)}
          />
        )}
        
        {/* Skills Section */}
        {activeTab === 'skills' && (
          <SkillsEditor
            skills={cvData.skills}
            onChange={(value) => updateCvData('skills', value)}
          />
        )}
        
        {/* Education Section */}
        {activeTab === 'education' && (
          <EducationEditor
            education={cvData.education}
            onChange={(value) => updateCvData('education', value)}
          />
        )}
        
        {/* Training Section */}
        {activeTab === 'training' && (
          <TrainingEditor
            certifications={cvData.Training || []}
            onChange={(value) => updateCvData('Training', value)}
          />
        )}
        
        {/* Preview Section */}
        {activeTab === 'preview' && (
          <div>
            <div className="mb-4 flex space-x-4">
              <button
                type="button"
                onClick={() => setPreviewMode('standard')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  previewMode === 'standard'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Standard View
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('interactive')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  previewMode === 'interactive'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Interactive View
              </button>
            </div>
            
            {previewMode && (
              <CVPreview data={cvData} mode={previewMode} />
            )}
          </div>
        )}
        
        {/* Form Actions */}
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className={`px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              saving ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {saving ? 'Saving...' : 'Save CV Data'}
          </button>
        </div>
      </form>
    </div>
  );
}
