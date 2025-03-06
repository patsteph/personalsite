import { BlogPost } from '@/types/blog';
import Link from 'next/link';
import { format } from 'date-fns';
import { useTranslation } from '@/lib/translations';

type BlogCardProps = {
  post: BlogPost;
  expanded?: boolean;
  onToggle?: () => void;
};

export default function BlogCard({ post, expanded = false, onToggle }: BlogCardProps) {
  const { t } = useTranslation();
  
  // Format the date
  const formattedDate = format(new Date(post.date), 'MMMM d, yyyy');
  
  return (
    <article className={`
      bg-white rounded-lg overflow-hidden shadow transition-all duration-300
      ${expanded ? 'shadow-md' : 'hover:shadow-md'}
    `}>
      {/* Blog header (always visible) */}
      <div 
        className={`p-6 cursor-pointer ${onToggle ? 'cursor-pointer' : ''}`}
        onClick={onToggle}
      >
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-accent mb-2">
              {post.title}
            </h2>
            <div className="flex items-center text-sm text-gray-600 mb-3">
              <span>{t('blog.publishedOn', 'Published on')} {formattedDate}</span>
              <span className="mx-2">•</span>
              <span>{post.readingTime} {t('blog.minuteRead', 'min read')}</span>
            </div>
            <p className="text-steel-blue italic">
              {post.summary}
            </p>
          </div>
          
          {onToggle && (
            <div className={`
              text-steel-blue transition-transform duration-300
              ${expanded ? 'rotate-180' : ''}
            `}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          )}
        </div>
      </div>
      
      {/* Blog content (visible when expanded or on blog post page) */}
      {expanded ? (
        <div className="px-6 pb-6 blog-content">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>
      ) : (
        <div className="px-6 pb-6">
          <Link 
            href={`/blog/${post.slug}`}
            className="inline-block text-steel-blue hover:text-accent font-medium transition-colors"
          >
            {t('blog.readMore', 'Read More')} →
          </Link>
        </div>
      )}
    </article>
  );
}