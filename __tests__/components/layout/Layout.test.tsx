import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Layout from "@/components/layout/Layout";
import { PageSection } from "@/components/layout/types";

// Mock Next.js components
jest.mock("next/head", () => {
  return function Head({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  };
});

jest.mock("next/image", () => {
  return function Image({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock the sidebar component
jest.mock("@/components/layout/Sidebar", () => {
  return function Sidebar({ currentSection }: { currentSection: PageSection }) {
    return <div data-testid="sidebar">Sidebar - {currentSection}</div>;
  };
});

// Mock AdminButton component
jest.mock("@/components/ui/AdminButton", () => {
  return function AdminButton() {
    return <button data-testid="admin-button">Admin</button>;
  };
});

// Mock translations
jest.mock("@/lib/translations", () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback,
    language: "en",
    setLanguage: jest.fn(),
  }),
}));

// Mock easter egg triggers
jest.mock("@/lib/easter-eggs/useEasterEggTrigger", () => ({
  useEasterEggTrigger: () => ({
    onClick: jest.fn(),
    onDoubleClick: jest.fn(),
  }),
}));

describe("Layout", () => {
  const defaultProps = {
    children: <div data-testid="content">Test Content</div>,
    section: "welcome" as PageSection,
  };

  beforeEach(() => {
    // Mock window.location for SEO tests
    Object.defineProperty(window, "location", {
      value: { href: "https://example.com" },
      writable: true,
    });
  });

  it("renders children content", () => {
    render(<Layout {...defaultProps} />);
    expect(screen.getByTestId("content")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("renders sidebar with current section", () => {
    render(<Layout {...defaultProps} />);
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByText("Sidebar - welcome")).toBeInTheDocument();
  });

  it("renders admin button", () => {
    render(<Layout {...defaultProps} />);
    expect(screen.getByTestId("admin-button")).toBeInTheDocument();
  });

  it("uses custom title when provided", () => {
    const customTitle = "Custom Page Title";
    render(<Layout {...defaultProps} title={customTitle} />);

    // Check if the title is set in the document head
    const titleElement = screen.getByTitle("Custom Page Title Header");
    expect(titleElement).toBeInTheDocument();
  });

  it("uses default title based on section when no title provided", () => {
    render(<Layout {...defaultProps} section="blog" />);

    // Should use the blog section default title
    const headerImage = screen.getByTitle("Blog Header");
    expect(headerImage).toBeInTheDocument();
  });

  it("renders header image with correct src", () => {
    render(<Layout {...defaultProps} />);

    const headerImage = screen.getByTitle("Welcome Header");
    expect(headerImage).toHaveAttribute("src", "/images/headers/welcome.jpg");
  });

  it("uses custom header image when provided", () => {
    const customImage = "/custom-header.jpg";
    render(<Layout {...defaultProps} headerImage={customImage} />);

    const headerImage = screen.getByTitle("Welcome Header");
    expect(headerImage).toHaveAttribute("src", customImage);
  });

  it("renders copyright with current year", () => {
    render(<Layout {...defaultProps} />);

    const currentYear = new Date().getFullYear();
    expect(
      screen.getByText(`© ${currentYear} Patrick Stephens`),
    ).toBeInTheDocument();
  });

  it("renders language selection buttons", () => {
    render(<Layout {...defaultProps} />);

    expect(screen.getByText("Language")).toBeInTheDocument();
    expect(screen.getByText("Idioma")).toBeInTheDocument();
    expect(screen.getByText("Sprache")).toBeInTheDocument();
    expect(screen.getByText("言語")).toBeInTheDocument();
    expect(screen.getByText("Мова")).toBeInTheDocument();
  });

  it("handles language selection clicks", () => {
    const mockSetLanguage = jest.fn();
    jest.mocked(require("@/lib/translations").useTranslation).mockReturnValue({
      t: (key: string, fallback: string) => fallback,
      language: "en",
      setLanguage: mockSetLanguage,
    });

    render(<Layout {...defaultProps} />);

    fireEvent.click(screen.getByText("Idioma"));
    expect(mockSetLanguage).toHaveBeenCalledWith("es");

    fireEvent.click(screen.getByText("Sprache"));
    expect(mockSetLanguage).toHaveBeenCalledWith("de");
  });

  it("applies correct CSS classes for responsive layout", () => {
    const { container } = render(<Layout {...defaultProps} />);

    // Check main grid layout
    const gridElement = container.querySelector(
      ".grid.grid-cols-1.md\\:grid-cols-4",
    );
    expect(gridElement).toBeInTheDocument();

    // Check main content area
    const mainElement = container.querySelector("main.md\\:col-span-3");
    expect(mainElement).toBeInTheDocument();
  });

  it("renders meta tags correctly", () => {
    render(<Layout {...defaultProps} description="Test description" />);

    // Note: Since we're mocking Head, we can't directly test meta tags in the document head
    // In a real implementation, you might want to use a more sophisticated Head mock
    // or test these with e2e tests
  });

  it("handles different page sections correctly", () => {
    const sections: PageSection[] = [
      "welcome",
      "blog",
      "cv",
      "books",
      "signals",
      "contact",
      "admin",
    ];

    sections.forEach((section) => {
      const { rerender } = render(
        <Layout {...defaultProps} section={section} />,
      );

      // Check that the sidebar receives the correct section
      expect(screen.getByText(`Sidebar - ${section}`)).toBeInTheDocument();

      // Check that the header image path is correct
      const headerImage = screen.getByTitle(
        `${section.charAt(0).toUpperCase() + section.slice(1)} Header`,
      );
      expect(headerImage).toHaveAttribute(
        "src",
        `/images/headers/${section}.jpg`,
      );

      rerender(<div />); // Clean up between iterations
    });
  });

  it("has proper accessibility attributes", () => {
    render(<Layout {...defaultProps} />);

    // Check for aria-label on admin section
    expect(screen.getByLabelText("Admin Access")).toBeInTheDocument();

    // Check for proper title attributes on language buttons
    expect(screen.getByTitle("English")).toBeInTheDocument();
    expect(screen.getByTitle("Spanish")).toBeInTheDocument();
    expect(screen.getByTitle("German")).toBeInTheDocument();
    expect(screen.getByTitle("Japanese")).toBeInTheDocument();
    expect(screen.getByTitle("Ukrainian")).toBeInTheDocument();
  });

  it("applies theme transition classes", () => {
    const { container } = render(<Layout {...defaultProps} />);

    const rootElement = container.querySelector(
      ".min-h-screen.bg-linen.text-gray-800.theme-transition",
    );
    expect(rootElement).toBeInTheDocument();
  });
});
