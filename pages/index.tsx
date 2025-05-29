import { GetServerSideProps } from "next";
import Layout from "@/components/layout/Layout";
import { BlogPost } from "@/types/blog";
import Link from "next/link";
import { useTranslation } from "@/lib/translations";
import { format } from "date-fns";

// Imports for direct Firestore access
import { getAdminFirestore } from "@/lib/firebase-admin";
import { Timestamp, QueryDocumentSnapshot } from "firebase-admin/firestore";

// Props type definition
type HomePageProps = {
  recentPosts: BlogPost[];
};

export default function HomePage({ recentPosts }: HomePageProps) {
  const { t } = useTranslation();

  return (
    <Layout section="welcome">
      <section className="mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-accent mb-6">
          {t("welcome.title", "Welcome")}
        </h1>

        <div className="bg-white rounded-lg shadow p-3 mb-8">
          <p className="text-xl text-steel-blue leading-relaxed mb-2">
            {t(
              "welcome.intro",
              "Hello! I'm a lifelong learner and technologist with a passion for building high-performance teams.",
            )}
          </p>

          <p className="text-steel-blue leading-relaxed">
            With over 20 years in the technology industry, my approach combines
            technical excellence with people-centered leadership. I am committed
            to creating environments that empower people to thrive in their
            work.
          </p>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-accent mb-6">
          {t("welcome.explore", "Explore This Site")}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-3 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-steel-blue mb-1">
              {t("nav.books", "Books")}
            </h3>
            <p className="text-gray-700 mb-2 text-sm">📚🔑🧠</p>
            <Link
              href="/books"
              className="text-steel-blue hover:text-accent font-medium inline-flex items-center transition-colors text-sm"
            >
              {t("welcome.browse_books", "Browse Books")}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 ml-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-3 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-steel-blue mb-1">
              {t("nav.blog", "Blog")}
            </h3>
            <p className="text-gray-700 mb-2 text-sm">
              My thoughts on things 🤔💭
            </p>
            <Link
              href="/blog"
              className="text-steel-blue hover:text-accent font-medium inline-flex items-center transition-colors text-sm"
            >
              {t("blog.readMore", "Read More")}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 ml-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-3 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-steel-blue mb-1">
              {t("nav.signals", "Signals")}
            </h3>
            <p className="text-gray-700 mb-2 text-sm">
              Articles and newsletters. 📚📰
            </p>
            <Link
              href="/signals"
              className="text-steel-blue hover:text-accent font-medium inline-flex items-center transition-colors text-sm"
            >
              {t("welcome.view_signals", "View Signals")}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 ml-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-3 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-steel-blue mb-1">
              {t("nav.cv", "CV")}
            </h3>
            <p className="text-gray-700 mb-2 text-sm">My career journey. 🚀</p>
            <Link
              href="/cv"
              className="text-steel-blue hover:text-accent font-medium inline-flex items-center transition-colors text-sm"
            >
              {t("welcome.view_cv", "View CV")}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 ml-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-3 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-steel-blue mb-1">
              {t("nav.contact", "Contact")}
            </h3>
            <p className="text-gray-700 mb-2 text-sm">💬 with me.</p>
            <Link
              href="/contact"
              className="text-steel-blue hover:text-accent font-medium inline-flex items-center transition-colors text-sm"
            >
              {t("welcome.contact_me", "Contact Me")}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 ml-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {recentPosts.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-accent mb-6">
            {t("welcome.recent_posts", "Recent Blog Posts")}
          </h2>

          <div className="space-y-4">
            {recentPosts.map((post) => (
              <div
                key={post.slug}
                className="bg-white rounded-lg shadow p-3 hover:shadow-md transition-shadow"
              >
                <h3 className="text-xl font-semibold text-steel-blue mb-2">
                  <Link
                    href="/blog"
                    className="hover:text-accent transition-colors"
                  >
                    {post.title}
                  </Link>
                </h3>

                <div className="text-sm text-gray-600 mb-3">
                  {post.date ? format(new Date(post.date), "MMMM d, yyyy") : ""}{" "}
                  {post.readingTime ? `• ${post.readingTime} min read` : ""}
                </div>

                <p className="text-gray-700">{post.summary}</p>

                <Link
                  href="/blog"
                  className="mt-3 inline-block text-steel-blue hover:text-accent font-medium transition-colors"
                >
                  {t("blog.readMore", "Read More")} →
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/blog"
              className="inline-block bg-steel-blue hover:bg-accent text-white font-medium py-2 px-6 rounded transition-colors"
            >
              {t("welcome.view_all_posts", "View All Posts")}
            </Link>
          </div>
        </section>
      )}
    </Layout>
  );
}

// Use server-side rendering with direct Firebase Admin access (same as blog page server logic)
export const getServerSideProps: GetServerSideProps<
  HomePageProps
> = async () => {
  try {
    // Use direct Firebase Admin access like the blog post page should be doing
    const db = getAdminFirestore();

    // Create the query using Admin SDK pattern
    const postsCollectionRef = db.collection("blog-posts");
    const q = postsCollectionRef
      .where("published", "==", true)
      .orderBy("publishedAt", "desc")
      .limit(3);

    const querySnapshot = await q.get();

    const recentPosts: BlogPost[] = [];
    querySnapshot.forEach((doc: QueryDocumentSnapshot) => {
      const data = doc.data();

      // Calculate reading time if not provided (rough estimate: 200 words per minute)
      let readingTime = data.readingTime;
      if (!readingTime && data.content) {
        const wordCount = data.content.trim().split(/\s+/).length;
        readingTime = Math.max(1, Math.ceil(wordCount / 200));
      }

      const post: BlogPost = {
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
        readingTime: readingTime || 1, // Default to 1 minute if calculation fails
      };
      recentPosts.push(post);
    });

    console.log(
      `Fetched ${recentPosts.length} recent posts using server-side Firebase Admin.`,
    );

    return {
      props: {
        recentPosts,
      },
    };
  } catch (error) {
    console.error("Error in getServerSideProps fetching recent posts:", error);
    return {
      props: {
        recentPosts: [],
      },
    };
  }
};
