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
  console.log('blog/index.tsx getStaticProps: Fetching blog posts...');
  try {
    // Use the server-side function to get posts
    const posts = await getBlogPostsServerSide(); 
    console.log(`blog/index.tsx getStaticProps: Received ${posts.length} posts.`);
    
    // Filter for published posts only before passing to the page
    const publishedPosts = posts.filter(post => post.published);
    console.log(`blog/index.tsx getStaticProps: Filtered to ${publishedPosts.length} published posts.`);

    return {
      props: {
        posts: publishedPosts, // Pass only published posts
      },
      revalidate: 60, // Add revalidation (e.g., every 60 seconds)
    };
  } catch (error) {
    console.error('blog/index.tsx getStaticProps: Error fetching posts:', error);
    return {
      props: {
        posts: [], // Return empty on error
        // Consider adding an error prop to display on the page
      },
      revalidate: 10, // Revalidate sooner after an error
    };
  }
};