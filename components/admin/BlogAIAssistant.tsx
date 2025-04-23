import React, { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { getAvailableTasks, toneOptions, AssistanceTask } from '@/lib/ai/blog-assistant';
import type { ToneOption } from '@/lib/ai/blog-assistant';
import toast from 'react-hot-toast';

interface BlogAIAssistantProps {
  content: string;
  onApplyChanges: (newContent: string) => void;
}

const BlogAIAssistant: React.FC<BlogAIAssistantProps> = ({ content, onApplyChanges }) => {
  const { user } = useAuth();
  const [selectedTask, setSelectedTask] = useState<AssistanceTask>('enhance');
  const [selectedTone, setSelectedTone] = useState<string>(toneOptions[0].value);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandFocus, setExpandFocus] = useState('');
  const [aiProvider, setAiProvider] = useState<'anthropic' | 'openai'>('anthropic');
  const [titleCount, setTitleCount] = useState(5);
  const [seoKeywords, setSeoKeywords] = useState('');
  const [enhancedContent, setEnhancedContent] = useState('');
  const [showResult, setShowResult] = useState(false);
  
  const tasks = getAvailableTasks();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error('Please enter some content to process');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to use the AI assistant');
      return;
    }

    setIsProcessing(true);
    setShowResult(false);
    
    try {
      // Prepare options based on the selected task
      let options = {};
      
      if (selectedTask === 'tone') {
        options = { tone: selectedTone };
      } else if (selectedTask === 'expand') {
        options = { focus: expandFocus };
      } else if (selectedTask === 'title') {
        options = { count: titleCount };
      } else if (selectedTask === 'seo') {
        options = { keywords: seoKeywords.split(',').map(k => k.trim()).filter(k => k) };
      }

      // Call the AI assistant API
      const response = await fetch('/api/ai/blog-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: selectedTask,
          content: content,
          options: options,
          provider: aiProvider,
          temperature: 0.7
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to process content');
      }

      setEnhancedContent(result.content);
      setShowResult(true);
      toast.success('Content processed successfully!');
    } catch (error) {
      console.error('Error using AI assistant:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process content');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyChanges = () => {
    onApplyChanges(enhancedContent);
    setShowResult(false);
    toast.success('Changes applied!');
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">AI Writing Assistant</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assistant Task
            </label>
            <select
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value as AssistanceTask)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              disabled={isProcessing}
            >
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.name} - {task.description}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              AI Provider
            </label>
            <select
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value as 'anthropic' | 'openai')}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              disabled={isProcessing}
            >
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="openai">OpenAI (GPT-4)</option>
            </select>
          </div>
        </div>
        
        {/* Task-specific options */}
        {selectedTask === 'tone' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Tone
            </label>
            <select
              value={selectedTone}
              onChange={(e) => setSelectedTone(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              disabled={isProcessing}
            >
              {toneOptions.map((tone: ToneOption) => (
                <option key={tone.value} value={tone.value}>
                  {tone.name} - {tone.description}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedTask === 'expand' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Focus Area (optional)
            </label>
            <input
              type="text"
              value={expandFocus}
              onChange={(e) => setExpandFocus(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="E.g., technical details, examples, benefits"
              disabled={isProcessing}
            />
          </div>
        )}

        {selectedTask === 'title' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Title Suggestions
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={titleCount}
              onChange={(e) => setTitleCount(parseInt(e.target.value))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              disabled={isProcessing}
            />
          </div>
        )}

        {selectedTask === 'seo' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Keywords (comma-separated)
            </label>
            <input
              type="text"
              value={seoKeywords}
              onChange={(e) => setSeoKeywords(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="E.g., nextjs, react, web development"
              disabled={isProcessing}
            />
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Process with AI'}
          </button>
        </div>
      </form>

      {showResult && (
        <div className="mt-6">
          <h4 className="text-md font-medium text-gray-900 mb-2">AI Result</h4>
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
            <pre className="whitespace-pre-wrap font-sans text-sm">{enhancedContent}</pre>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleApplyChanges}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Apply Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogAIAssistant;
