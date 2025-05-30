import { BlogPost } from "@/types/blog";
import { format } from "date-fns";
import { useTranslation } from "@/lib/translations";
import { useState } from "react";
import BlogReactions from "./BlogReactions";

type BlogCardProps = {
  post: BlogPost;
  expanded?: boolean;
  onToggle?: () => void;
};

export default function BlogCard({
  post,
  expanded: propExpanded = false,
  onToggle,
}: BlogCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(propExpanded);
  const { t } = useTranslation();

  // Use prop expanded if controlled by parent, otherwise use internal state
  const isExpanded = onToggle ? propExpanded : internalExpanded;

  // Function to toggle expanded state
  const toggleExpanded = (e: React.MouseEvent) => {
    // Prevent any parent event handlers from being called
    e.stopPropagation();

    if (onToggle) {
      // If onToggle is provided, use it (controlled component)
      onToggle();
    } else {
      // Otherwise, use internal state (uncontrolled component)
      setInternalExpanded(!internalExpanded);
    }
  };

  // Format the date - use date if available, otherwise published date or current date
  const dateToFormat = post.date
    ? new Date(post.date)
    : post.publishedAt || new Date();
  const formattedDate = format(dateToFormat, "MMMM d, yyyy");

  return (
    <article
      className={`
        bg-white rounded-lg overflow-hidden shadow-sm transition-all duration-300
        ${isExpanded ? "shadow-md" : "hover:shadow-md"}
        ${!isExpanded ? "hover:bg-gray-50" : ""}
        relative cursor-pointer
      `}
      onClick={toggleExpanded}
    >
      <div className="flex flex-col md:flex-row">
        {/* Thumbnail image (if available) */}
        {post.coverImage && (
          <div className="md:w-1/4 flex-shrink-0">
            <div className="h-48 w-full relative overflow-hidden bg-gray-100">
              <img
                src={post.coverImage}
                alt={post.title}
                className="h-full w-full object-cover"
                style={{ aspectRatio: "16/9" }}
              />
            </div>
          </div>
        )}

        {/* Blog header and summary */}
        <div className={`flex-1 px-6 pt-6 ${post.coverImage ? "md:pl-6" : ""}`}>
          <div className="flex flex-col">
            {/* Header with title and share button */}
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-bold text-steel-blue flex-1 pr-2">
                {post.title}
              </h2>
              {/* Share button */}
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent expanding/collapsing the post
                  const shareUrl = `${window.location.origin}/blog?post=${post.slug}`;
                  navigator.clipboard
                    .writeText(shareUrl)
                    .then(() => {
                      // Show a brief success indication
                      const button = e.currentTarget;
                      const originalTitle = button.title;
                      button.title = "Link copied!";
                      button.classList.add("text-green-600");
                      setTimeout(() => {
                        button.title = originalTitle;
                        button.classList.remove("text-green-600");
                      }, 2000);
                    })
                    .catch(() => {
                      // Fallback: show the URL in an alert
                      alert(`Share this post: ${shareUrl}`);
                    });
                }}
                title="Copy share link"
                className="flex-shrink-0 p-1 text-gray-400 hover:text-steel-blue transition-colors duration-200 rounded"
                aria-label="Copy share link"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                  <polyline points="16,6 12,2 8,6"></polyline>
                  <line x1="12" y1="2" x2="12" y2="15"></line>
                </svg>
              </button>
            </div>
            <div className="flex items-center text-gray-500 text-sm mb-3">
              <span>{formattedDate}</span>
              <span className="mx-2">•</span>
              <span>
                {post.readingTime} {t("blog.minuteRead", "min read")}
              </span>
            </div>
            {/* Apply consistent body text style */}
            <p className="text-gray-700">{post.summary}</p>
          </div>

          {/* Blog content (visible when expanded or on blog post page) */}
          {isExpanded ? (
            <>
              <div className="py-6 blog-content border-t border-gray-100 mt-2">
                <div dangerouslySetInnerHTML={{ __html: post.content }} />

                {/* Add BlogReactions component */}
                {post.id && (
                  <div className="mt-6">
                    <BlogReactions
                      postId={post.id}
                      slug={post.slug}
                      initialReactions={
                        post.reactions || {
                          thumbsUp: 0,
                          celebrate: 0,
                          brain: 0,
                          meh: 0,
                        }
                      }
                    />
                  </div>
                )}
              </div>
              <div className="pb-4 relative z-20 flex justify-start">
                <button
                  onClick={toggleExpanded}
                  className="text-sm text-gray-500 italic hover:text-gray-700 transition"
                >
                  {t("blog.collapse")}
                </button>
              </div>
            </>
          ) : (
            <div className="pb-4 pt-2 relative z-20 flex justify-start">
              <span
                onClick={(e) => {
                  e.stopPropagation(); // Prevent double triggering
                  toggleExpanded(e);
                }}
                className="italic text-gray-400 hover:text-gray-600 transition-colors text-sm cursor-pointer"
              >
                {t("blog.expand", "Expand")}
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
