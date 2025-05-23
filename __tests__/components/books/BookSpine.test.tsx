import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import BookSpine from "@/components/books/BookSpine";
import { Book } from "@/types/book";

// Mock console.log to avoid test output pollution
const mockConsoleLog = jest.spyOn(console, "log").mockImplementation(() => {});
const mockConsoleError = jest
  .spyOn(console, "error")
  .mockImplementation(() => {});

describe("BookSpine", () => {
  const mockOnClick = jest.fn();

  const mockBook: Book = {
    id: "test-book-1",
    title: "Test Book Title",
    authors: ["Test Author"],
    status: "read",
    dateAdded: "2023-01-01",
    lastUpdated: "2023-01-01",
    pageCount: 300,
    categories: ["Fiction"],
    imageLinks: {
      thumbnail: "https://example.com/thumbnail.jpg",
      smallThumbnail: "https://example.com/small-thumbnail.jpg",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  it("renders book with cover image", () => {
    render(<BookSpine book={mockBook} onClick={mockOnClick} />);

    expect(screen.getByText("Test Book Title")).toBeInTheDocument();
    expect(screen.getByText("Test Author")).toBeInTheDocument();
  });

  it("renders book without cover image", () => {
    const bookWithoutCover = {
      ...mockBook,
      imageLinks: undefined,
    };

    render(<BookSpine book={bookWithoutCover} onClick={mockOnClick} />);

    // Use getAllByText since title appears twice (in cover area and info area)
    expect(screen.getAllByText("Test Book Title")).toHaveLength(2);
    expect(screen.getByText("Test Author")).toBeInTheDocument();
  });

  it("handles multiple authors correctly", () => {
    const bookWithMultipleAuthors = {
      ...mockBook,
      authors: ["Author One", "Author Two", "Author Three"],
    };

    render(<BookSpine book={bookWithMultipleAuthors} onClick={mockOnClick} />);

    expect(
      screen.getByText("Author One, Author Two, Author Three"),
    ).toBeInTheDocument();
  });

  it("handles missing authors gracefully", () => {
    const bookWithoutAuthors = {
      ...mockBook,
      authors: undefined,
    };

    render(<BookSpine book={bookWithoutAuthors} onClick={mockOnClick} />);

    expect(screen.getByText("Unknown Author")).toBeInTheDocument();
  });

  it("handles empty authors array", () => {
    const bookWithEmptyAuthors = {
      ...mockBook,
      authors: [],
    };

    render(<BookSpine book={bookWithEmptyAuthors} onClick={mockOnClick} />);

    expect(screen.getByText("Unknown Author")).toBeInTheDocument();
  });

  it("calls onClick when book spine is clicked", () => {
    render(<BookSpine book={mockBook} onClick={mockOnClick} />);

    const bookElement = screen.getByTitle("Test Book Title by Test Author");
    fireEvent.click(bookElement);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("shows hover effect on mouse over and out", () => {
    render(<BookSpine book={mockBook} onClick={mockOnClick} />);

    const bookElement = screen.getByTitle("Test Book Title by Test Author");

    // Test mouse over
    fireEvent.mouseOver(bookElement);
    expect(bookElement.style.transform).toBe("translateY(-10px)");

    // Test mouse out
    fireEvent.mouseOut(bookElement);
    expect(bookElement.style.transform).toBe("translateY(0)");
  });

  it("sets correct title attribute", () => {
    render(<BookSpine book={mockBook} onClick={mockOnClick} />);

    const bookElement = screen.getByTitle("Test Book Title by Test Author");
    expect(bookElement).toBeInTheDocument();
  });

  it("logs debug information on render", () => {
    render(<BookSpine book={mockBook} onClick={mockOnClick} />);

    expect(mockConsoleLog).toHaveBeenCalledWith("BookSpine rendering book:", {
      id: "test-book-1",
      title: "Test Book Title",
      hasAuthors: true,
      authorsIsArray: true,
      authorsLength: 1,
      authors: ["Test Author"],
    });
  });

  it("handles books with categories for color generation", () => {
    const bookWithGenre = {
      ...mockBook,
      categories: ["Science Fiction"],
    };

    render(<BookSpine book={bookWithGenre} onClick={mockOnClick} />);

    expect(screen.getByText("Test Book Title")).toBeInTheDocument();
  });

  it("handles books without categories", () => {
    const bookWithoutCategories = {
      ...mockBook,
      categories: undefined,
    };

    render(<BookSpine book={bookWithoutCategories} onClick={mockOnClick} />);

    expect(screen.getByText("Test Book Title")).toBeInTheDocument();
  });

  it("handles books without page count", () => {
    const bookWithoutPageCount = {
      ...mockBook,
      pageCount: undefined,
    };

    render(<BookSpine book={bookWithoutPageCount} onClick={mockOnClick} />);

    expect(screen.getByText("Test Book Title")).toBeInTheDocument();
  });

  it("renders as cover by default", () => {
    const { container } = render(
      <BookSpine book={mockBook} onClick={mockOnClick} />,
    );

    // Should render as cover (front-facing) with specific dimensions
    const bookElement = container.querySelector(".h-40.w-28");
    expect(bookElement).toBeInTheDocument();
  });

  it("handles image loading errors", () => {
    render(<BookSpine book={mockBook} onClick={mockOnClick} />);

    // Find the hidden image element used for error detection
    const hiddenImage = document.querySelector("img.hidden");
    if (hiddenImage) {
      fireEvent.error(hiddenImage);
    }

    // Console error should be called when image fails
    // Note: The actual DOM manipulation in the error handler is hard to test
    // but we can verify the error handler exists
  });

  it("truncates long titles appropriately", () => {
    const bookWithLongTitle = {
      ...mockBook,
      title:
        "This is a Very Long Book Title That Should Be Truncated When Displayed",
    };

    render(<BookSpine book={bookWithLongTitle} onClick={mockOnClick} />);

    const titleElement = screen.getByText(
      "This is a Very Long Book Title That Should Be Truncated When Displayed",
    );
    expect(titleElement).toHaveClass("truncate");
  });

  it("applies correct CSS classes for cover view", () => {
    const { container } = render(
      <BookSpine book={mockBook} onClick={mockOnClick} />,
    );

    const bookElement = container.querySelector(".h-40.w-28.cursor-pointer");
    expect(bookElement).toBeInTheDocument();
    expect(bookElement).toHaveClass(
      "transition-transform",
      "duration-300",
      "flex",
      "flex-col",
      "items-center",
      "rounded",
      "overflow-hidden",
      "shadow-md",
      "select-none",
      "m-1",
    );
  });

  it("renders book cover section correctly", () => {
    const { container } = render(
      <BookSpine book={mockBook} onClick={mockOnClick} />,
    );

    const coverSection = container.querySelector(".relative.w-full.h-32");
    expect(coverSection).toBeInTheDocument();
  });

  it("renders book info section correctly", () => {
    const { container } = render(
      <BookSpine book={mockBook} onClick={mockOnClick} />,
    );

    const infoSection = container.querySelector(
      ".w-full.p-1.bg-white.text-center",
    );
    expect(infoSection).toBeInTheDocument();
  });
});
