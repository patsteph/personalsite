import React, { useState } from 'react';
import { Experience } from '@/types/cv';

type ExperienceEditorProps = {
  experience: Experience[];
  onChange: (experience: Experience[]) => void;
};

export default function ExperienceEditor({ experience, onChange }: ExperienceEditorProps) {
  const [editing, setEditing] = useState<number | null>(null);
  const [newExperience, setNewExperience] = useState<Experience>({
    title: '',
    company: '',
    location: '',
    period: '',
    description: '',
    achievements: [],
    technologies: []
  });
  
  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index: number | null) => {
    const { name, value } = e.target;
    
    if (index === null) {
      // Update new experience form
      setNewExperience(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      // Update existing experience
      const updatedExperience = [...experience];
      updatedExperience[index] = {
        ...updatedExperience[index],
        [name]: value
      };
      onChange(updatedExperience);
    }
  };
  
  // Handle list inputs (achievements, technologies)
  const handleListChange = (
    value: string, 
    field: 'achievements' | 'technologies', 
    index: number | null
  ) => {
    // Split by new lines and filter empty items
    const items = value.split('\n').filter(item => item.trim() !== '');
    
    if (index === null) {
      // Update new experience form
      setNewExperience(prev => ({
        ...prev,
        [field]: items
      }));
    } else {
      // Update existing experience
      const updatedExperience = [...experience];
      updatedExperience[index] = {
        ...updatedExperience[index],
        [field]: items
      };
      onChange(updatedExperience);
    }
  };
  
  // Add new experience
  const handleAdd = () => {
    // Validate required fields
    if (!newExperience.title || !newExperience.company || !newExperience.period) {
      alert('Please fill in all required fields: Title, Company, and Period.');
      return;
    }
    
    // Add to experience array
    onChange([...experience, newExperience]);
    
    // Reset form
    setNewExperience({
      title: '',
      company: '',
      location: '',
      period: '',
      description: '',
      achievements: [],
      technologies: []
    });
  };
  
  // Delete experience
  const handleDelete = (index: number) => {
    if (confirm('Are you sure you want to delete this experience?')) {
      const updatedExperience = [...experience];
      updatedExperience.splice(index, 1);
      onChange(updatedExperience);
      setEditing(null);
    }
  };
  
  // Move item up in the list
  const moveUp = (index: number) => {
    if (index === 0) return; // Already at the top
    
    const items = Array.from(experience);
    const temp = items[index];
    items[index] = items[index - 1];
    items[index - 1] = temp;
    
    onChange(items);
  };
  
  // Move item down in the list
  const moveDown = (index: number) => {
    if (index === experience.length - 1) return; // Already at the bottom
    
    const items = Array.from(experience);
    const temp = items[index];
    items[index] = items[index + 1];
    items[index + 1] = temp;
    
    onChange(items);
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-700">Work Experience</h2>
      <p className="text-sm text-gray-500">
        Add your work history, starting with your most recent position.
      </p>
      
      {/* Existing Experience Items */}
      {experience.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Your Experience ({experience.length})
          </h3>
          
          <div className="space-y-4">
            {experience.map((exp, index) => (
              <div key={index} className="border border-gray-200 rounded-md overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                  <div className="flex items-center">
                    <h4 className="font-medium text-gray-700">
                      {exp.title} at {exp.company}
                    </h4>
                  </div>
                  <div className="flex space-x-2">
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => moveUp(index)}
                        className="text-gray-600 hover:text-gray-800"
                        title="Move Up"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                    )}
                    
                    {index < experience.length - 1 && (
                      <button
                        type="button"
                        onClick={() => moveDown(index)}
                        className="text-gray-600 hover:text-gray-800"
                        title="Move Down"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => setEditing(editing === index ? null : index)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      {editing === index ? 'Close' : 'Edit'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {editing === index && (
                  <div className="p-4 bg-white space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor={`title-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                          Job Title*
                        </label>
                        <input
                          type="text"
                          id={`title-${index}`}
                          name="title"
                          value={exp.title}
                          onChange={(e) => handleInputChange(e, index)}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor={`company-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                          Company*
                        </label>
                        <input
                          type="text"
                          id={`company-${index}`}
                          name="company"
                          value={exp.company}
                          onChange={(e) => handleInputChange(e, index)}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor={`location-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                          Location
                        </label>
                        <input
                          type="text"
                          id={`location-${index}`}
                          name="location"
                          value={exp.location}
                          onChange={(e) => handleInputChange(e, index)}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor={`period-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                          Period* (e.g. "2020 - Present")
                        </label>
                        <input
                          type="text"
                          id={`period-${index}`}
                          name="period"
                          value={exp.period}
                          onChange={(e) => handleInputChange(e, index)}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor={`description-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        id={`description-${index}`}
                        name="description"
                        rows={3}
                        value={exp.description}
                        onChange={(e) => handleInputChange(e, index)}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor={`achievements-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                        Key Achievements (one per line)
                      </label>
                      <textarea
                        id={`achievements-${index}`}
                        rows={4}
                        value={(exp.achievements || []).join('\n')}
                        onChange={(e) => handleListChange(e.target.value, 'achievements', index)}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                        placeholder="Reduced costs by 20%..."
                      />
                    </div>
                    
                    <div>
                      <label htmlFor={`technologies-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                        Technologies Used (one per line)
                      </label>
                      <textarea
                        id={`technologies-${index}`}
                        rows={3}
                        value={(exp.technologies || []).join('\n')}
                        onChange={(e) => handleListChange(e.target.value, 'technologies', index)}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                        placeholder="React, Node.js, AWS..."
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Add New Experience Form */}
      <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Add New Experience</h3>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="new-title" className="block text-sm font-medium text-gray-700 mb-1">
              Job Title*
            </label>
            <input
              type="text"
              id="new-title"
              name="title"
              value={newExperience.title}
              onChange={(e) => handleInputChange(e, null)}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
              required
            />
          </div>
          
          <div>
            <label htmlFor="new-company" className="block text-sm font-medium text-gray-700 mb-1">
              Company*
            </label>
            <input
              type="text"
              id="new-company"
              name="company"
              value={newExperience.company}
              onChange={(e) => handleInputChange(e, null)}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
              required
            />
          </div>
          
          <div>
            <label htmlFor="new-location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              id="new-location"
              name="location"
              value={newExperience.location}
              onChange={(e) => handleInputChange(e, null)}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
            />
          </div>
          
          <div>
            <label htmlFor="new-period" className="block text-sm font-medium text-gray-700 mb-1">
              Period* (e.g. "2020 - Present")
            </label>
            <input
              type="text"
              id="new-period"
              name="period"
              value={newExperience.period}
              onChange={(e) => handleInputChange(e, null)}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
              required
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label htmlFor="new-description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="new-description"
            name="description"
            rows={3}
            value={newExperience.description}
            onChange={(e) => handleInputChange(e, null)}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
          />
        </div>
        
        <div className="mt-4">
          <label htmlFor="new-achievements" className="block text-sm font-medium text-gray-700 mb-1">
            Key Achievements (one per line)
          </label>
          <textarea
            id="new-achievements"
            rows={4}
            value={(newExperience.achievements || []).join('\n')}
            onChange={(e) => handleListChange(e.target.value, 'achievements', null)}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
            placeholder="Reduced costs by 20%..."
          />
        </div>
        
        <div className="mt-4">
          <label htmlFor="new-technologies" className="block text-sm font-medium text-gray-700 mb-1">
            Technologies Used (one per line)
          </label>
          <textarea
            id="new-technologies"
            rows={3}
            value={(newExperience.technologies || []).join('\n')}
            onChange={(e) => handleListChange(e.target.value, 'technologies', null)}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
            placeholder="React, Node.js, AWS..."
          />
        </div>
        
        <div className="mt-4">
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Experience
          </button>
        </div>
      </div>
    </div>
  );
}
