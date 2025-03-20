import { useState } from 'react';
import Link from 'next/link';
import { BlogPost } from '@/types/blog';
import { format } from 'date-fns';

type BlogListProps = {
  posts: BlogPost[];
};

export default function BlogList({ posts }: BlogListProps) {
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  
  // Toggle expanded state for a post
  const togglePost = (slug: string) => {
    if (expandedPost === slug) {
      setExpandedPost(null);
    } else {
      setExpandedPost(slug);
    }
  };
  
  return (
    <div className="space-y-6">
      {posts.length > 0 ? (
        posts.map(post => (
          <article 
            key={post.slug} 
            className={`bg-white rounded-lg overflow-hidden shadow transition-all duration-300 ${expandedPost === post.slug ? 'shadow-md' : 'hover:shadow-md'}`}
          >
            <div 
              className="p-6 cursor-pointer"
              onClick={() => togglePost(post.slug)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-accent mb-2">
                    {post.title}
                  </h2>
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <span>Published on {format(new Date(post.date || new Date().toISOString()), 'MMMM d, yyyy')}</span>
                    <span className="mx-2">•</span>
                    <span>{post.readingTime} min read</span>
                  </div>
                  <p className="text-steel-blue italic">
                    {post.summary}
                  </p>
                </div>
                
                <div className={`text-steel-blue transition-transform duration-300 ${expandedPost === post.slug ? 'rotate-180' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>
            </div>
            
            {expandedPost === post.slug ? (
              <div className="px-6 pb-6 blog-content">
                <div dangerouslySetInnerHTML={{ __html: post.content }} />
              </div>
            ) : (
              <div className="px-6 pb-6">
                <Link 
                  href={`/blog/${post.slug}`}
                  className="inline-block text-steel-blue hover:text-accent font-medium transition-colors"
                >
                  Read More →
                </Link>
              </div>
            )}
          </article>
        ))
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600">No blog posts found.</p>
        </div>
      )}
    </div>
  );
}