import { useState } from 'react';
import { BlogPost } from '@/types/blog';
import BlogCard from './BlogCard';

type BlogListProps = {
  posts: BlogPost[];
};

export default function BlogList({ posts }: BlogListProps) {
  // Track which post is currently expanded (if any)
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  
  const handlePostToggle = (post: BlogPost) => {
    // If this post is already expanded, collapse it
    // Otherwise, expand this post and collapse any others
    setExpandedSlug(prevSlug => 
      prevSlug === post.slug ? null : post.slug
    );
  };
  
  return (
    <div className="space-y-6">
      {posts.length > 0 ? (
        posts.map(post => (
          <div key={post.slug} className="mb-6">
            <BlogCard 
              post={post}
              expanded={expandedSlug === post.slug}
              onToggle={() => handlePostToggle(post)}
            />
          </div>
        ))
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600">No blog posts found.</p>
        </div>
      )}
    </div>
  );
}