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
  
  // Log received props in the browser console
  console.log('BlogPage Props:', { posts });

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
    console.log('blog/index.tsx getStaticProps: Calling getBlogPostsServerSide...');
    const posts = await getBlogPostsServerSide(); 
    console.log(`blog/index.tsx getStaticProps: Received ${posts.length} posts.`);
    
    if (posts.length === 0) {
      console.log('blog/index.tsx getStaticProps: WARNING - No posts received from getBlogPostsServerSide');
    } else {
      // Log the first post for debugging
      console.log('blog/index.tsx getStaticProps: First post:', JSON.stringify(posts[0], null, 2));
    }
    
    // Filter for published posts only before passing to the page
    const publishedPosts = posts.filter(post => post.published);
    console.log(`blog/index.tsx getStaticProps: Filtered to ${publishedPosts.length} published posts.`);

    return {
      props: {
        posts: publishedPosts, // Pass only published posts
      },
      revalidate: 10, // Reduced revalidation time for testing (e.g., every 10 seconds)
    };
  } catch (error) {
    console.error('blog/index.tsx getStaticProps: Error fetching posts:', error);
    return {
      props: {
        posts: [], // Return empty on error
      },
      revalidate: 5, // Revalidate very soon after an error
    };
  }
};