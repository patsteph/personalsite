import { BlogPost } from '@/types/blog';
import Link from 'next/link';
import { format } from 'date-fns';
import { useTranslation } from '@/lib/translations';
import { useState } from 'react';

type BlogCardProps = {
  post: BlogPost;
  expanded?: boolean;
  onToggle?: () => void;
};

export default function BlogCard({ post, expanded: propExpanded = false, onToggle }: BlogCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(propExpanded);
  const { t } = useTranslation();
  
  // Use prop expanded if controlled by parent, otherwise use internal state
  const isExpanded = onToggle ? propExpanded : internalExpanded;
  
  // Function to toggle expanded state
  const toggleExpanded = (e: React.MouseEvent) => {
    // Prevent any parent event handlers from being called
    e.stopPropagation();
    
    if (onToggle) {
      // If onToggle is provided, use it (controlled component)
      onToggle();
    } else {
      // Otherwise, use internal state (uncontrolled component)
      setInternalExpanded(!internalExpanded);
    }
  };
  
  // Format the date - use date if available, otherwise published date or current date
  const dateToFormat = post.date 
    ? new Date(post.date) 
    : (post.publishedAt || new Date());
  const formattedDate = format(dateToFormat, 'MMMM d, yyyy');
  
  return (
    <article className={`
      bg-white rounded-lg overflow-hidden shadow-sm transition-all duration-300
      ${isExpanded ? 'shadow-md' : 'hover:shadow-md'}
      ${!isExpanded ? 'hover:bg-gray-50' : ''}
      relative
    `}>
      {/* Blog content (visible when expanded or on blog post page) */}
      {/* Blog header and summary */}
      <div className="px-6 pt-6">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold mb-2">{post.title}</h2>
          <div className="flex items-center text-gray-500 text-sm mb-3">
            <span>{formattedDate}</span>
            <span className="mx-2">•</span>
            <span>{post.readingTime} {t('blog.minuteRead', 'min read')}</span>
          </div>
          <p className="text-steel-blue italic">
            {post.summary}
          </p>
        </div>
      </div>
      
      {/* Blog content (visible when expanded or on blog post page) */}
      {isExpanded ? (
        <>
          <div className="px-6 pb-6 blog-content border-t border-gray-100 mt-2">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
          <div className="px-4 pb-4 relative z-20 flex justify-start">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setInternalExpanded(false);
              }}
              className="text-sm text-gray-500 italic hover:text-gray-700 transition"
            >
              {t('blog.collapse')}
            </button>
          </div>
        </>
      ) : (
        <div className="px-4 pb-4 relative z-20 flex justify-start">
          <span
            onClick={toggleExpanded}
            className="italic text-gray-400 hover:text-gray-600 transition-colors text-sm cursor-pointer"
          >
            {t('blog.expand', 'Expand')}
          </span>
        </div>
      )
    </article>
  );
}