import { GetStaticProps } from 'next';
import Layout from '@/components/layout/Layout';
import BlogList from '@/components/blog/BlogList';
import { BlogPost } from '@/types/blog';
import { useTranslation } from '@/lib/translations';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { Timestamp, QueryDocumentSnapshot } from 'firebase-admin/firestore';

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
  console.log('Blog index getStaticProps: Fetching published posts...');
  try {
    const firestore = getAdminFirestore(); // Get Firestore instance
    const postsRef = firestore.collection('blog-posts');
    const snapshot = await postsRef
      .where('published', '==', true)
      .orderBy('publishedAt', 'desc')
      .get();

    if (snapshot.empty) {
      console.log('Blog index getStaticProps: No published posts found.');
      return {
        props: { posts: [] },
        revalidate: 60, // Revalidate every 60 seconds
      };
    }

    const posts: BlogPost[] = snapshot.docs.map((doc: QueryDocumentSnapshot) => {
      const data = doc.data();
      const post: BlogPost = {
        id: doc.id,
        title: data.title || '',
        slug: data.slug || '',
        content: data.content || '', // Keep content minimal for list view if needed
        published: data.published || false,
        // Convert Timestamp to ISO string
        publishedAt: data.publishedAt instanceof Timestamp ? data.publishedAt.toDate().toISOString() : (data.publishedAt || new Date().toISOString()),
        author: data.author || '',
        tags: data.tags || [],
        coverImage: data.coverImage || '',
        summary: data.summary || '',
        // reactionCount: data.reactionCount || 0, // Example if needed
      };
      return post;
    });

    console.log(`Blog index getStaticProps: Fetched ${posts.length} posts.`);
    return {
      props: {
        posts,
      },
      revalidate: 60, // Revalidate every 60 seconds
    };
  } catch (error) {
    console.error('Blog index getStaticProps: Error fetching posts:', error);
    // Return empty array or handle error appropriately
    return {
      props: { posts: [] },
      revalidate: 10, // Revalidate quickly after an error
    };
  }
};