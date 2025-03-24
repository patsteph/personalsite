import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { BlogPost } from '@/types/blog';
import * as api from '@/lib/api';
import { useTranslation } from '@/lib/translations';

// Dynamically import the blog editor to reduce initial load size
const BlogEditor = dynamic(() => import('@/components/admin/BlogEditor'), {
  loading: () => <div className="p-6 text-center">Loading blog editor...</div>,
  ssr: false // Editor doesn't need server-side rendering
});

export default function AdminBlogPage() {
  const router = useRouter();
  const { t } = useTranslation();
  
  // Blog posts state
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'draft'>('all');
  
  // Load blog posts on component mount
  useEffect(() => {
    fetchPosts();
  }, []);
  
  // Clear success/error messages after a delay
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [successMessage, error]);
  
  // Fetch all blog posts (published and draft)
  const fetchPosts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const allPosts = await api.blog.getAllPosts();
      setPosts(allPosts);
    } catch (err) {
      console.error('Failed to load blog posts:', err);
      setError('Failed to load blog posts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Open editor for creating a new post
  const handleNewPost = () => {
    setSelectedPost(null);
    setIsEditorOpen(true);
  };
  
  // Open editor for editing an existing post
  const handleEditPost = (post: BlogPost) => {
    setSelectedPost(post);
    setIsEditorOpen(true);
  };
  
  // Handle post creation/update from editor
  const handleSavePost = async (blogPost: BlogPost | Omit<BlogPost, 'id'>) => {
    try {
      if ('id' in blogPost && blogPost.id) {
        // Update existing post
        const success = await api.blog.updateBlogPost(blogPost.id, blogPost);
        if (success) {
          setSuccessMessage('Blog post updated successfully');
          fetchPosts(); // Refresh posts list
          setIsEditorOpen(false);
        } else {
          setError('Failed to update blog post');
        }
      } else {
        // Create new post
        const newPost = await api.blog.addBlogPost(blogPost as Omit<BlogPost, 'id'>);
        if (newPost) {
          setSuccessMessage('Blog post created successfully');
          fetchPosts(); // Refresh posts list
          setIsEditorOpen(false);
        } else {
          setError('Failed to create blog post');
        }
      }
    } catch (err) {
      console.error('Error saving blog post:', err);
      setError('An error occurred while saving the blog post');
    }
  };
  
  // Handle post deletion
  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
      return;
    }
    
    try {
      const success = await api.blog.deleteBlogPost(postId);
      if (success) {
        setSuccessMessage('Blog post deleted successfully');
        fetchPosts(); // Refresh posts list
      } else {
        setError('Failed to delete blog post');
      }
    } catch (err) {
      console.error('Error deleting blog post:', err);
      setError('An error occurred while deleting the blog post');
    }
  };
  
  // Filter posts based on search query and published state
  const filteredPosts = posts.filter(post => {
    const matchesSearch = !searchQuery || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ?? false);
    
    const matchesPublished = 
      filterPublished === 'all' ||
      (filterPublished === 'published' && post.published) ||
      (filterPublished === 'draft' && !post.published);
    
    return matchesSearch && matchesPublished;
  });
  
  // Sort posts by creation date (newest first)
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });
  
  // Format date for display
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Navigate back to admin dashboard
  const handleBackToDashboard = () => {
    router.push('/admin');
  };
  
  return (
    <ProtectedRoute>
      <Layout section="admin">
        <Head>
          <title>Blog Management | Admin</title>
        </Head>
        
        <div className="container mx-auto px-4 py-8">
          {isEditorOpen ? (
            // Blog post editor
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-steel-blue">
                  {selectedPost ? 'Edit Blog Post' : 'Create New Blog Post'}
                </h1>
                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded"
                >
                  Cancel
                </button>
              </div>
              
              <BlogEditor
                initialPost={selectedPost || undefined}
                onSave={handleSavePost}
              />
            </div>
          ) : (
            // Blog posts list
            <>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-steel-blue">Manage Blog Posts</h1>
                <div className="flex gap-4">
                  <button
                    onClick={handleBackToDashboard}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Back to Dashboard
                  </button>
                  <button
                    onClick={handleNewPost}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Create New Post
                  </button>
                </div>
              </div>
              
              {/* Alerts */}
              {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
              
              {successMessage && (
                <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                  {successMessage}
                </div>
              )}
              
              {/* Filters */}
              <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-1/2">
                  <input
                    type="text"
                    placeholder="Search by title, summary, or tags..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="w-full md:w-1/4">
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    value={filterPublished}
                    onChange={(e) => setFilterPublished(e.target.value as 'all' | 'published' | 'draft')}
                  >
                    <option value="all">All Posts</option>
                    <option value="published">Published Only</option>
                    <option value="draft">Drafts Only</option>
                  </select>
                </div>
                
                <div className="w-full md:w-1/4">
                  <button
                    onClick={fetchPosts}
                    className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md flex items-center justify-center"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Loading...' : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                        Refresh
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Blog posts table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent align-[-0.125em]" />
                    <p className="mt-4 text-gray-600">Loading blog posts...</p>
                  </div>
                ) : sortedPosts.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-600">
                      {searchQuery || filterPublished !== 'all'
                        ? 'No blog posts match your filter criteria'
                        : 'No blog posts have been created yet'}
                    </p>
                    <button
                      onClick={handleNewPost}
                      className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                      Create Your First Post
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Title
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Published Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Updated
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sortedPosts.map((post) => (
                          <tr key={post.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div>
                                  <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                    {post.title}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate max-w-xs">
                                    {post.summary}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                post.published
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {post.published ? 'Published' : 'Draft'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {post.published ? formatDate(post.publishedAt as Date) : 'Not published'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(post.updatedAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleEditPost(post)}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                              >
                                Edit
                              </button>
                              {post.published && (
                                <a
                                  href={`/blog/${post.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-900 mr-4"
                                >
                                  View
                                </a>
                              )}
                              <button
                                onClick={() => post.id && handleDeletePost(post.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}