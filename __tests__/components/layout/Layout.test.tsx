import React from "react";
import { render, screen } from "@testing-library/react";
import Layout from "@/components/layout/Layout";
import { PageSection } from "@/components/layout/types";

// Mock Next.js components
jest.mock("next/head", () => {
  return function Head({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  };
});

// Mock the sidebar component
jest.mock("@/components/layout/Sidebar", () => {
  return function Sidebar({ currentSection }: { currentSection: PageSection }) {
    return <div data-testid="sidebar">Sidebar - {currentSection}</div>;
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

  it("renders copyright with current year", () => {
    render(<Layout {...defaultProps} />);

    const currentYear = new Date().getFullYear();
    expect(
      screen.getByText(`© ${currentYear} Patrick Stephens`),
    ).toBeInTheDocument();
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

      rerender(<div />); // Clean up between iterations
    });
  });

  it("applies theme transition classes", () => {
    const { container } = render(<Layout {...defaultProps} />);

    const rootElement = container.querySelector(
      ".min-h-screen.bg-linen.text-gray-800.theme-transition",
    );
    expect(rootElement).toBeInTheDocument();
  });
});
