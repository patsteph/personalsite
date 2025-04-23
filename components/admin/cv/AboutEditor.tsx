import React from 'react';

type AboutEditorProps = {
  about: string;
  onChange: (value: string) => void;
};

export default function AboutEditor({ about, onChange }: AboutEditorProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-gray-700">About Information</h2>
      <p className="text-sm text-gray-500">
        Write a brief professional summary that will appear at the top of your CV.
      </p>
      
      <div>
        <label htmlFor="about" className="block text-sm font-medium text-gray-700 mb-1">
          Professional Summary
        </label>
        <textarea
          id="about"
          rows={6}
          value={about}
          onChange={(e) => onChange(e.target.value)}
          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
          placeholder="Enter your professional summary..."
        />
      </div>
      
      <div className="bg-blue-50 p-4 rounded-md">
        <h3 className="text-sm font-medium text-blue-800 mb-1">Tips for a great summary</h3>
        <ul className="list-disc pl-5 text-xs text-blue-700 space-y-1">
          <li>Keep it concise (3-5 sentences)</li>
          <li>Highlight your career focus and expertise</li>
          <li>Mention your most impressive achievements</li>
          <li>Include relevant soft skills and personal attributes</li>
          <li>Tailor it to your target audience</li>
        </ul>
      </div>
    </div>
  );
}
