// components/admin/SignalForm.tsx
import React, { useState, useEffect } from 'react';
import { Signal, Newsletter, Article } from '@/types';

interface SignalFormProps {
  initialData?: Signal;
  onSubmit: (data: Omit<Signal, 'id'>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function SignalForm({ initialData, onSubmit, onCancel, isSubmitting }: SignalFormProps) {
  // Form state
  const [signalType, setSignalType] = useState<'newsletter' | 'article'>(
    initialData?.type || 'newsletter'
  );
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [url, setUrl] = useState(initialData?.url || '');
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [featured, setFeatured] = useState(initialData?.featured || false);
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState('');
  
  // Newsletter specific state
  const [frequency, setFrequency] = useState<Newsletter['frequency']>(
    (initialData as Newsletter)?.frequency || 'weekly'
  );
  const [publisher, setPublisher] = useState((initialData as Newsletter)?.publisher || '');
  const [subscriptionUrl, setSubscriptionUrl] = useState(
    (initialData as Newsletter)?.subscriptionUrl || ''
  );
  const [sampleUrl, setSampleUrl] = useState((initialData as Newsletter)?.sampleUrl || '');
  
  // Article specific state
  const [author, setAuthor] = useState((initialData as Article)?.author || '');
  const [source, setSource] = useState((initialData as Article)?.source || '');
  const [publishDate, setPublishDate] = useState(
    (initialData as Article)?.publishDate 
      ? new Date((initialData as Article).publishDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [readingTime, setReadingTime] = useState<number | undefined>(
    (initialData as Article)?.readingTime
  );
  
  // Common data for both types
  const [affiliateCode, setAffiliateCode] = useState(initialData?.affiliateCode || '');
  
  // Add a tag
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };
  
  // Remove a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  // Handle tag input keypress
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };
  
  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Common data for both signal types
    const commonData = {
      title,
      description,
      url,
      imageUrl: imageUrl || undefined,
      featured,
      tags,
      dateAdded: initialData?.dateAdded || new Date().toISOString(),
      affiliateCode: affiliateCode || undefined,
    };
    
    // Build the signal data based on type
    if (signalType === 'newsletter') {
      const newsletterData: Omit<Newsletter, 'id'> = {
        type: 'newsletter',
        ...commonData,
        frequency,
        publisher,
        subscriptionUrl: subscriptionUrl || url,
        sampleUrl: sampleUrl || undefined,
      };
      onSubmit(newsletterData);
    } else {
      const articleData: Omit<Article, 'id'> = {
        type: 'article',
        ...commonData,
        author,
        source,
        publishDate: publishDate || new Date().toISOString(),
        readingTime: readingTime || undefined,
      };
      onSubmit(articleData);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Signal Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Signal Type</label>
        <div className="flex space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio"
              name="signalType"
              value="newsletter"
              checked={signalType === 'newsletter'}
              onChange={() => setSignalType('newsletter')}
            />
            <span className="ml-2">Newsletter</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio"
              name="signalType"
              value="article"
              checked={signalType === 'article'}
              onChange={() => setSignalType('article')}
            />
            <span className="ml-2">Article</span>
          </label>
        </div>
      </div>
      
      {/* Common Fields */}
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title *
          </label>
          <input
            type="text"
            id="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-steel-blue focus:ring-steel-blue sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description *
          </label>
          <textarea
            id="description"
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-steel-blue focus:ring-steel-blue sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700">
            URL *
          </label>
          <input
            type="url"
            id="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-steel-blue focus:ring-steel-blue sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
            Image URL
          </label>
          <input
            type="url"
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-steel-blue focus:ring-steel-blue sm:text-sm"
          />
        </div>
        
        <div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="featured"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-steel-blue focus:ring-steel-blue"
            />
            <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
              Featured (will be highlighted on the page)
            </label>
          </div>
        </div>
        
        <div>
          <label htmlFor="affiliateCode" className="block text-sm font-medium text-gray-700">
            Affiliate Code (optional)
          </label>
          <input
            type="text"
            id="affiliateCode"
            value={affiliateCode}
            onChange={(e) => setAffiliateCode(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-steel-blue focus:ring-steel-blue sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
            Tags
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="text"
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleTagKeyPress}
              className="block w-full rounded-l-md border-gray-300 focus:border-steel-blue focus:ring-steel-blue sm:text-sm"
              placeholder="Add a tag and press Enter"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 rounded-r-md hover:bg-gray-100"
            >
              Add
            </button>
          </div>
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-200 text-blue-600 hover:bg-blue-300"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Newsletter Specific Fields */}
      {signalType === 'newsletter' && (
        <div className="space-y-4 border-t border-gray-200 pt-4">
          <h3 className="text-lg font-medium text-gray-700">Newsletter Details</h3>
          
          <div>
            <label htmlFor="publisher" className="block text-sm font-medium text-gray-700">
              Publisher *
            </label>
            <input
              type="text"
              id="publisher"
              required
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-steel-blue focus:ring-steel-blue sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="frequency" className="block text-sm font-medium text-gray-700">
              Frequency *
            </label>
            <select
              id="frequency"
              required
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as Newsletter['frequency'])}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-steel-blue focus:ring-steel-blue sm:text-sm"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Biweekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="subscriptionUrl" className="block text-sm font-medium text-gray-700">
              Subscription URL (if different from main URL)
            </label>
            <input
              type="url"
              id="subscriptionUrl"
              value={subscriptionUrl}
              onChange={(e) => setSubscriptionUrl(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-steel-blue focus:ring-steel-blue sm:text-sm"
              placeholder="Leave empty to use main URL"
            />
          </div>
          
          <div>
            <label htmlFor="sampleUrl" className="block text-sm font-medium text-gray-700">
              Sample Issue URL (optional)
            </label>
            <input
              type="url"
              id="sampleUrl"
              value={sampleUrl}
              onChange={(e) => setSampleUrl(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-steel-blue focus:ring-steel-blue sm:text-sm"
            />
          </div>
        </div>
      )}
      
      {/* Article Specific Fields */}
      {signalType === 'article' && (
        <div className="space-y-4 border-t border-gray-200 pt-4">
          <h3 className="text-lg font-medium text-gray-700">Article Details</h3>
          
          <div>
            <label htmlFor="author" className="block text-sm font-medium text-gray-700">
              Author *
            </label>
            <input
              type="text"
              id="author"
              required
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-steel-blue focus:ring-steel-blue sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="source" className="block text-sm font-medium text-gray-700">
              Source/Publication *
            </label>
            <input
              type="text"
              id="source"
              required
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-steel-blue focus:ring-steel-blue sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="publishDate" className="block text-sm font-medium text-gray-700">
              Publish Date *
            </label>
            <input
              type="date"
              id="publishDate"
              required
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-steel-blue focus:ring-steel-blue sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="readingTime" className="block text-sm font-medium text-gray-700">
              Reading Time (minutes, optional)
            </label>
            <input
              type="number"
              id="readingTime"
              min="1"
              value={readingTime || ''}
              onChange={(e) => setReadingTime(e.target.value ? parseInt(e.target.value) : undefined)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-steel-blue focus:ring-steel-blue sm:text-sm"
            />
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-5 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-steel-blue border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-opacity-90"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : initialData ? 'Update Signal' : 'Create Signal'}
        </button>
      </div>
    </form>
  );
}