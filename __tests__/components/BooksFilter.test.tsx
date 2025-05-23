import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BooksFilter from "@/components/BooksFilter";

// Mock the booksIndex import since it's not used in the component
jest.mock("@/lib/algolia", () => ({
  booksIndex: {},
}));

describe("BooksFilter", () => {
  const mockOnFilterChange = jest.fn();

  const defaultProps = {
    onFilterChange: mockOnFilterChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all filter controls", () => {
    render(<BooksFilter {...defaultProps} />);

    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Rating")).toBeInTheDocument();
    expect(screen.getByText("Categories")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search books...")).toBeInTheDocument();
  });

  it("calls onFilterChange on mount", () => {
    render(<BooksFilter {...defaultProps} />);

    // Should be called once on mount
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      search: "",
      filters: "",
    });
  });

  it("calls onFilterChange when status filter changes", async () => {
    const user = userEvent.setup();
    render(<BooksFilter {...defaultProps} />);

    const statusSelect = screen.getByDisplayValue("All Statuses");
    await user.selectOptions(statusSelect, "reading");

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      search: "reading",
      filters: "",
    });
  });

  it("calls onFilterChange when rating filter changes", async () => {
    const user = userEvent.setup();
    render(<BooksFilter {...defaultProps} />);

    const ratingSelect = screen.getByDisplayValue("Any Rating");
    await user.selectOptions(ratingSelect, "5");

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      search: "",
      filters: "userRating = 5",
    });
  });

  it("calls onFilterChange when category filter changes", async () => {
    const user = userEvent.setup();
    render(<BooksFilter {...defaultProps} />);

    const categorySelect = screen.getByDisplayValue("All Categories");
    await user.selectOptions(categorySelect, "Fiction");

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      search: "Fiction",
      filters: "",
    });
  });

  it("handles search input changes", async () => {
    const user = userEvent.setup();
    render(<BooksFilter {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("Search books...");
    await user.type(searchInput, "test search");

    // Should update the input value
    expect(searchInput).toHaveValue("test search");
  });

  it("renders status options", () => {
    render(<BooksFilter {...defaultProps} />);

    expect(
      screen.getByRole("option", { name: "All Statuses" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Read" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Currently Reading" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "To Read" })).toBeInTheDocument();
  });

  it("renders rating options", () => {
    render(<BooksFilter {...defaultProps} />);

    expect(
      screen.getByRole("option", { name: "Any Rating" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "★★★★★" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "★★★★☆" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "★★★☆☆" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "★★☆☆☆" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "★☆☆☆☆" })).toBeInTheDocument();
  });

  it("renders category options", () => {
    render(<BooksFilter {...defaultProps} />);

    expect(
      screen.getByRole("option", { name: "All Categories" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Fiction" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Non-Fiction" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Science Fiction" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Fantasy" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Business" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Self-Help" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Biography" }),
    ).toBeInTheDocument();
  });
});
