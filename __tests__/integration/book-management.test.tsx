import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";

// Mock the entire books page component
const MockBooksPage = () => {
  const [books, setBooks] = React.useState([
    {
      id: "1",
      title: "Existing Book",
      authors: ["Existing Author"],
      status: "read",
      dateAdded: "2023-01-01",
      lastUpdated: "2023-01-01",
    },
  ]);
  const [selectedBook, setSelectedBook] = React.useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  const handleAddBook = (bookData: any) => {
    const newBook = {
      id: `book-${Date.now()}`,
      ...bookData,
      dateAdded: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
    setBooks([...books, newBook]);
    setIsAddModalOpen(false);
  };

  const handleUpdateBook = (bookId: string, updates: any) => {
    setBooks(
      books.map((book) =>
        book.id === bookId
          ? { ...book, ...updates, lastUpdated: new Date().toISOString() }
          : book,
      ),
    );
    setSelectedBook(null);
  };

  const handleDeleteBook = (bookId: string) => {
    setBooks(books.filter((book) => book.id !== bookId));
    setSelectedBook(null);
  };

  return (
    <div>
      <h1>My Book Collection</h1>

      {/* Add Book Button */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        data-testid="add-book-button"
      >
        Add Book
      </button>

      {/* Books Grid */}
      <div data-testid="books-grid" className="grid">
        {books.map((book) => (
          <div
            key={book.id}
            data-testid={`book-${book.id}`}
            onClick={() => setSelectedBook(book)}
            className="book-card cursor-pointer"
          >
            <h3>{book.title}</h3>
            <p>by {book.authors.join(", ")}</p>
            <span className={`status-${book.status}`}>{book.status}</span>
          </div>
        ))}
      </div>

      {/* Add Book Modal */}
      {isAddModalOpen && (
        <div data-testid="add-book-modal" role="dialog">
          <h2>Add New Book</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleAddBook({
                title: formData.get("title"),
                authors: [formData.get("author")],
                status: formData.get("status") || "to-read",
              });
            }}
          >
            <input
              name="title"
              placeholder="Book Title"
              required
              data-testid="book-title-input"
            />
            <input
              name="author"
              placeholder="Author"
              required
              data-testid="book-author-input"
            />
            <select name="status" data-testid="book-status-select">
              <option value="to-read">To Read</option>
              <option value="reading">Reading</option>
              <option value="read">Read</option>
            </select>
            <button type="submit" data-testid="save-book-button">
              Save Book
            </button>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              data-testid="cancel-add-button"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Book Details Modal */}
      {selectedBook && (
        <div data-testid="book-details-modal" role="dialog">
          <h2>{selectedBook.title}</h2>
          <p>by {selectedBook.authors.join(", ")}</p>
          <p>Status: {selectedBook.status}</p>
          <p>Added: {new Date(selectedBook.dateAdded).toLocaleDateString()}</p>

          <button
            onClick={() =>
              handleUpdateBook(selectedBook.id, {
                status: selectedBook.status === "read" ? "reading" : "read",
              })
            }
            data-testid="toggle-status-button"
          >
            Mark as {selectedBook.status === "read" ? "Reading" : "Read"}
          </button>

          <button
            onClick={() => handleDeleteBook(selectedBook.id)}
            data-testid="delete-book-button"
            className="delete-button"
          >
            Delete Book
          </button>

          <button
            onClick={() => setSelectedBook(null)}
            data-testid="close-details-button"
          >
            Close
          </button>
        </div>
      )}

      {/* Empty State */}
      {books.length === 0 && (
        <div data-testid="empty-state">
          <p>No books in your collection yet.</p>
          <p>Add your first book to get started!</p>
        </div>
      )}
    </div>
  );
};

describe("Book Management Integration Tests", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>,
    );
  };

  it("displays existing books collection", () => {
    renderWithQueryClient(<MockBooksPage />);

    expect(screen.getByText("My Book Collection")).toBeInTheDocument();
    expect(screen.getByTestId("book-1")).toBeInTheDocument();
    expect(screen.getByText("Existing Book")).toBeInTheDocument();
    expect(screen.getByText("by Existing Author")).toBeInTheDocument();
  });

  it("completes full add book workflow", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MockBooksPage />);

    // Step 1: Click add book button
    await user.click(screen.getByTestId("add-book-button"));

    // Step 2: Verify modal opens
    expect(screen.getByTestId("add-book-modal")).toBeInTheDocument();
    expect(screen.getByText("Add New Book")).toBeInTheDocument();

    // Step 3: Fill out form
    await user.type(screen.getByTestId("book-title-input"), "New Test Book");
    await user.type(screen.getByTestId("book-author-input"), "Test Author");
    await user.selectOptions(
      screen.getByTestId("book-status-select"),
      "reading",
    );

    // Step 4: Submit form
    await user.click(screen.getByTestId("save-book-button"));

    // Step 5: Verify book was added
    await waitFor(() => {
      expect(screen.queryByTestId("add-book-modal")).not.toBeInTheDocument();
    });

    expect(screen.getByText("New Test Book")).toBeInTheDocument();
    expect(screen.getByText("by Test Author")).toBeInTheDocument();
    expect(screen.getByText("reading")).toBeInTheDocument();
  });

  it("completes book status update workflow", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MockBooksPage />);

    // Step 1: Click on existing book
    await user.click(screen.getByTestId("book-1"));

    // Step 2: Verify details modal opens
    expect(screen.getByTestId("book-details-modal")).toBeInTheDocument();
    expect(screen.getByText("Existing Book")).toBeInTheDocument();
    expect(screen.getByText("Status: read")).toBeInTheDocument();

    // Step 3: Toggle status
    await user.click(screen.getByTestId("toggle-status-button"));

    // Step 4: Verify status updated
    expect(screen.getByText("Status: reading")).toBeInTheDocument();

    // Step 5: Close modal and verify grid updates
    await user.click(screen.getByTestId("close-details-button"));

    await waitFor(() => {
      expect(
        screen.queryByTestId("book-details-modal"),
      ).not.toBeInTheDocument();
    });

    // Verify the book in grid shows updated status
    const bookCard = screen.getByTestId("book-1");
    expect(bookCard).toHaveTextContent("reading");
  });

  it("completes book deletion workflow", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MockBooksPage />);

    // Step 1: Click on book to open details
    await user.click(screen.getByTestId("book-1"));

    // Step 2: Click delete button
    await user.click(screen.getByTestId("delete-book-button"));

    // Step 3: Verify book is removed
    await waitFor(() => {
      expect(
        screen.queryByTestId("book-details-modal"),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("book-1")).not.toBeInTheDocument();
    });

    // Step 4: Verify empty state appears
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(
      screen.getByText("No books in your collection yet."),
    ).toBeInTheDocument();
  });

  it("handles cancel add book workflow", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MockBooksPage />);

    // Step 1: Open add book modal
    await user.click(screen.getByTestId("add-book-button"));
    expect(screen.getByTestId("add-book-modal")).toBeInTheDocument();

    // Step 2: Fill some data
    await user.type(screen.getByTestId("book-title-input"), "Cancelled Book");

    // Step 3: Cancel
    await user.click(screen.getByTestId("cancel-add-button"));

    // Step 4: Verify modal closes and no book added
    await waitFor(() => {
      expect(screen.queryByTestId("add-book-modal")).not.toBeInTheDocument();
    });

    expect(screen.queryByText("Cancelled Book")).not.toBeInTheDocument();

    // Original book should still be there
    expect(screen.getByTestId("book-1")).toBeInTheDocument();
  });

  it("handles multiple book additions in sequence", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MockBooksPage />);

    const booksToAdd = [
      { title: "First New Book", author: "First Author", status: "to-read" },
      { title: "Second New Book", author: "Second Author", status: "reading" },
      { title: "Third New Book", author: "Third Author", status: "read" },
    ];

    for (const book of booksToAdd) {
      // Open modal
      await user.click(screen.getByTestId("add-book-button"));

      // Fill form
      await user.type(screen.getByTestId("book-title-input"), book.title);
      await user.type(screen.getByTestId("book-author-input"), book.author);
      await user.selectOptions(
        screen.getByTestId("book-status-select"),
        book.status,
      );

      // Submit
      await user.click(screen.getByTestId("save-book-button"));

      // Wait for modal to close
      await waitFor(() => {
        expect(screen.queryByTestId("add-book-modal")).not.toBeInTheDocument();
      });

      // Verify book appears
      expect(screen.getByText(book.title)).toBeInTheDocument();
    }

    // Verify all books are present (including original)
    expect(screen.getByText("Existing Book")).toBeInTheDocument();
    expect(screen.getByText("First New Book")).toBeInTheDocument();
    expect(screen.getByText("Second New Book")).toBeInTheDocument();
    expect(screen.getByText("Third New Book")).toBeInTheDocument();
  });

  it("validates required fields in add book form", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MockBooksPage />);

    // Open modal
    await user.click(screen.getByTestId("add-book-button"));

    // Try to submit without filling required fields
    await user.click(screen.getByTestId("save-book-button"));

    // Form should not submit (modal should still be open)
    expect(screen.getByTestId("add-book-modal")).toBeInTheDocument();

    // No new book should be added
    expect(screen.getAllByTestId(/^book-/).length).toBe(1); // Only original book
  });

  it("handles rapid book interactions without state conflicts", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MockBooksPage />);

    // Add a book quickly
    await user.click(screen.getByTestId("add-book-button"));
    await user.type(screen.getByTestId("book-title-input"), "Quick Book");
    await user.type(screen.getByTestId("book-author-input"), "Quick Author");
    await user.click(screen.getByTestId("save-book-button"));

    await waitFor(() => {
      expect(screen.queryByTestId("add-book-modal")).not.toBeInTheDocument();
    });

    // Immediately interact with books
    const newBookElement = screen
      .getByText("Quick Book")
      .closest('[data-testid^="book-"]');
    await user.click(newBookElement!);

    // Should open details modal
    expect(screen.getByTestId("book-details-modal")).toBeInTheDocument();
    expect(screen.getByText("Quick Book")).toBeInTheDocument();
  });

  it("maintains UI state consistency during operations", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MockBooksPage />);

    // Open book details
    await user.click(screen.getByTestId("book-1"));

    // Change status
    await user.click(screen.getByTestId("toggle-status-button"));

    // The modal should still show updated information
    expect(screen.getByText("Status: reading")).toBeInTheDocument();

    // Close modal
    await user.click(screen.getByTestId("close-details-button"));

    // Reopen details
    await user.click(screen.getByTestId("book-1"));

    // Should show the updated status
    expect(screen.getByText("Status: reading")).toBeInTheDocument();
  });
});
