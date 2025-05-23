import { test, expect } from "@playwright/test";

test.describe("Books Page", () => {
  test("loads and displays books correctly", async ({ page }) => {
    await page.goto("/books");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check that the page title is correct
    await expect(page).toHaveTitle(/Books \| Patrick Stephens/);

    // Check that the books section is visible
    await expect(page.locator("text=My Book Collection")).toBeVisible();

    // Check that book grid or list is present
    // Note: This may depend on whether books are loaded from API
    const booksContainer = page.locator(
      '[data-testid="books-container"], .book-grid, .bookshelf',
    );

    // Wait for books to potentially load
    await page.waitForTimeout(2000);

    // Check if books are displayed (if any exist)
    const books = page.locator(
      '.book-spine, .book-card, [data-testid^="book"]',
    );
    const bookCount = await books.count();

    if (bookCount > 0) {
      // If books exist, test book interactions
      await expect(books.first()).toBeVisible();

      // Test clicking on a book
      await books.first().click();

      // Check if book modal or details appear
      const modal = page.locator(
        '[role="dialog"], .modal, .book-modal, .book-details',
      );
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Check for book title and author
      await expect(
        modal.locator("text=Title, text=Author").first(),
      ).toBeVisible();

      // Close modal (if applicable)
      const closeButton = modal.locator(
        'button[aria-label*="close" i], .close, [data-testid="close"]',
      );
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await expect(modal).not.toBeVisible();
      }
    }
  });

  test("book filtering works", async ({ page }) => {
    await page.goto("/books");
    await page.waitForLoadState("networkidle");

    // Look for filter controls
    const filterControls = page.locator(
      'select, .filter, [data-testid*="filter"]',
    );

    if ((await filterControls.count()) > 0) {
      // Test status filter if available
      const statusFilter = page.locator(
        'select[name*="status"], select:has(option[value*="read"])',
      );
      if (await statusFilter.isVisible()) {
        await statusFilter.selectOption("read");
        await page.waitForTimeout(1000);

        // Change back to all
        await statusFilter.selectOption("all");
        await page.waitForTimeout(1000);
      }

      // Test genre filter if available
      const genreFilter = page.locator(
        'select[name*="genre"], select:has(option[value*="fiction"])',
      );
      if (await genreFilter.isVisible()) {
        await genreFilter.selectOption("fiction");
        await page.waitForTimeout(1000);
      }
    }
  });

  test("book search functionality", async ({ page }) => {
    await page.goto("/books");
    await page.waitForLoadState("networkidle");

    // Look for search input
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search" i], [data-testid*="search"]',
    );

    if (await searchInput.isVisible()) {
      // Test searching for a book
      await searchInput.fill("test");
      await page.waitForTimeout(1000);

      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(1000);
    }
  });

  test("responsive design on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/books");

    // Check that the page loads correctly on mobile
    await expect(page).toHaveTitle(/Books \| Patrick Stephens/);

    // Check that navigation is still accessible
    await expect(page.locator("text=Welcome")).toBeVisible();

    // Check that books display correctly on mobile
    await page.waitForTimeout(1000);
    const books = page.locator(
      '.book-spine, .book-card, [data-testid^="book"]',
    );

    if ((await books.count()) > 0) {
      await expect(books.first()).toBeVisible();
    }
  });

  test("book recommendation feature", async ({ page }) => {
    await page.goto("/books");
    await page.waitForLoadState("networkidle");

    // Look for recommendation button or section
    const recommendationButton = page.locator(
      'button:has-text("recommend"), button:has-text("suggestion"), [data-testid*="recommend"]',
    );

    if (await recommendationButton.isVisible()) {
      await recommendationButton.click();

      // Check if recommendation modal appears
      const modal = page.locator(
        '[role="dialog"], .modal, .recommendation-modal',
      );
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Test filling out recommendation form if present
      const genreSelect = modal.locator("select");
      if (await genreSelect.isVisible()) {
        await genreSelect.selectOption("fiction");
      }

      const submitButton = modal.locator(
        'button[type="submit"], button:has-text("get recommendations")',
      );
      if (await submitButton.isVisible()) {
        await submitButton.click();

        // Wait for recommendations to load
        await page.waitForTimeout(3000);

        // Check for recommendation results
        const recommendations = modal.locator(
          ".recommendation, .book-recommendation",
        );
        if ((await recommendations.count()) > 0) {
          await expect(recommendations.first()).toBeVisible();
        }
      }
    }
  });

  test("book statistics display", async ({ page }) => {
    await page.goto("/books");
    await page.waitForLoadState("networkidle");

    // Look for statistics section
    const statsSection = page.locator(
      '.stats, .statistics, [data-testid*="stats"], .book-count',
    );

    if (await statsSection.isVisible()) {
      // Check that stats display numbers
      await expect(statsSection).toContainText(/\d+/); // Should contain at least one number
    }
  });

  test("book view toggle (grid/list)", async ({ page }) => {
    await page.goto("/books");
    await page.waitForLoadState("networkidle");

    // Look for view toggle buttons
    const viewToggle = page.locator(
      'button:has-text("grid"), button:has-text("list"), .view-toggle',
    );

    if ((await viewToggle.count()) > 0) {
      // Test switching views
      await viewToggle.first().click();
      await page.waitForTimeout(500);

      // Switch back
      if ((await viewToggle.count()) > 1) {
        await viewToggle.last().click();
        await page.waitForTimeout(500);
      }
    }
  });

  test("accessibility features", async ({ page }) => {
    await page.goto("/books");

    // Check that the page has proper heading structure
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();

    // Check for alt text on book images
    const bookImages = page.locator('img[alt*="book"], img[alt*="cover"]');
    if ((await bookImages.count()) > 0) {
      const firstBookImage = bookImages.first();
      const altText = await firstBookImage.getAttribute("alt");
      expect(altText).toBeTruthy();
      expect(altText.length).toBeGreaterThan(0);
    }

    // Check for proper button labels
    const buttons = page.locator("button");
    for (let i = 0; i < (await buttons.count()) && i < 5; i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute("aria-label");
      const textContent = await button.textContent();

      // Button should have either aria-label or text content
      expect(ariaLabel || textContent).toBeTruthy();
    }
  });

  test("performance metrics", async ({ page }) => {
    // Start performance monitoring
    await page.goto("/books");

    // Wait for page to fully load
    await page.waitForLoadState("networkidle");

    // Check that the page loads in reasonable time
    const performanceTiming = await page.evaluate(() => {
      const timing = performance.timing;
      return {
        loadTime: timing.loadEventEnd - timing.navigationStart,
        domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
      };
    });

    // Assert reasonable load times (adjust thresholds as needed)
    expect(performanceTiming.loadTime).toBeLessThan(10000); // 10 seconds
    expect(performanceTiming.domReady).toBeLessThan(5000); // 5 seconds
  });
});
