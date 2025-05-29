import React from "react";
import { GetServerSideProps } from "next";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import Layout from "@/components/layout/Layout";
import { getPostBySlug } from "../../lib/api/blog";
import { BlogPost, ReactionType } from "../../types/blog";
import Head from "next/head";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import remarkGfm from "remark-gfm";
import BlogReactions from "@/components/blog/BlogReactions";

// Define the props type for the blog post page
interface BlogPostPageProps {
  post: BlogPost | null;
  serializedContent: MDXRemoteSerializeResult | null;
  error?: string;
}

// The main BlogPostPage component
const BlogPostPage: React.FC<BlogPostPageProps> = ({
  post,
  serializedContent,
  error,
}) => {
  if (error) {
    return (
      <Layout section="blog">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl text-red-500 font-bold mb-4">Error</h1>
          <p>{error}</p>
        </div>
      </Layout>
    );
  }

  if (!post || !serializedContent) {
    return (
      <Layout section="blog">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-4">Loading</h1>
        </div>
      </Layout>
    );
  }

  // Handle reaction events
  const handleReaction = async (type: ReactionType) => {
    console.log(`User reacted with ${type} to post ${post.id}`);
    // Add any additional analytics or tracking here
  };

  return (
    <Layout section="blog">
      <Head>
        <title>{post.title} | Blog</title>
        <meta name="description" content={post.summary} />
      </Head>
      <div className="container mx-auto px-4 py-8">
        <article className="prose lg:prose-xl max-w-none">
          <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
          <div className="text-gray-600 mb-6">
            {post.date
              ? new Date(post.date).toLocaleDateString()
              : "No date available"}
          </div>
          <MDXRemote {...serializedContent} />

          {/* Add reactions component */}
          <BlogReactions
            postId={post.id || ""}
            slug={post.slug}
            initialReactions={
              post.reactions || {
                thumbsUp: 0,
                celebrate: 0,
                brain: 0,
                meh: 0,
              }
            }
            onReact={handleReaction}
          />
        </article>
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<BlogPostPageProps> = async (
  context,
) => {
  const { slug } = context.params || {};
  let post: BlogPost | null = null;
  let serializedContent: MDXRemoteSerializeResult | null = null;
  let errorMessage = "";

  if (!slug || typeof slug !== "string") {
    return {
      props: {
        post: null,
        serializedContent: null,
        error: "Invalid post identifier",
      },
    };
  }

  try {
    // Use direct Firebase Admin access instead of API layer
    const { getAdminFirestore } = await import("../../lib/firebase-admin");
    const { Timestamp } = await import("firebase-admin/firestore");

    const db = getAdminFirestore();
    const postsCollection = db.collection("blog-posts");

    // Query by slug
    const querySnapshot = await postsCollection
      .where("slug", "==", slug)
      .where("published", "==", true)
      .limit(1)
      .get();

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();

      // Calculate reading time if not provided
      let readingTime = data.readingTime;
      if (!readingTime && data.content) {
        const wordCount = data.content.trim().split(/\s+/).length;
        readingTime = Math.max(1, Math.ceil(wordCount / 200));
      }

      post = {
        id: doc.id,
        slug: data.slug || "",
        title: data.title || "",
        summary: data.summary || "",
        content: data.content || "",
        author: data.author || "",
        coverImage: data.coverImage || "",
        tags: data.tags || [],
        published: data.published || false,
        date:
          data.date instanceof Timestamp
            ? data.date.toDate().toISOString()
            : data.date || null,
        publishedAt:
          data.publishedAt instanceof Timestamp
            ? data.publishedAt.toDate().toISOString()
            : data.publishedAt || null,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : new Date().toISOString(),
        updatedAt:
          data.updatedAt instanceof Timestamp
            ? data.updatedAt.toDate().toISOString()
            : new Date().toISOString(),
        readingTime: readingTime || 1,
      };
    }

    if (post && post.content) {
      // Serialize the MDX content
      serializedContent = await serialize(post.content, {
        mdxOptions: {
          rehypePlugins: [
            rehypeHighlight,
            rehypeSlug,
            [rehypeAutolinkHeadings, { behavior: "wrap" }],
          ],
          remarkPlugins: [remarkGfm],
        },
      });

      return {
        props: {
          post,
          serializedContent,
        },
      };
    }
  } catch (error) {
    console.error(`Error fetching blog post with slug "${slug}":`, error);
    errorMessage = "Failed to process blog content";
  }

  // If we couldn't get the post, return error props
  return {
    props: {
      post: null,
      serializedContent: null,
      error: errorMessage || `Could not find blog post with slug: ${slug}`,
    },
  };
};

export default BlogPostPage;
