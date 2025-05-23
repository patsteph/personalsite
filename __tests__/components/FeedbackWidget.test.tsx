import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FeedbackWidget from "@/components/FeedbackWidget";

// Mock fetch
global.fetch = jest.fn();

// Mock canvas-confetti
jest.mock("canvas-confetti", () => jest.fn());

describe("FeedbackWidget", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  it("renders feedback button initially", () => {
    render(<FeedbackWidget />);

    expect(
      screen.getByRole("button", { name: /feedback/i }),
    ).toBeInTheDocument();
  });

  it("opens feedback form when button is clicked", async () => {
    const user = userEvent.setup();
    render(<FeedbackWidget />);

    const feedbackButton = screen.getByRole("button", { name: /feedback/i });
    await user.click(feedbackButton);

    expect(screen.getByLabelText(/your feedback/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send feedback/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("closes form when cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(<FeedbackWidget />);

    // Open form
    await user.click(screen.getByRole("button", { name: /feedback/i }));

    // Close form
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.queryByLabelText(/your feedback/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /feedback/i }),
    ).toBeInTheDocument();
  });

  it("closes form when clicking outside", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <FeedbackWidget />
        <div data-testid="outside">Outside content</div>
      </div>,
    );

    // Open form
    await user.click(screen.getByRole("button", { name: /feedback/i }));
    expect(screen.getByLabelText(/your feedback/i)).toBeInTheDocument();

    // Click outside
    await user.click(screen.getByTestId("outside"));

    await waitFor(() => {
      expect(screen.queryByLabelText(/your feedback/i)).not.toBeInTheDocument();
    });
  });

  it("submits feedback successfully", async () => {
    const user = userEvent.setup();
    render(<FeedbackWidget />);

    // Open form
    await user.click(screen.getByRole("button", { name: /feedback/i }));

    // Fill form
    const textarea = screen.getByLabelText(/your feedback/i);
    await user.type(textarea, "This is great feedback!");

    // Submit
    await user.click(screen.getByRole("button", { name: /send feedback/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedback: "This is great feedback!",
          url: window.location.href,
          timestamp: expect.any(String),
        }),
      });
    });

    // Should show success message
    expect(
      screen.getByText(/thank you for your feedback/i),
    ).toBeInTheDocument();
  });

  it("handles feedback submission error", async () => {
    const user = userEvent.setup();
    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    render(<FeedbackWidget />);

    // Open form and submit
    await user.click(screen.getByRole("button", { name: /feedback/i }));
    await user.type(screen.getByLabelText(/your feedback/i), "Test feedback");
    await user.click(screen.getByRole("button", { name: /send feedback/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to send feedback/i)).toBeInTheDocument();
    });
  });

  it("prevents submission with empty feedback", async () => {
    const user = userEvent.setup();
    render(<FeedbackWidget />);

    // Open form
    await user.click(screen.getByRole("button", { name: /feedback/i }));

    // Try to submit without typing
    const submitButton = screen.getByRole("button", { name: /send feedback/i });
    await user.click(submitButton);

    // Should not call fetch
    expect(fetch).not.toHaveBeenCalled();

    // Form should still be open
    expect(screen.getByLabelText(/your feedback/i)).toBeInTheDocument();
  });

  it("shows loading state during submission", async () => {
    const user = userEvent.setup();

    // Mock slow response
    (fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () => Promise.resolve({ success: true }),
              }),
            100,
          ),
        ),
    );

    render(<FeedbackWidget />);

    // Open form and fill
    await user.click(screen.getByRole("button", { name: /feedback/i }));
    await user.type(screen.getByLabelText(/your feedback/i), "Test feedback");

    // Submit
    await user.click(screen.getByRole("button", { name: /send feedback/i }));

    // Should show loading state
    expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();

    // Wait for completion
    await waitFor(
      () => {
        expect(
          screen.getByText(/thank you for your feedback/i),
        ).toBeInTheDocument();
      },
      { timeout: 200 },
    );
  });

  it("resets form after successful submission", async () => {
    const user = userEvent.setup();
    render(<FeedbackWidget />);

    // Submit feedback
    await user.click(screen.getByRole("button", { name: /feedback/i }));
    await user.type(screen.getByLabelText(/your feedback/i), "Test feedback");
    await user.click(screen.getByRole("button", { name: /send feedback/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/thank you for your feedback/i),
      ).toBeInTheDocument();
    });

    // Open form again
    await user.click(screen.getByRole("button", { name: /feedback/i }));

    // Form should be reset
    expect(screen.getByLabelText(/your feedback/i)).toHaveValue("");
  });

  it("includes current page URL in submission", async () => {
    const user = userEvent.setup();

    // Mock window.location
    Object.defineProperty(window, "location", {
      value: { href: "https://example.com/test-page" },
      writable: true,
    });

    render(<FeedbackWidget />);

    await user.click(screen.getByRole("button", { name: /feedback/i }));
    await user.type(screen.getByLabelText(/your feedback/i), "Test feedback");
    await user.click(screen.getByRole("button", { name: /send feedback/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedback: "Test feedback",
          url: "https://example.com/test-page",
          timestamp: expect.any(String),
        }),
      });
    });
  });
});
