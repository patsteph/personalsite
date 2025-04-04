import { GetStaticProps, GetStaticPaths } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import { getAllPostSlugs, getPostBySlug } from '@/lib/blog';
import { BlogPost } from '@/types/blog';
import { format } from 'date-fns';
import { useTranslation } from '@/lib/translations';
import { serialize } from 'next-mdx-remote/serialize';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';

// Props type definition
type BlogPostPageProps = {
  post: BlogPost & {
    mdxContent: MDXRemoteSerializeResult;
  };
};

export default function BlogPostPage({ post }: BlogPostPageProps) {
  const router = useRouter();
  const { t } = useTranslation();
  
  // Handle fallback page
  if (router.isFallback) {
    return (
      <Layout section="blog">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-light-accent rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-light-accent rounded w-1/4 mb-8"></div>
            <div className="h-4 bg-light-accent rounded w-full mb-2"></div>
            <div className="h-4 bg-light-accent rounded w-full mb-2"></div>
            <div className="h-4 bg-light-accent rounded w-3/4 mb-8"></div>
          </div>
        </div>
      </Layout>
    );
  }
  
  // Format the date (using a default date if none is provided)
  const formattedDate = format(new Date(post.date || new Date().toISOString()), 'MMMM d, yyyy');
  
  return (
    <Layout 
      section="blog"
      title={post.title}
      description={post.summary}
    >
      <article className="max-w-3xl mx-auto">
        <Link
          href="/blog"
          className="inline-flex items-center text-steel-blue hover:text-accent mb-6 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('blog.backToList', 'Back to Blog')}
        </Link>
        
        <h1 className="text-3xl md:text-4xl font-bold text-accent mb-3">
          {post.title}
        </h1>
        
        <div className="flex items-center text-gray-600 mb-8">
          <span>{t('blog.publishedOn', 'Published on')} {formattedDate}</span>
          <span className="mx-2">•</span>
          <span>{post.readingTime} {t('blog.minuteRead', 'min read')}</span>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 md:p-8">
          <div className="prose prose-lg max-w-none prose-headings:text-accent prose-a:text-steel-blue">
            <MDXRemote {...post.mdxContent} />
          </div>
        </div>
      </article>
    </Layout>
  );
}

// Generate the paths for all blog posts
export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = await getAllPostSlugs();
  
  console.log('[slug].tsx getStaticPaths: Generating paths for slugs:', slugs);
  
  return {
    paths: slugs.map(slug => ({
      params: { slug },
    })),
    // Enable fallback to server-side rendering for new blog posts
    fallback: 'blocking',
  };
};

// Fetch data for a specific blog post
export const getStaticProps: GetStaticProps<BlogPostPageProps> = async ({ params }) => {
  try {
    const slug = params?.slug as string;
    console.log(`[slug].tsx getStaticProps: Fetching data for slug "${slug}"`);
    
    const post = await getPostBySlug(slug);
    
    // If post not found, return 404
    if (!post) {
      console.warn(`[slug].tsx getStaticProps: No post found for slug "${slug}"`);
      return {
        notFound: true,
        revalidate: 30, // Try again after 30 seconds
      };
    }
    
    console.log(`[slug].tsx getStaticProps: Post found for slug "${slug}", serializing content`);
    
    // Serialize the MDX content
    let mdxContent;
    try {
      mdxContent = await serialize(post.content || '');
    } catch (mdxError) {
      console.error(`[slug].tsx getStaticProps: Error serializing MDX content for slug "${slug}":`, mdxError);
      // Provide a fallback MDX content
      mdxContent = await serialize('**Error rendering content**');
    }
    
    console.log(`[slug].tsx getStaticProps: Successfully prepared post data for slug "${slug}"`);
    
    return {
      props: {
        post: {
          ...post,
          mdxContent,
        },
      },
      revalidate: 60, // Revalidate after 60 seconds
    };
  } catch (error) {
    console.error('[slug].tsx getStaticProps: Unexpected error:', error);
    return {
      notFound: true,
      revalidate: 30, // Try again after 30 seconds
    };
  }
};