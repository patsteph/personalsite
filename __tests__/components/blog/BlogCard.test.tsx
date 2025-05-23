import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import BlogCard from "@/components/blog/BlogCard";

// Mock Next.js components
jest.mock("next/link", () => {
  return function Link({ href, children, className }: any) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  };
});

jest.mock("next/image", () => {
  return function Image({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock date formatting
jest.mock("@/lib/utils/date", () => ({
  formatDate: jest.fn((date) => new Date(date).toLocaleDateString()),
  formatRelativeTime: jest.fn((date) => "2 days ago"),
}));

describe("BlogCard", () => {
  const mockPost = {
    id: "test-post-1",
    title: "Test Blog Post",
    slug: "test-blog-post",
    excerpt:
      "This is a test excerpt for the blog post that should be displayed.",
    content: "Full content of the blog post...",
    author: "Test Author",
    publishedAt: "2023-12-01T10:00:00Z",
    createdAt: "2023-12-01T09:00:00Z",
    updatedAt: "2023-12-01T10:00:00Z",
    published: true,
    featured: false,
    tags: ["testing", "react", "typescript"],
    readingTime: 5,
    metaDescription: "Test meta description",
    imageUrl: "/images/test-blog-image.jpg",
  };

  it("renders blog post card with all content", () => {
    render(<BlogCard post={mockPost} />);

    expect(screen.getByText("Test Blog Post")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This is a test excerpt for the blog post that should be displayed.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Test Author")).toBeInTheDocument();
    expect(screen.getByText("5 min read")).toBeInTheDocument();
  });

  it("renders featured badge for featured posts", () => {
    const featuredPost = { ...mockPost, featured: true };
    render(<BlogCard post={featuredPost} />);

    expect(screen.getByText("Featured")).toBeInTheDocument();
  });

  it("does not render featured badge for non-featured posts", () => {
    render(<BlogCard post={mockPost} />);

    expect(screen.queryByText("Featured")).not.toBeInTheDocument();
  });

  it("renders blog post image when provided", () => {
    render(<BlogCard post={mockPost} />);

    const image = screen.getByAltText("Test Blog Post");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "/images/test-blog-image.jpg");
  });

  it("handles missing image gracefully", () => {
    const postWithoutImage = { ...mockPost, imageUrl: undefined };
    render(<BlogCard post={postWithoutImage} />);

    // Should render default placeholder or no image
    expect(screen.queryByAltText("Test Blog Post")).not.toBeInTheDocument();
  });

  it("renders tags correctly", () => {
    render(<BlogCard post={mockPost} />);

    expect(screen.getByText("testing")).toBeInTheDocument();
    expect(screen.getByText("react")).toBeInTheDocument();
    expect(screen.getByText("typescript")).toBeInTheDocument();
  });

  it("handles posts without tags", () => {
    const postWithoutTags = { ...mockPost, tags: undefined };
    render(<BlogCard post={postWithoutTags} />);

    // Should not crash and should still render other content
    expect(screen.getByText("Test Blog Post")).toBeInTheDocument();
  });

  it("handles empty tags array", () => {
    const postWithEmptyTags = { ...mockPost, tags: [] };
    render(<BlogCard post={postWithEmptyTags} />);

    // Should not crash and should still render other content
    expect(screen.getByText("Test Blog Post")).toBeInTheDocument();
  });

  it("creates correct link to blog post", () => {
    render(<BlogCard post={mockPost} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/blog/test-blog-post");
  });

  it("handles missing excerpt gracefully", () => {
    const postWithoutExcerpt = { ...mockPost, excerpt: undefined };
    render(<BlogCard post={postWithoutExcerpt} />);

    // Should still render title and other content
    expect(screen.getByText("Test Blog Post")).toBeInTheDocument();
  });

  it("handles missing reading time", () => {
    const postWithoutReadingTime = { ...mockPost, readingTime: undefined };
    render(<BlogCard post={postWithoutReadingTime} />);

    // Should not show reading time
    expect(screen.queryByText(/min read/)).not.toBeInTheDocument();
  });

  it("formats published date correctly", () => {
    render(<BlogCard post={mockPost} />);

    // Should use the mocked date formatting
    expect(screen.getByText("2 days ago")).toBeInTheDocument();
  });

  it("handles missing author gracefully", () => {
    const postWithoutAuthor = { ...mockPost, author: undefined };
    render(<BlogCard post={postWithoutAuthor} />);

    // Should still render other content
    expect(screen.getByText("Test Blog Post")).toBeInTheDocument();
  });

  it("truncates long excerpts appropriately", () => {
    const longExcerpt =
      "This is a very long excerpt that should be truncated after a certain number of characters to ensure the card layout remains consistent and readable across different post types and content lengths.";
    const postWithLongExcerpt = { ...mockPost, excerpt: longExcerpt };

    render(<BlogCard post={postWithLongExcerpt} />);

    const excerptElement = screen.getByText(longExcerpt);
    expect(excerptElement).toHaveClass("line-clamp-3"); // Assuming Tailwind line-clamp
  });

  it("applies correct CSS classes for layout", () => {
    const { container } = render(<BlogCard post={mockPost} />);

    const cardElement = container.querySelector(
      ".blog-card, .card, .post-card",
    );
    expect(cardElement).toBeInTheDocument();
  });

  it("handles hover effects on card", () => {
    const { container } = render(<BlogCard post={mockPost} />);

    const cardElement = container.querySelector("a") || container.firstChild;
    expect(cardElement).toHaveClass("transition", "hover:shadow-lg");
  });

  it("renders reading time with correct formatting", () => {
    const postWithLongReadingTime = { ...mockPost, readingTime: 15 };
    render(<BlogCard post={postWithLongReadingTime} />);

    expect(screen.getByText("15 min read")).toBeInTheDocument();
  });

  it("handles single minute reading time", () => {
    const postWithShortReadingTime = { ...mockPost, readingTime: 1 };
    render(<BlogCard post={postWithShortReadingTime} />);

    expect(screen.getByText("1 min read")).toBeInTheDocument();
  });

  it("handles tag click events if interactive", () => {
    render(<BlogCard post={mockPost} />);

    const tagElement = screen.getByText("testing");

    // If tags are clickable, test the interaction
    if (tagElement.closest("button") || tagElement.closest("a")) {
      fireEvent.click(tagElement);
      // Add assertions based on expected behavior
    }
  });

  it("has proper accessibility attributes", () => {
    render(<BlogCard post={mockPost} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/blog/test-blog-post");

    // Check for proper heading structure
    const heading = screen.getByRole("heading");
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent("Test Blog Post");
  });

  it("handles very long titles gracefully", () => {
    const longTitle =
      "This is a Very Long Blog Post Title That Should Be Handled Gracefully Without Breaking the Layout";
    const postWithLongTitle = { ...mockPost, title: longTitle };

    render(<BlogCard post={postWithLongTitle} />);

    const titleElement = screen.getByText(longTitle);
    expect(titleElement).toBeInTheDocument();
    // Should have appropriate CSS classes for text truncation if needed
  });

  it("handles special characters in title and content", () => {
    const specialPost = {
      ...mockPost,
      title: 'Post with "Quotes" & Special Characters: React <> TypeScript',
      excerpt: "Content with special chars: é, ñ, ü, and symbols: @#$%",
    };

    render(<BlogCard post={specialPost} />);

    expect(
      screen.getByText(
        'Post with "Quotes" & Special Characters: React <> TypeScript',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Content with special chars: é, ñ, ü, and symbols: @#$%",
      ),
    ).toBeInTheDocument();
  });

  it("maintains consistent card dimensions", () => {
    const { container } = render(<BlogCard post={mockPost} />);

    const cardElement = container.firstChild;
    expect(cardElement).toHaveClass("h-full"); // Should maintain consistent height
  });

  it("handles different image aspect ratios", () => {
    render(<BlogCard post={mockPost} />);

    const imageContainer = screen.getByAltText("Test Blog Post").closest("div");
    expect(imageContainer).toHaveClass("aspect-video", "w-full"); // Consistent aspect ratio
  });
});
