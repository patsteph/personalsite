import { useState } from 'react';
import { BlogPost } from '@/types/blog';
import BlogCard from './BlogCard';

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
          <BlogCard
            key={post.slug}
            post={post}
            expanded={expandedPost === post.slug}
            onToggle={() => togglePost(post.slug)}
          />
        ))
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600">No blog posts found.</p>
        </div>
      )}
    </div>
  );
}