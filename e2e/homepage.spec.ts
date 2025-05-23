import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("loads and displays main content", async ({ page }) => {
    await page.goto("/");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check that the page title is correct
    await expect(page).toHaveTitle(/Welcome \| Patrick Stephens/);

    // Check that the main navigation is present
    await expect(page.locator("text=Welcome")).toBeVisible();
    await expect(page.locator("text=Books")).toBeVisible();
    await expect(page.locator("text=Blog")).toBeVisible();
    await expect(page.locator("text=CV")).toBeVisible();
    await expect(page.locator("text=Contact")).toBeVisible();

    // Check that the profile section is visible
    await expect(page.locator("text=Patrick Stephens")).toBeVisible();
    await expect(page.locator("text=Senior Engineering Manager")).toBeVisible();

    // Check that the header image is present
    const headerImage = page.locator('img[alt*="Header"]');
    await expect(headerImage).toBeVisible();

    // Check that social links are present
    await expect(page.locator('a[aria-label="GitHub Profile"]')).toBeVisible();
    await expect(
      page.locator('a[aria-label="LinkedIn Profile"]'),
    ).toBeVisible();

    // Check that language selection is available
    await expect(page.locator("text=Language")).toBeVisible();
    await expect(page.locator("text=Idioma")).toBeVisible();
  });

  test("navigation works correctly", async ({ page }) => {
    await page.goto("/");

    // Test navigation to Books page
    await page.click("text=Books");
    await expect(page).toHaveURL("/books");
    await expect(page).toHaveTitle(/Books \| Patrick Stephens/);

    // Test navigation to Blog page
    await page.click("text=Blog");
    await expect(page).toHaveURL("/blog");
    await expect(page).toHaveTitle(/Blog \| Patrick Stephens/);

    // Test navigation to CV page
    await page.click("text=CV");
    await expect(page).toHaveURL("/cv");
    await expect(page).toHaveTitle(/Curriculum Vitae \| Patrick Stephens/);

    // Test navigation to Contact page
    await page.click("text=Contact");
    await expect(page).toHaveURL("/contact");
    await expect(page).toHaveTitle(/Contact \| Patrick Stephens/);

    // Test navigation back to Welcome
    await page.click("text=Welcome");
    await expect(page).toHaveURL("/");
    await expect(page).toHaveTitle(/Welcome \| Patrick Stephens/);
  });

  test("language switching works", async ({ page }) => {
    await page.goto("/");

    // Test switching to Spanish
    await page.click("text=Idioma");

    // Wait for language change and check that content updates
    // Note: This depends on actual translation implementation
    await page.waitForTimeout(500);

    // Test switching to German
    await page.click("text=Sprache");
    await page.waitForTimeout(500);

    // Test switching back to English
    await page.click("text=Language");
    await page.waitForTimeout(500);
  });

  test("responsive design works on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Check that the page still loads correctly on mobile
    await expect(page.locator("text=Patrick Stephens")).toBeVisible();
    await expect(page.locator("text=Welcome")).toBeVisible();

    // Check that navigation is accessible on mobile
    await expect(page.locator("text=Books")).toBeVisible();
    await expect(page.locator("text=Blog")).toBeVisible();

    // Test mobile navigation
    await page.click("text=Books");
    await expect(page).toHaveURL("/books");
  });

  test("feedback widget is present and functional", async ({ page }) => {
    await page.goto("/");

    // Check that feedback button is visible
    const feedbackButton = page.locator('button[aria-label*="feedback" i]');
    await expect(feedbackButton).toBeVisible();

    // Click feedback button to open form
    await feedbackButton.click();

    // Check that feedback form opens
    await expect(page.locator("text=Share your thoughts")).toBeVisible();
    await expect(page.locator("textarea")).toBeVisible();
    await expect(page.locator("select")).toBeVisible();

    // Test form submission (with test data)
    await page.selectOption("select", "functionality");
    await page.fill("textarea", "This is a test feedback message");

    // Click submit (note: this will actually submit in tests)
    await page.click("text=Submit");

    // Check for success message
    await expect(
      page.locator("text=Thank you for your feedback"),
    ).toBeVisible();
  });

  test("theme toggle works", async ({ page }) => {
    await page.goto("/");

    // Find theme toggle button
    const themeButton = page.locator('button[aria-label*="mode" i]');
    await expect(themeButton).toBeVisible();

    // Click theme toggle
    await themeButton.click();

    // Wait for theme change
    await page.waitForTimeout(500);

    // Click again to toggle back
    await themeButton.click();
    await page.waitForTimeout(500);
  });

  test("social links work correctly", async ({ page }) => {
    await page.goto("/");

    // Test GitHub link
    const githubLink = page.locator('a[aria-label="GitHub Profile"]');
    await expect(githubLink).toHaveAttribute(
      "href",
      "https://github.com/patsteph",
    );
    await expect(githubLink).toHaveAttribute("target", "_blank");

    // Test LinkedIn link
    const linkedinLink = page.locator('a[aria-label="LinkedIn Profile"]');
    await expect(linkedinLink).toHaveAttribute(
      "href",
      "https://linkedin.com/in/patrickjstephens/",
    );
    await expect(linkedinLink).toHaveAttribute("target", "_blank");

    // Test Twitter link
    const twitterLink = page.locator('a[aria-label="Twitter Profile"]');
    await expect(twitterLink).toHaveAttribute(
      "href",
      "https://twitter.com/StephensCisco",
    );
    await expect(twitterLink).toHaveAttribute("target", "_blank");

    // Test Bluesky link
    const blueskyLink = page.locator('a[aria-label="Bluesky Profile"]');
    await expect(blueskyLink).toHaveAttribute(
      "href",
      "https://bsky.app/profile/stephenspatrickj/",
    );
    await expect(blueskyLink).toHaveAttribute("target", "_blank");
  });

  test("SEO meta tags are present", async ({ page }) => {
    await page.goto("/");

    // Check basic meta tags
    const description = await page
      .locator('meta[name="description"]')
      .getAttribute("content");
    expect(description).toContain("Patrick Stephens");

    // Check Open Graph tags
    const ogTitle = await page
      .locator('meta[property="og:title"]')
      .getAttribute("content");
    expect(ogTitle).toContain("Patrick Stephens");

    const ogType = await page
      .locator('meta[property="og:type"]')
      .getAttribute("content");
    expect(ogType).toBe("website");

    // Check Twitter Card tags
    const twitterCard = await page
      .locator('meta[name="twitter:card"]')
      .getAttribute("content");
    expect(twitterCard).toBe("summary_large_image");
  });
});
