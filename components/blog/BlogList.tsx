import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { BlogPost } from "@/types/blog";
import BlogCard from "./BlogCard";

type BlogListProps = {
  posts: BlogPost[];
  expandedPostSlug?: string;
};

export default function BlogList({ posts, expandedPostSlug }: BlogListProps) {
  // Track which post is currently expanded (if any)
  const [expandedSlug, setExpandedSlug] = useState<string | null>(
    expandedPostSlug || null,
  );
  const router = useRouter();

  const handlePostToggle = (post: BlogPost) => {
    const newExpandedSlug = expandedSlug === post.slug ? null : post.slug;
    setExpandedSlug(newExpandedSlug);

    // Update URL to reflect the expanded post
    if (newExpandedSlug) {
      // Expand this post - add query parameter
      router.push(`/blog?post=${newExpandedSlug}`, undefined, {
        shallow: true,
      });
    } else {
      // Collapse post - remove query parameter
      router.push("/blog", undefined, { shallow: true });
    }
  };

  // Update expanded state when the expandedPostSlug prop changes
  useEffect(() => {
    setExpandedSlug(expandedPostSlug || null);

    // If a post is expanded via URL, scroll to it after a brief delay
    if (expandedPostSlug) {
      setTimeout(() => {
        const element = document.getElementById(`post-${expandedPostSlug}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, [expandedPostSlug]);

  return (
    <div className="space-y-6">
      {posts.length > 0 ? (
        posts.map((post) => (
          <div key={post.slug} id={`post-${post.slug}`} className="mb-6">
            <BlogCard
              post={post}
              expanded={expandedSlug === post.slug}
              onToggle={() => handlePostToggle(post)}
            />
          </div>
        ))
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600">No blog posts found.</p>
        </div>
      )}
    </div>
  );
}
