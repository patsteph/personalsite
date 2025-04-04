import { GetStaticProps } from 'next';
import Layout from '@/components/layout/Layout';
import BlogList from '@/components/blog/BlogList';
import { getBlogPostsServerSide } from '@/lib/firebase-admin';
import { BlogPost } from '@/types/blog';
import { useTranslation } from '@/lib/translations';

// Props type definition
type BlogPageProps = {
  posts: BlogPost[];
};

export default function BlogPage({ posts }: BlogPageProps) {
  const { t } = useTranslation();

  return (
    <Layout section="blog">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-accent mb-8">
          {t('blog.title', 'Blog')}
        </h1>
        
        <p className="text-xl text-steel-blue mb-8">
          Thoughts on engineering leadership, technology, and team building. 
        </p>
        
        <BlogList posts={posts} />
      </div>
    </Layout>
  );
}

// Fetch data at build time
export const getStaticProps: GetStaticProps<BlogPageProps> = async () => {
  try {
    const posts = await getBlogPostsServerSide(); 
    
    // Filter for published posts only before passing to the page
    const publishedPosts = posts.filter(post => post.published);

    return {
      props: {
        posts: publishedPosts, // Pass only published posts
      },
      revalidate: 60, // Revalidate every minute
    };
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return {
      props: {
        posts: [], // Return empty on error
      },
      revalidate: 30, // Revalidate after 30 seconds on error
    };
  }
};