import { useState } from 'react';
import { Skill } from '@/types/cv';

type SkillsEditorProps = {
  skills: Skill[];
  onChange: (skills: Skill[]) => void;
};

export default function SkillsEditor({ skills, onChange }: SkillsEditorProps) {
  const [newSkill, setNewSkill] = useState<Skill>({
    name: '',
    category: '',
    proficiency: 1,
  });
  const [editIndex, setEditIndex] = useState<number | null>(null);

  // Available skill categories
  const categories = [
    'Programming Languages',
    'Frameworks',
    'Frontend',
    'Backend',
    'Databases',
    'DevOps',
    'Tools & Technologies',
    'Design',
    'Soft Skills',
    'Other'
  ];

  // Handle adding a new skill
  const handleAddSkill = () => {
    if (!newSkill.name || !newSkill.category) {
      alert('Please provide both name and category for the skill');
      return;
    }

    onChange([...skills, newSkill]);
    setNewSkill({
      name: '',
      category: '',
      proficiency: 1,
    });
  };

  // Handle updating an existing skill
  const handleUpdateSkill = (index: number) => {
    const updatedSkills = [...skills];
    updatedSkills[index] = {
      ...updatedSkills[index],
      ...newSkill
    };
    onChange(updatedSkills);
    setNewSkill({
      name: '',
      category: '',
      proficiency: 1,
    });
    setEditIndex(null);
  };

  // Load skill data for editing
  const handleEditSkill = (index: number) => {
    setNewSkill({ ...skills[index] });
    setEditIndex(index);
  };

  // Delete a skill
  const handleDeleteSkill = (index: number) => {
    if (confirm('Are you sure you want to delete this skill?')) {
      const updatedSkills = [...skills];
      updatedSkills.splice(index, 1);
      onChange(updatedSkills);
      
      if (editIndex === index) {
        setEditIndex(null);
        setNewSkill({
          name: '',
          category: '',
          proficiency: 1,
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-700">Skills</h2>
      <p className="text-sm text-gray-500">
        Add your professional skills with categories and proficiency levels (1-5).
      </p>

      {/* Add/Edit Skill Form */}
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          {editIndex !== null ? 'Edit Skill' : 'Add New Skill'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="skill-name" className="block text-sm font-medium text-gray-700 mb-1">
              Skill Name*
            </label>
            <input
              type="text"
              id="skill-name"
              value={newSkill.name}
              onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
              required
            />
          </div>

          <div>
            <label htmlFor="skill-category" className="block text-sm font-medium text-gray-700 mb-1">
              Category*
            </label>
            <select
              id="skill-category"
              value={newSkill.category}
              onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="skill-proficiency" className="block text-sm font-medium text-gray-700 mb-1">
            Proficiency (1-5)
          </label>
          <div className="flex items-center">
            <input
              type="range"
              id="skill-proficiency"
              min="1"
              max="5"
              value={Number(newSkill.proficiency)}
              onChange={(e) => setNewSkill({ ...newSkill, proficiency: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              {newSkill.proficiency}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="skill-description" className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            id="skill-description"
            value={newSkill.description || ''}
            onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
            rows={2}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="skill-years" className="block text-sm font-medium text-gray-700 mb-1">
            Years of Experience (Optional)
          </label>
          <input
            type="number"
            id="skill-years"
            value={newSkill.years || ''}
            onChange={(e) => setNewSkill({ ...newSkill, years: parseInt(e.target.value) || undefined })}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
            min="0"
          />
        </div>

        <div className="flex justify-end">
          {editIndex !== null ? (
            <div className="space-x-2">
              <button
                type="button"
                onClick={() => {
                  setEditIndex(null);
                  setNewSkill({
                    name: '',
                    category: '',
                    proficiency: 1,
                  });
                }}
                className="px-3 py-1 text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpdateSkill(editIndex)}
                className="px-3 py-1 text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700"
              >
                Update Skill
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-3 py-1 text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700"
            >
              Add Skill
            </button>
          )}
        </div>
      </div>

      {/* Skills List */}
      {skills.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Your Skills ({skills.length})
          </h3>

          <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-[1fr,1fr,100px,auto] gap-2 px-4 py-2 bg-gray-100 text-sm font-medium text-gray-700">
              <div>Name</div>
              <div>Category</div>
              <div>Proficiency</div>
              <div>Actions</div>
            </div>

            <div className="divide-y divide-gray-200">
              {skills.map((skill, index) => (
                <div key={index} className="grid grid-cols-[1fr,1fr,100px,auto] gap-2 px-4 py-3 items-center">
                  <div className="text-gray-900">{skill.name}</div>
                  <div className="text-gray-600">{skill.category}</div>
                  <div>
                    <div className="flex items-center">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-2 bg-indigo-600 rounded-full"
                          style={{ width: `${(skill.proficiency as number) * 20}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-xs text-gray-700">{skill.proficiency}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleEditSkill(index)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSkill(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
