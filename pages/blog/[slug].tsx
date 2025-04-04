import { GetServerSideProps } from 'next';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import { getPostBySlug } from '@/lib/blog';
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
  const { t } = useTranslation();
  
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
          <span>{post.readingTime || 5} {t('blog.minuteRead', 'min read')}</span>
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

// Fetch data for a specific blog post at request time
export const getServerSideProps: GetServerSideProps<BlogPostPageProps> = async ({ params, req, res }) => {
  try {
    const slug = params?.slug as string;
    console.log(`[slug].tsx getServerSideProps: Fetching data for slug "${slug}"`);
    
    // Cache the response for 1 minute
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    
    const post = await getPostBySlug(slug);
    
    // If post not found, return 404
    if (!post) {
      console.warn(`[slug].tsx getServerSideProps: No post found for slug "${slug}"`);
      return {
        notFound: true,
      };
    }
    
    console.log(`[slug].tsx getServerSideProps: Post found for slug "${slug}", serializing content`);
    
    // Serialize the MDX content
    let mdxContent;
    try {
      mdxContent = await serialize(post.content || '');
    } catch (mdxError) {
      console.error(`[slug].tsx getServerSideProps: Error serializing MDX content for slug "${slug}":`, mdxError);
      // Provide a fallback MDX content
      mdxContent = await serialize('**Error rendering content**');
    }
    
    console.log(`[slug].tsx getServerSideProps: Successfully prepared post data for slug "${slug}"`);
    
    return {
      props: {
        post: {
          ...post,
          mdxContent,
        },
      },
    };
  } catch (error) {
    console.error('[slug].tsx getServerSideProps: Unexpected error:', error);
    return {
      notFound: true,
    };
  }
};