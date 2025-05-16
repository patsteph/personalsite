import { useState, useEffect } from 'react';
import { BlogPost } from '@/types/blog';
import dynamic from 'next/dynamic';
import { uploadImageWithThumbnail } from '@/lib/api/storage';
import BlogAIAssistant from './BlogAIAssistant';
import { getAuth } from 'firebase/auth';
// Dynamically import the rich text editor to avoid SSR issues
const SimpleMDEditor = dynamic(() => import('./SimpleMDEditor'), {
  ssr: false,
  loading: () => <div className="h-64 w-full bg-gray-100 animate-pulse rounded"></div>
});

type BlogEditorProps = {
  initialPost?: BlogPost;
  onSave: (post: BlogPost | Omit<BlogPost, 'id'>) => Promise<void>;
};

// Create a new empty blog post template
const createEmptyPost = (): Omit<BlogPost, 'id'> => ({
  title: '',
  slug: '',
  summary: '',
  content: '',
  author: '',
  coverImage: '',
  tags: [],
  published: false,
  publishedAt: null,
  readingTime: 0,
});

export default function BlogEditor({ initialPost, onSave }: BlogEditorProps) {
  // If initialPost is provided, use it as the starting state, otherwise create an empty post
  const [post, setPost] = useState<BlogPost | Omit<BlogPost, 'id'>>(
    initialPost || createEmptyPost()
  );
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagsInput, setTagsInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  
  // Set tags input when initial post is loaded
  useEffect(() => {
    if (initialPost?.tags) {
      setTagsInput(initialPost.tags.join(', '));
    }
  }, [initialPost]);
  
  // Handle text field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPost(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Handle slug generation from title
  const generateSlug = () => {
    if (!post.title) return;
    
    const slug = post.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim();
    
    setPost(prev => ({ ...prev, slug }));
  };
  
  // Handle rich text editor content changes
  const handleContentChange = (content: string) => {
    setPost(prev => ({ ...prev, content }));
    
    // Calculate reading time (rough estimate: 200 words per minute)
    const wordCount = content.trim().split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));
    
    setPost(prev => ({ ...prev, content, readingTime }));
    
    // Clear content error if it exists
    if (errors.content) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.content;
        return newErrors;
      });
    }
  };

  // Generate AI summary
  const generateSummary = async () => {
    if (!post.content.trim()) {
      alert('Please add some content before generating a summary');
      return;
    }

    if (!('id' in post) || !post.id) {
      alert('Please save the post before generating a summary');
      return;
    }

    setIsGeneratingSummary(true);
    
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Not authenticated');
      }
      
      const token = await user.getIdToken();

      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          postId: post.id,
          content: post.content
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate summary');
      }

      // Update the post with the generated summary
      setPost(prev => ({
        ...prev,
        aiSummary: data.summary
      }));

    } catch (error: any) {
      console.error('Error generating summary:', error);
      alert(`Failed to generate summary: ${error.message}`);
    } finally {
      setIsGeneratingSummary(false);
    }
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setPost(prev => ({ ...prev, [name]: checked }));
  };
  
  // Handle tags input changes
  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagsInput(e.target.value);
    
    // Parse tags from comma-separated input
    const tags = e.target.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    setPost(prev => ({ ...prev, tags }));
  };
  
  // Validate form before submission
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!post.title) newErrors.title = 'Title is required';
    if (!post.slug) newErrors.slug = 'Slug is required';
    if (!post.summary) newErrors.summary = 'Summary is required';
    if (!post.content) newErrors.content = 'Content is required';
    
    // Check for unique slug if we're creating a new post
    // In a real app, you'd check this against the database
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // If post is being published for the first time, set publishedAt to ISO string
      const postToSave = {
        ...post,
        publishedAt: post.published && !post.publishedAt 
          ? new Date().toISOString() // Convert to ISO string
          : post.publishedAt
      };
      
      await onSave(postToSave);
    } catch (error) {
      console.error('Error saving blog post:', error);
      setErrors({ form: 'An error occurred while saving the blog post' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle cover image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Reset states
    setIsUploading(true);
    setUploadSuccess(false);
    setErrors((prev) => ({ ...prev, coverImage: '' }));
    
    console.log('Starting image upload for file:', file.name, 'size:', file.size, 'type:', file.type);
    
    try {
      // Validate file type
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validImageTypes.includes(file.type)) {
        throw new Error(`Invalid file type. Supported types: ${validImageTypes.join(', ')}`);
      }
      
      // Validate file size (5MB max)
      const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSizeInBytes) {
        throw new Error('File size exceeds 5MB limit');
      }
      
      console.log('Image validation passed, uploading...');
      
      // Upload the image and create a thumbnail
      const result = await uploadImageWithThumbnail(file, 'blog-images', 'blog-thumbnails');
      console.log('Upload successful, received:', result);
      
      // Verify we got back the expected data
      if (!result || !result.thumbnailURL) {
        throw new Error('Invalid response from image upload service');
      }
      
      // Update the post with the new image URL
      setPost(prev => {
        console.log('Setting post coverImage to:', result.thumbnailURL);
        return { ...prev, coverImage: result.thumbnailURL };
      });
      
      setUploadSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setUploadSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error uploading image:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to upload image. Please try again or enter a URL directly.';
      
      setErrors(prev => ({ 
        ...prev, 
        coverImage: errorMessage
      }));
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* General error message */}
      {errors.form && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {errors.form}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Title */}
        <div className="col-span-2">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={post.title}
            onChange={handleChange}
            onBlur={() => !post.slug && generateSlug()}
            className={`w-full px-4 py-2 border ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-500">{errors.title}</p>
          )}
        </div>
        
        {/* Slug */}
        <div className="col-span-2 md:col-span-1">
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
            Slug <span className="text-red-500">*</span>
          </label>
          <div className="flex">
            <input
              type="text"
              id="slug"
              name="slug"
              value={post.slug}
              onChange={handleChange}
              className={`flex-grow px-4 py-2 border ${
                errors.slug ? 'border-red-500' : 'border-gray-300'
              } rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            />
            <button
              type="button"
              onClick={generateSlug}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-r-md hover:bg-gray-300"
            >
              Generate
            </button>
          </div>
          {errors.slug ? (
            <p className="mt-1 text-sm text-red-500">{errors.slug}</p>
          ) : (
            <p className="mt-1 text-xs text-gray-500">
              This will be the URL of your blog post: /blog/{post.slug}
            </p>
          )}
        </div>
        
        {/* Author */}
        <div>
          <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
            Author
          </label>
          <input
            type="text"
            id="author"
            name="author"
            value={post.author || ''}
            onChange={handleChange}
            placeholder="A brief summary of your post"
          />
          {post.aiSummary && (
            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-medium text-gray-500">AI-Generated Summary:</span>
                <button
                  type="button"
                  onClick={() => {
                    setPost(prev => ({
                      ...prev,
                      summary: post.aiSummary || ''
                    }));
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Use this summary
                </button>
              </div>
              <p className="text-sm text-gray-700 mt-1">{post.aiSummary}</p>
            </div>
          )}
          
          <div className="mt-2 flex items-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isUploading}
              className={`${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            
            {isUploading && (
              <div className="ml-3 flex items-center text-sm text-gray-600">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading image...
              </div>
            )}
            
            {uploadSuccess && (
              <div className="ml-3 text-sm text-green-600 flex items-center">
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Image uploaded successfully!
              </div>
            )}
          </div>
          
          {errors.coverImage && (
            <p className="mt-1 text-sm text-red-500">{errors.coverImage}</p>
          )}
          
          {post.coverImage && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1">Current cover image:</p>
              <img 
                src={post.coverImage} 
                alt="Cover preview" 
                className="h-24 w-auto object-cover rounded border border-gray-300" 
              />
            </div>
          )}
        </div>
        
        {/* Tags */}
        <div className="col-span-2">
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <input
            type="text"
            id="tags"
            value={tagsInput}
            onChange={handleTagsChange}
            placeholder="technology, programming, web development"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Separate tags with commas
          </p>
          {post.tags && post.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Content Editor */}
        <div className="col-span-2">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Content <span className="text-red-500">*</span>
          </label>
          <SimpleMDEditor 
            initialContent={post.content} 
            onChange={handleContentChange}
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-500">{errors.content}</p>
          )}
        </div>
        
        {/* AI Writing Assistant */}
        <div className="col-span-2">
          <BlogAIAssistant 
            content={post.content} 
            onApplyChanges={handleContentChange}
          />
        </div>
        
        {/* Published Status */}
        <div className="col-span-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="published"
              name="published"
              checked={post.published || false}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="published" className="ml-2 block text-sm text-gray-700">
              Publish this post
            </label>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {post.published 
              ? 'This post will be visible to all visitors'
              : 'This post will be saved as a draft and only visible to you'}
          </p>
        </div>
      </div>
      
      {/* Form actions */}
      <div className="flex justify-end space-x-4 pt-4 border-t">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? 'Saving...' : (initialPost ? 'Update Post' : 'Create Post')}
        </button>
      </div>
    </form>
  );
}