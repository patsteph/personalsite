import { GetServerSideProps } from "next";
import Layout from "@/components/layout/Layout";
import BlogList from "@/components/blog/BlogList";
import { BlogPost } from "@/types/blog";
import { useTranslation } from "@/lib/translations";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { Timestamp, QueryDocumentSnapshot } from "firebase-admin/firestore";
import Head from "next/head";

// Props type definition
type BlogPageProps = {
  posts: BlogPost[];
  expandedPostSlug?: string;
  expandedPost?: BlogPost;
};

export default function BlogPage({
  posts,
  expandedPostSlug,
  expandedPost,
}: BlogPageProps) {
  const { t } = useTranslation();

  return (
    <Layout section="blog">
      <Head>
        <title>{expandedPost ? `${expandedPost.title} | Blog` : "Blog"}</title>
        <meta
          name="description"
          content={
            expandedPost
              ? expandedPost.summary
              : "Thoughts on engineering leadership, technology, and team building."
          }
        />
        {expandedPost && (
          <>
            <meta property="og:title" content={expandedPost.title} />
            <meta property="og:description" content={expandedPost.summary} />
            <meta property="og:type" content="article" />
            {expandedPost.coverImage && (
              <meta property="og:image" content={expandedPost.coverImage} />
            )}
          </>
        )}
      </Head>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-accent mb-8">
          {t("blog.title", "Blog")}
        </h1>

        <p className="text-xl text-steel-blue mb-8">
          Thoughts on engineering leadership, technology, and team building.
        </p>

        <BlogList posts={posts} expandedPostSlug={expandedPostSlug} />
      </div>
    </Layout>
  );
}

// Fetch data on each request to handle query parameters
export const getServerSideProps: GetServerSideProps<BlogPageProps> = async (
  context,
) => {
  console.log("Blog index getServerSideProps: Fetching published posts...");

  const { post: postSlug } = context.query;
  let expandedPostSlug: string | undefined;
  let expandedPost: BlogPost | undefined;

  try {
    const firestore = getAdminFirestore();
    const postsRef = firestore.collection("blog-posts");
    const snapshot = await postsRef
      .where("published", "==", true)
      .orderBy("publishedAt", "desc")
      .get();

    if (snapshot.empty) {
      console.log("Blog index getServerSideProps: No published posts found.");
      return {
        props: { posts: [] },
      };
    }

    const posts: BlogPost[] = snapshot.docs.map(
      (doc: QueryDocumentSnapshot) => {
        const data = doc.data();

        // Calculate reading time if not provided
        let readingTime = data.readingTime;
        if (!readingTime && data.content) {
          const wordCount = data.content.trim().split(/\s+/).length;
          readingTime = Math.max(1, Math.ceil(wordCount / 200));
        }

        const post: BlogPost = {
          id: doc.id,
          title: data.title || "",
          slug: data.slug || "",
          content: data.content || "",
          summary: data.summary || "",
          published: data.published || false,
          publishedAt:
            data.publishedAt instanceof Timestamp
              ? data.publishedAt.toDate().toISOString()
              : data.publishedAt || new Date().toISOString(),
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate().toISOString()
              : new Date().toISOString(),
          updatedAt:
            data.updatedAt instanceof Timestamp
              ? data.updatedAt.toDate().toISOString()
              : new Date().toISOString(),
          author: data.author || "",
          tags: data.tags || [],
          coverImage: data.coverImage || "",
          readingTime: readingTime || 1,
          date:
            data.date instanceof Timestamp
              ? data.date.toDate().toISOString()
              : data.date || null,
        };
        return post;
      },
    );

    // If a specific post is requested via query parameter, find it
    if (postSlug && typeof postSlug === "string") {
      expandedPostSlug = postSlug;
      expandedPost = posts.find((post) => post.slug === postSlug);

      console.log(
        `Blog index getServerSideProps: Looking for post with slug "${postSlug}"`,
      );
      console.log(
        `Blog index getServerSideProps: Found expanded post: ${expandedPost ? expandedPost.title : "Not found"}`,
      );
    }

    console.log(
      `Blog index getServerSideProps: Fetched ${posts.length} posts.`,
    );
    return {
      props: {
        posts,
        expandedPostSlug,
        expandedPost,
      },
    };
  } catch (error) {
    console.error(
      "Blog index getServerSideProps: Error fetching posts:",
      error,
    );
    return {
      props: { posts: [] },
    };
  }
};
