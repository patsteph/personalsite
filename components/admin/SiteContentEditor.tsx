// components/admin/SiteContentEditor.tsx
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

// Dynamically import the rich text editor to avoid SSR issues
const TextEditor = dynamic(() => import('./TextEditor'), {
  ssr: false,
  loading: () => <div className="h-64 w-full bg-gray-100 animate-pulse rounded"></div>
});

// Define the page sections that can be edited
type PageSection = 'welcome' | 'books' | 'blog' | 'cv' | 'signals' | 'contact';

// Interface for content structure
interface SectionContent {
  title: string;
  subtitle?: string;
  content: string;
  lastModified?: Date;
  sha?: string; // GitHub file SHA for updates
}

// Demo initial content (in a real implementation, these would be loaded from files)
const initialContent: Record<PageSection, SectionContent> = {
  welcome: {
    title: 'Welcome',
    subtitle: 'Personal website of Patrick Stephens',
    content: '# Welcome to my personal website\n\nThis is the welcome page content. Edit me!',
    lastModified: new Date('2023-01-01')
  },
  books: {
    title: 'My Book Collection',
    content: '# Books\n\nThis is the books page content. Edit me!',
    lastModified: new Date('2023-01-02')
  },
  blog: {
    title: 'Blog',
    content: '# Blog\n\nThis is the blog page content. Edit me!',
    lastModified: new Date('2023-01-03')
  },
  cv: {
    title: 'Curriculum Vitae',
    content: '# CV\n\nThis is the CV page content. Edit me!',
    lastModified: new Date('2023-01-04')
  },
  signals: {
    title: 'Signals',
    content: '# Signals\n\nThis is the signals page content. Edit me!',
    lastModified: new Date('2023-01-05')
  },
  contact: {
    title: 'Contact',
    content: '# Contact\n\nThis is the contact page content. Edit me!',
    lastModified: new Date('2023-01-06')
  }
};

export default function SiteContentEditor() {
  const [activeSection, setActiveSection] = useState<PageSection>('welcome');
  const [content, setContent] = useState<Record<PageSection, SectionContent>>(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gitMessage, setGitMessage] = useState('');
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  const router = useRouter();
  
  // Load content from the API
  useEffect(() => {
    const loadContent = async () => {
      try {
        // Create a copy of the content object to update
        const updatedContent = { ...content };
        
        // Store SHA values for GitHub API
        const shaMappings: Record<string, string> = {};
        
        // Load content for each section in parallel
        await Promise.all(
          Object.keys(updatedContent).map(async (section) => {
            try {
              const response = await fetch(`/api/site-content?section=${section}`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('authToken')}` // Retrieve auth token from storage
                }
              });
              
              if (!response.ok) {
                throw new Error(`Failed to load ${section} content`);
              }
              
              const data = await response.json();
              
              if (data.success && data.data) {
                // Parse title and subtitle from the content
                const contentLines = data.data.content.split('\n');
                let title = section.charAt(0).toUpperCase() + section.slice(1);
                let subtitle = '';
                let mainContent = data.data.content;
                
                // Extract title from H1 if present
                if (contentLines[0] && contentLines[0].startsWith('# ')) {
                  title = contentLines[0].substring(2);
                  mainContent = contentLines.slice(1).join('\n');
                }
                
                // Extract subtitle from H2 if present (after title)
                if (contentLines[1] && contentLines[1].startsWith('## ')) {
                  subtitle = contentLines[1].substring(3);
                  mainContent = contentLines.slice(2).join('\n');
                }
                
                // Store the SHA for this file (needed for GitHub API updates)
                if (data.data.sha) {
                  shaMappings[section] = data.data.sha;
                }
                
                updatedContent[section as PageSection] = {
                  title,
                  subtitle,
                  content: mainContent.trim(),
                  lastModified: data.data.lastModified ? new Date(data.data.lastModified) : undefined,
                  sha: data.data.sha // Store the SHA for later use
                };
              }
            } catch (error) {
              console.error(`Error loading ${section} content:`, error);
              // Keep the initial content for this section
            }
          })
        );
        
        // Update the state with all loaded content
        setContent(updatedContent);
      } catch (error) {
        console.error('Error loading content:', error);
        setNotification({ 
          type: 'error', 
          message: 'Failed to load content. Using default content instead.' 
        });
      }
    };
    
    loadContent();
  }, []);
  
  // Handle content changes
  const handleContentChange = (htmlContent: string) => {
    setContent(prev => ({
      ...prev,
      [activeSection]: {
        ...prev[activeSection],
        content: htmlContent
      }
    }));
  };
  
  // Handle title changes
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(prev => ({
      ...prev,
      [activeSection]: {
        ...prev[activeSection],
        title: e.target.value
      }
    }));
  };
  
  // Handle subtitle changes
  const handleSubtitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(prev => ({
      ...prev,
      [activeSection]: {
        ...prev[activeSection],
        subtitle: e.target.value
      }
    }));
  };
  
  // Save content via GitHub API
  const saveContent = async () => {
    setIsSubmitting(true);
    setNotification({ type: 'info', message: 'Saving content...' });
    
    try {
      const sectionData = content[activeSection];
      
      const response = await fetch('/api/site-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          section: activeSection,
          title: sectionData.title,
          subtitle: sectionData.subtitle,
          content: sectionData.content,
          sha: sectionData.sha // Include file SHA for GitHub API
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save content');
      }
      
      // Update last modified date and get new SHA if returned
      const data = await response.json();
      setContent(prev => ({
        ...prev,
        [activeSection]: {
          ...prev[activeSection],
          lastModified: new Date(),
          sha: data.data?.sha || prev[activeSection].sha
        }
      }));
      
      setNotification({ type: 'success', message: 'Content saved successfully!' });
    } catch (error) {
      console.error('Error saving content:', error);
      setNotification({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to save content. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Create a GitHub pull request via API
  const handleGitCommit = async () => {
    if (!gitMessage.trim()) {
      setNotification({ type: 'error', message: 'Please enter a pull request title' });
      return;
    }
    
    setIsSubmitting(true);
    setNotification({ type: 'info', message: 'Creating pull request...' });
    
    try {
      const response = await fetch('/api/site-content', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          message: gitMessage
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create pull request');
      }
      
      const data = await response.json();
      
      // If we have a PR URL, display it to the user
      if (data.data?.pullRequestUrl) {
        setNotification({ 
          type: 'success', 
          message: `Pull request created successfully! PR #${data.data.pullRequestNumber}` 
        });
        
        // Open the PR in a new tab
        window.open(data.data.pullRequestUrl, '_blank');
      } else {
        setNotification({ 
          type: 'success', 
          message: data.message || 'Pull request created successfully!' 
        });
      }
      
      setGitMessage('');
    } catch (error) {
      console.error('Error creating pull request:', error);
      setNotification({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to create pull request. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format the last modified date
  const formatLastModified = (date?: Date) => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      {/* Notification */}
      {notification && (
        <div className={`mb-4 p-3 rounded-md ${
          notification.type === 'success' ? 'bg-green-100 text-green-700' :
          notification.type === 'error' ? 'bg-red-100 text-red-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {notification.message}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Page Section Selector */}
        <div className="md:col-span-1">
          <h3 className="text-lg font-semibold mb-3 text-steel-blue">Page Sections</h3>
          <ul className="space-y-1">
            {Object.keys(content).map((section) => (
              <li key={section}>
                <button
                  type="button"
                  onClick={() => setActiveSection(section as PageSection)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    activeSection === section
                      ? 'bg-steel-blue text-white'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {content[section as PageSection].title}
                </button>
              </li>
            ))}
          </ul>
          
          <div className="mt-6">
            <p className="text-sm text-gray-500">
              Last modified: {formatLastModified(content[activeSection].lastModified)}
            </p>
          </div>
          
          {/* Git Operations */}
          <div className="mt-8 pt-4 border-t">
            <h3 className="text-lg font-semibold mb-3 text-steel-blue">GitHub Operations</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="commitMessage" className="block text-sm font-medium text-gray-700 mb-1">
                  Pull Request Title
                </label>
                <input
                  type="text"
                  id="commitMessage"
                  value={gitMessage}
                  onChange={(e) => setGitMessage(e.target.value)}
                  placeholder="Update site content"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-steel-blue"
                />
              </div>
              <button
                type="button"
                onClick={handleGitCommit}
                disabled={isSubmitting}
                className={`w-full px-4 py-2 bg-accent text-white rounded-md hover:bg-opacity-90 transition-colors ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? 'Processing...' : 'Create Pull Request'}
              </button>
              <p className="text-sm text-gray-500 mt-2">
                Creates a GitHub PR with all saved changes.
              </p>
            </div>
          </div>
        </div>
        
        {/* Content Editor */}
        <div className="md:col-span-3">
          <h3 className="text-xl font-semibold mb-4 text-steel-blue">
            Editing: {content[activeSection].title}
          </h3>
          
          <div className="space-y-4">
            {/* Title Field */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={content[activeSection].title}
                onChange={handleTitleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-steel-blue"
              />
            </div>
            
            {/* Subtitle Field (optional) */}
            <div>
              <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700 mb-1">
                Subtitle (optional)
              </label>
              <input
                type="text"
                id="subtitle"
                value={content[activeSection].subtitle || ''}
                onChange={handleSubtitleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-steel-blue"
              />
            </div>
            
            {/* Content Editor */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <TextEditor
                initialContent={content[activeSection].content}
                onChange={handleContentChange}
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={saveContent}
                disabled={isSubmitting}
                className={`px-6 py-2 bg-steel-blue text-white rounded-md hover:bg-accent transition-colors ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? 'Saving...' : 'Save Content'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}