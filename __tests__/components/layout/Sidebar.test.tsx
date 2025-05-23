import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Sidebar from "@/components/layout/Sidebar";
import { PageSection } from "@/components/layout/types";

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

// Mock translations
const mockT = jest.fn((key: string, fallback: string) => fallback);
jest.mock("@/lib/translations", () => ({
  useTranslation: () => ({
    t: mockT,
  }),
}));

// Mock theme context
const mockToggleTheme = jest.fn();
jest.mock("@/components/AppProviders", () => ({
  useTheme: () => ({
    theme: "light",
    toggleTheme: mockToggleTheme,
  }),
}));

describe("Sidebar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders profile section correctly", () => {
    render(<Sidebar currentSection="welcome" />);

    expect(screen.getByAltText("Profile Photo")).toBeInTheDocument();
    expect(screen.getByText("Patrick Stephens")).toBeInTheDocument();
    expect(screen.getByText("Senior Engineering Manager")).toBeInTheDocument();
  });

  it("renders all navigation items", () => {
    render(<Sidebar currentSection="welcome" />);

    const expectedNavItems = [
      "Welcome",
      "Books",
      "Blog",
      "Signals",
      "CV",
      "Contact",
    ];

    expectedNavItems.forEach((item) => {
      expect(screen.getByText(item)).toBeInTheDocument();
    });
  });

  it("highlights current section correctly", () => {
    render(<Sidebar currentSection="blog" />);

    const blogLink = screen.getByText("Blog").closest("a");
    expect(blogLink).toHaveClass(
      "bg-opacity-20",
      "bg-steel-blue",
      "transform",
      "translate-x-1",
    );
  });

  it("applies hover styles to non-current sections", () => {
    render(<Sidebar currentSection="blog" />);

    const welcomeLink = screen.getByText("Welcome").closest("a");
    expect(welcomeLink).toHaveClass(
      "hover:bg-opacity-10",
      "hover:bg-steel-blue",
      "hover:translate-x-1",
    );
    expect(welcomeLink).not.toHaveClass(
      "bg-opacity-20",
      "transform",
      "translate-x-1",
    );
  });

  it("renders correct navigation links", () => {
    render(<Sidebar currentSection="welcome" />);

    const expectedLinks = [
      { text: "Welcome", href: "/" },
      { text: "Books", href: "/books" },
      { text: "Blog", href: "/blog" },
      { text: "Signals", href: "/signals" },
      { text: "CV", href: "/cv" },
      { text: "Contact", href: "/contact" },
    ];

    expectedLinks.forEach(({ text, href }) => {
      const link = screen.getByText(text).closest("a");
      expect(link).toHaveAttribute("href", href);
    });
  });

  it("renders theme toggle button", () => {
    render(<Sidebar currentSection="welcome" />);

    const themeButton = screen.getByRole("button", {
      name: /switch to dark mode/i,
    });
    expect(themeButton).toBeInTheDocument();
  });

  it("calls toggleTheme when theme button is clicked", () => {
    render(<Sidebar currentSection="welcome" />);

    const themeButton = screen.getByRole("button", {
      name: /switch to dark mode/i,
    });
    fireEvent.click(themeButton);

    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });

  it("renders correct theme icon for light mode", () => {
    render(<Sidebar currentSection="welcome" />);

    // In light mode, should show moon icon (dark mode toggle)
    const themeButton = screen.getByRole("button", {
      name: /switch to dark mode/i,
    });
    expect(themeButton).toBeInTheDocument();
  });

  it("renders correct theme icon for dark mode", () => {
    // Mock dark theme
    jest.mocked(require("@/components/AppProviders").useTheme).mockReturnValue({
      theme: "dark",
      toggleTheme: mockToggleTheme,
    });

    render(<Sidebar currentSection="welcome" />);

    // In dark mode, should show sun icon (light mode toggle)
    const themeButton = screen.getByRole("button", {
      name: /switch to light mode/i,
    });
    expect(themeButton).toBeInTheDocument();
  });

  it("renders all social media links", () => {
    render(<Sidebar currentSection="welcome" />);

    const socialLinks = [
      { label: "GitHub Profile", href: "https://github.com/patsteph" },
      {
        label: "LinkedIn Profile",
        href: "https://linkedin.com/in/patrickjstephens/",
      },
      { label: "Twitter Profile", href: "https://twitter.com/StephensCisco" },
      {
        label: "Bluesky Profile",
        href: "https://bsky.app/profile/stephenspatrickj/",
      },
    ];

    socialLinks.forEach(({ label, href }) => {
      const link = screen.getByLabelText(label);
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", href);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  it("uses translation function for navigation labels", () => {
    render(<Sidebar currentSection="welcome" />);

    // Verify that the translation function was called for each nav item
    expect(mockT).toHaveBeenCalledWith("nav.welcome", "Welcome");
    expect(mockT).toHaveBeenCalledWith("nav.books", "Books");
    expect(mockT).toHaveBeenCalledWith("nav.blog", "Blog");
    expect(mockT).toHaveBeenCalledWith("nav.signals", "Signals");
    expect(mockT).toHaveBeenCalledWith("nav.cv", "CV");
    expect(mockT).toHaveBeenCalledWith("nav.contact", "Contact");
  });

  it("renders profile image with correct attributes", () => {
    render(<Sidebar currentSection="welcome" />);

    const profileImage = screen.getByAltText("Profile Photo");
    expect(profileImage).toHaveAttribute("src", "/images/profile.jpg");
    expect(profileImage).toHaveAttribute("width", "150");
    expect(profileImage).toHaveAttribute("height", "150");
  });

  it("applies correct CSS classes for layout", () => {
    const { container } = render(<Sidebar currentSection="welcome" />);

    const aside = container.querySelector("aside");
    expect(aside).toHaveClass(
      "bg-linen",
      "p-6",
      "md:sticky",
      "md:top-0",
      "md:h-screen",
      "md:overflow-y-auto",
      "flex",
      "flex-col",
      "theme-transition",
    );
  });

  it("handles different current sections correctly", () => {
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
      const { rerender } = render(<Sidebar currentSection={section} />);

      // The section should be highlighted if it exists in navigation
      const navItems = ["welcome", "books", "blog", "signals", "cv", "contact"];
      if (navItems.includes(section)) {
        const sectionText = section.charAt(0).toUpperCase() + section.slice(1);
        const link = screen
          .getByText(sectionText === "Cv" ? "CV" : sectionText)
          .closest("a");
        expect(link).toHaveClass(
          "bg-opacity-20",
          "bg-steel-blue",
          "transform",
          "translate-x-1",
        );
      }

      rerender(<div />); // Clean up between iterations
    });
  });

  it("has proper accessibility attributes", () => {
    render(<Sidebar currentSection="welcome" />);

    // Check aria-labels on social links
    expect(screen.getByLabelText("GitHub Profile")).toBeInTheDocument();
    expect(screen.getByLabelText("LinkedIn Profile")).toBeInTheDocument();
    expect(screen.getByLabelText("Twitter Profile")).toBeInTheDocument();
    expect(screen.getByLabelText("Bluesky Profile")).toBeInTheDocument();

    // Check theme toggle aria-label
    expect(
      screen.getByLabelText(/switch to (dark|light) mode/i),
    ).toBeInTheDocument();
  });
});
