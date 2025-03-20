import { GetStaticProps } from 'next';
import Layout from '@/components/layout/Layout';
import { getRecentPosts } from '@/lib/blog';
import { BlogPost } from '@/types/blog';
import Link from 'next/link';
import { useTranslation } from '@/lib/translations';
import { format } from 'date-fns';

// Props type definition
type HomePageProps = {
  recentPosts: BlogPost[];
};

export default function HomePage({ recentPosts }: HomePageProps) {
  const { t } = useTranslation();

  return (
    <Layout section="welcome">
      <section className="mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-accent mb-6">
          {t('welcome.title', 'Welcome')}
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <p className="text-xl text-steel-blue leading-relaxed mb-4">
            {t('welcome.intro', 'Hello! I\'m a Senior Engineering Manager with a passion for building high-performing teams.')}
          </p>
          
          <p className="text-steel-blue leading-relaxed">
            With over 20 years in the technology industry, my approach combines technical excellence with people-centered leadership. 
            I am committed to creating environments that empower people to thrive in their work.
          </p>
        </div>
      </section>
      
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-accent mb-6">
          {t('welcome.explore', 'Explore This Site')}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold text-steel-blue mb-3">
              {t('nav.blog', 'Blog')}
            </h3>
            <p className="text-gray-700 mb-4">
              Thoughts on engineering leadership, technology, and team building. 
            </p>
            <Link 
              href="/blog"
              className="text-steel-blue hover:text-accent font-medium inline-flex items-center transition-colors"
            >
              {t('blog.readMore', 'Read More')}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold text-steel-blue mb-3">
              {t('nav.cv', 'CV')}
            </h3>
            <p className="text-gray-700 mb-4"> 
              See the path that led me to where I am today.
            </p>
            <Link 
              href="/cv"
              className="text-steel-blue hover:text-accent font-medium inline-flex items-center transition-colors"
            >
              {t('welcome.view_cv', 'View CV')}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold text-steel-blue mb-3">
              {t('nav.books', 'Books')}
            </h3>
            <p className="text-gray-700 mb-4"> 
              I'm an avid reader and believe that continuous learning is essential for growth.
            </p>
            <Link 
              href="/books"
              className="text-steel-blue hover:text-accent font-medium inline-flex items-center transition-colors"
            >
              {t('welcome.browse_books', 'Browse Books')}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold text-steel-blue mb-3">
              {t('nav.contact', 'Contact')}
            </h3>
            <p className="text-gray-700 mb-4">
              Get in touch for collaborations, speaking opportunities, or just to connect. 
            </p>
            <Link 
              href="/contact"
              className="text-steel-blue hover:text-accent font-medium inline-flex items-center transition-colors"
            >
              {t('welcome.contact_me', 'Contact Me')}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
      
      {recentPosts.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-accent mb-6">
            {t('welcome.recent_posts', 'Recent Blog Posts')}
          </h2>
          
          <div className="space-y-4">
            {recentPosts.map(post => (
              <div key={post.slug} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold text-steel-blue mb-2">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="hover:text-accent transition-colors"
                  >
                    {post.title}
                  </Link>
                </h3>
                
                <div className="text-sm text-gray-600 mb-3">
                  {post.date ? format(new Date(post.date), 'MMMM d, yyyy') : ''} {post.readingTime ? `• ${post.readingTime} min read` : ''}
                </div>
                
                <p className="text-gray-700">{post.summary}</p>
                
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-3 inline-block text-steel-blue hover:text-accent font-medium transition-colors"
                >
                  {t('blog.readMore', 'Read More')} →
                </Link>
              </div>
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <Link
              href="/blog"
              className="inline-block bg-steel-blue hover:bg-accent text-white font-medium py-2 px-6 rounded transition-colors"
            >
              {t('welcome.view_all_posts', 'View All Posts')}
            </Link>
          </div>
        </section>
      )}
    </Layout>
  );
}

// Fetch data at build time
export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  try {
    // Get recent blog posts
    const recentPosts = await getRecentPosts(3);
    
    return {
      props: {
        recentPosts,
      },
    };
  } catch (error) {
    console.error('Error fetching recent posts:', error);
    return {
      props: {
        recentPosts: [],
      },
    };
  }
};