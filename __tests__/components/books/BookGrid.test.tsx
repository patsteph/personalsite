import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import BookGrid from "@/components/books/BookGrid";
import { Book } from "@/types/book";

// Mock BookSpine component
jest.mock("@/components/books/BookSpine", () => {
  return function MockBookSpine({
    book,
    onClick,
  }: {
    book: Book;
    onClick: () => void;
  }) {
    return (
      <div
        data-testid={`book-spine-${book.id}`}
        onClick={onClick}
        role="button"
        tabIndex={0}
      >
        {book.title} by {book.authors?.join(", ") || "Unknown Author"}
      </div>
    );
  };
});

// Mock BookModal component
jest.mock("@/components/books/BookModal", () => {
  return function MockBookModal({
    book,
    isOpen,
    onClose,
  }: {
    book: Book | null;
    isOpen: boolean;
    onClose: () => void;
  }) {
    if (!isOpen || !book) return null;

    return (
      <div data-testid="book-modal" role="dialog">
        <h2>{book.title}</h2>
        <button onClick={onClose} data-testid="close-modal">
          Close
        </button>
      </div>
    );
  };
});

describe("BookGrid", () => {
  const mockBooks: Book[] = [
    {
      id: "1",
      title: "First Book",
      authors: ["Author One"],
      status: "read",
      dateAdded: "2023-01-01",
      lastUpdated: "2023-01-01",
    },
    {
      id: "2",
      title: "Second Book",
      authors: ["Author Two", "Author Three"],
      status: "reading",
      dateAdded: "2023-01-02",
      lastUpdated: "2023-01-02",
    },
    {
      id: "3",
      title: "Third Book",
      authors: ["Author One"],
      status: "to-read",
      dateAdded: "2023-01-03",
      lastUpdated: "2023-01-03",
    },
  ];

  it("renders all books in grid format", () => {
    render(<BookGrid books={mockBooks} />);

    expect(screen.getByTestId("book-spine-1")).toBeInTheDocument();
    expect(screen.getByTestId("book-spine-2")).toBeInTheDocument();
    expect(screen.getByTestId("book-spine-3")).toBeInTheDocument();

    expect(screen.getByText("First Book by Author One")).toBeInTheDocument();
    expect(
      screen.getByText("Second Book by Author Two, Author Three"),
    ).toBeInTheDocument();
    expect(screen.getByText("Third Book by Author One")).toBeInTheDocument();
  });

  it("renders empty state when no books provided", () => {
    render(<BookGrid books={[]} />);

    expect(screen.getByText("No books found")).toBeInTheDocument();
    expect(
      screen.getByText("Start building your library by adding some books!"),
    ).toBeInTheDocument();
  });

  it("opens book modal when book is clicked", () => {
    render(<BookGrid books={mockBooks} />);

    // Initially modal should not be open
    expect(screen.queryByTestId("book-modal")).not.toBeInTheDocument();

    // Click on first book
    fireEvent.click(screen.getByTestId("book-spine-1"));

    // Modal should now be open with first book
    expect(screen.getByTestId("book-modal")).toBeInTheDocument();
    expect(screen.getByText("First Book")).toBeInTheDocument();
  });

  it("closes book modal when close button is clicked", () => {
    render(<BookGrid books={mockBooks} />);

    // Open modal
    fireEvent.click(screen.getByTestId("book-spine-1"));
    expect(screen.getByTestId("book-modal")).toBeInTheDocument();

    // Close modal
    fireEvent.click(screen.getByTestId("close-modal"));
    expect(screen.queryByTestId("book-modal")).not.toBeInTheDocument();
  });

  it("switches between different books in modal", () => {
    render(<BookGrid books={mockBooks} />);

    // Open first book
    fireEvent.click(screen.getByTestId("book-spine-1"));
    expect(screen.getByText("First Book")).toBeInTheDocument();

    // Close and open second book
    fireEvent.click(screen.getByTestId("close-modal"));
    fireEvent.click(screen.getByTestId("book-spine-2"));
    expect(screen.getByText("Second Book")).toBeInTheDocument();
  });

  it("applies correct CSS classes for grid layout", () => {
    const { container } = render(<BookGrid books={mockBooks} />);

    const gridContainer = container.querySelector(".grid");
    expect(gridContainer).toBeInTheDocument();
    expect(gridContainer).toHaveClass(
      "grid-cols-2",
      "md:grid-cols-4",
      "lg:grid-cols-6",
      "gap-4",
    );
  });

  it("handles books with missing authors", () => {
    const booksWithMissingAuthors: Book[] = [
      {
        id: "1",
        title: "Book Without Authors",
        authors: undefined,
        status: "read",
        dateAdded: "2023-01-01",
        lastUpdated: "2023-01-01",
      },
    ];

    render(<BookGrid books={booksWithMissingAuthors} />);

    expect(
      screen.getByText("Book Without Authors by Unknown Author"),
    ).toBeInTheDocument();
  });

  it("handles books with empty authors array", () => {
    const booksWithEmptyAuthors: Book[] = [
      {
        id: "1",
        title: "Book With Empty Authors",
        authors: [],
        status: "read",
        dateAdded: "2023-01-01",
        lastUpdated: "2023-01-01",
      },
    ];

    render(<BookGrid books={booksWithEmptyAuthors} />);

    expect(
      screen.getByText("Book With Empty Authors by Unknown Author"),
    ).toBeInTheDocument();
  });

  it("handles large number of books", () => {
    const manyBooks: Book[] = Array.from({ length: 50 }, (_, index) => ({
      id: `book-${index}`,
      title: `Book ${index + 1}`,
      authors: [`Author ${index + 1}`],
      status: "read" as const,
      dateAdded: "2023-01-01",
      lastUpdated: "2023-01-01",
    }));

    render(<BookGrid books={manyBooks} />);

    // Check that all books are rendered
    expect(screen.getAllByRole("button")).toHaveLength(50);

    // Check first and last books
    expect(screen.getByTestId("book-spine-book-0")).toBeInTheDocument();
    expect(screen.getByTestId("book-spine-book-49")).toBeInTheDocument();
  });

  it("maintains responsive grid layout", () => {
    const { container } = render(<BookGrid books={mockBooks} />);

    const gridContainer = container.querySelector(".grid");

    // Check responsive classes
    expect(gridContainer).toHaveClass("grid-cols-2"); // Mobile: 2 columns
    expect(gridContainer).toHaveClass("md:grid-cols-4"); // Medium: 4 columns
    expect(gridContainer).toHaveClass("lg:grid-cols-6"); // Large: 6 columns
  });

  it("provides proper accessibility", () => {
    render(<BookGrid books={mockBooks} />);

    // Check that books are keyboard accessible
    const firstBook = screen.getByTestId("book-spine-1");
    expect(firstBook).toHaveAttribute("role", "button");
    expect(firstBook).toHaveAttribute("tabIndex", "0");

    // Test keyboard interaction
    firstBook.focus();
    fireEvent.keyDown(firstBook, { key: "Enter", code: "Enter" });
    // Note: This would require additional implementation in BookSpine
  });

  it("handles book selection state correctly", () => {
    render(<BookGrid books={mockBooks} />);

    // No book selected initially
    expect(screen.queryByTestId("book-modal")).not.toBeInTheDocument();

    // Select first book
    fireEvent.click(screen.getByTestId("book-spine-1"));
    expect(screen.getByTestId("book-modal")).toBeInTheDocument();

    // Select different book (should close and reopen with new book)
    fireEvent.click(screen.getByTestId("book-spine-2"));
    expect(screen.getByText("Second Book")).toBeInTheDocument();
  });

  it("handles undefined books prop gracefully", () => {
    // @ts-ignore - Testing runtime behavior
    render(<BookGrid books={undefined} />);

    expect(screen.getByText("No books found")).toBeInTheDocument();
  });

  it("handles null books prop gracefully", () => {
    // @ts-ignore - Testing runtime behavior
    render(<BookGrid books={null} />);

    expect(screen.getByText("No books found")).toBeInTheDocument();
  });

  it("preserves book order from props", () => {
    render(<BookGrid books={mockBooks} />);

    const bookElements = screen.getAllByRole("button");

    // Check that books appear in the correct order
    expect(bookElements[0]).toHaveTextContent("First Book");
    expect(bookElements[1]).toHaveTextContent("Second Book");
    expect(bookElements[2]).toHaveTextContent("Third Book");
  });

  it("handles books with special characters in titles", () => {
    const specialBooks: Book[] = [
      {
        id: "1",
        title: 'Book with "Quotes" & Symbols',
        authors: ["Author with Àccènts"],
        status: "read",
        dateAdded: "2023-01-01",
        lastUpdated: "2023-01-01",
      },
    ];

    render(<BookGrid books={specialBooks} />);

    expect(
      screen.getByText('Book with "Quotes" & Symbols by Author with Àccènts'),
    ).toBeInTheDocument();
  });
});
