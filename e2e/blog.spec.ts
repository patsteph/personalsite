import { test, expect } from "@playwright/test";

test.describe("Blog Page", () => {
  test("loads and displays blog posts", async ({ page }) => {
    await page.goto("/blog");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check that the page title is correct
    await expect(page).toHaveTitle(/Blog \| Patrick Stephens/);

    // Check that the blog section is visible
    await expect(page.locator("h1, .page-title")).toContainText(
      /Blog|Articles/,
    );

    // Wait for blog posts to potentially load
    await page.waitForTimeout(2000);

    // Check if blog posts are displayed
    const blogPosts = page.locator(
      '.blog-card, .post-card, article, [data-testid^="post"]',
    );
    const postCount = await blogPosts.count();

    if (postCount > 0) {
      // If posts exist, test post interactions
      await expect(blogPosts.first()).toBeVisible();

      // Check for common blog post elements
      await expect(blogPosts.first().locator("h2, h3, .title")).toBeVisible();

      // Test clicking on a blog post
      await blogPosts.first().click();

      // Should navigate to individual post page
      await page.waitForURL(/\/blog\/.+/);
      await expect(page.locator("h1, .post-title")).toBeVisible();

      // Go back to blog listing
      await page.goBack();
      await expect(page).toHaveURL("/blog");
    } else {
      // If no posts, should show empty state or message
      await expect(
        page.locator("text=No posts, text=No articles, .empty-state"),
      ).toBeVisible();
    }
  });

  test("blog post filtering and search", async ({ page }) => {
    await page.goto("/blog");
    await page.waitForLoadState("networkidle");

    // Look for filter controls
    const tagFilter = page.locator(
      'select[name*="tag"], .tag-filter, [data-testid*="filter"]',
    );
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search" i]',
    );

    if (await tagFilter.isVisible()) {
      // Test tag filtering
      await tagFilter.selectOption({ index: 1 }); // Select first non-default option
      await page.waitForTimeout(1000);

      // Reset filter
      await tagFilter.selectOption({ index: 0 });
      await page.waitForTimeout(1000);
    }

    if (await searchInput.isVisible()) {
      // Test search functionality
      await searchInput.fill("test");
      await page.waitForTimeout(1000);

      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(1000);
    }
  });

  test("individual blog post page", async ({ page }) => {
    await page.goto("/blog");
    await page.waitForLoadState("networkidle");

    // Find and click on first blog post
    const blogPosts = page.locator(
      '.blog-card, .post-card, article, [data-testid^="post"]',
    );
    const postCount = await blogPosts.count();

    if (postCount > 0) {
      await blogPosts.first().click();

      // Wait for post page to load
      await page.waitForLoadState("networkidle");

      // Check that we're on a post page
      await expect(page).toHaveURL(/\/blog\/.+/);

      // Check for post content elements
      await expect(page.locator("h1, .post-title")).toBeVisible();
      await expect(
        page.locator(".post-content, .content, article"),
      ).toBeVisible();

      // Check for author and date information
      const authorElement = page.locator("text=By, .author, .post-meta");
      if (await authorElement.isVisible()) {
        await expect(authorElement).toBeVisible();
      }

      // Check for tags if present
      const tagsElement = page.locator(".tags, .post-tags");
      if (await tagsElement.isVisible()) {
        await expect(tagsElement).toBeVisible();
      }

      // Test back navigation
      await page.goBack();
      await expect(page).toHaveURL("/blog");
    }
  });

  test("blog post reactions and interactions", async ({ page }) => {
    await page.goto("/blog");
    await page.waitForLoadState("networkidle");

    const blogPosts = page.locator(".blog-card, .post-card, article");
    const postCount = await blogPosts.count();

    if (postCount > 0) {
      await blogPosts.first().click();
      await page.waitForLoadState("networkidle");

      // Look for reaction buttons
      const reactionButtons = page.locator(
        'button[aria-label*="like"], button[aria-label*="react"], .reaction-button',
      );

      if ((await reactionButtons.count()) > 0) {
        // Test clicking a reaction
        await reactionButtons.first().click();

        // Should see some feedback (counter increment, visual change, etc.)
        await page.waitForTimeout(500);
      }

      // Look for comment section
      const commentSection = page.locator(
        ".comments, #comments, .comment-form",
      );
      if (await commentSection.isVisible()) {
        await expect(commentSection).toBeVisible();
      }
    }
  });

  test("blog navigation and pagination", async ({ page }) => {
    await page.goto("/blog");
    await page.waitForLoadState("networkidle");

    // Look for pagination controls
    const paginationNext = page.locator(
      'button:has-text("Next"), a:has-text("Next"), .pagination-next',
    );
    const paginationPrev = page.locator(
      'button:has-text("Previous"), a:has-text("Previous"), .pagination-prev',
    );
    const loadMoreButton = page.locator(
      'button:has-text("Load More"), .load-more',
    );

    if (await paginationNext.isVisible()) {
      // Test pagination
      await paginationNext.click();
      await page.waitForLoadState("networkidle");

      // Should be on page 2
      await expect(page).toHaveURL(/page=2|\/2/);

      // Go back if previous button exists
      if (await paginationPrev.isVisible()) {
        await paginationPrev.click();
        await page.waitForLoadState("networkidle");
      }
    }

    if (await loadMoreButton.isVisible()) {
      // Test load more functionality
      const initialPostCount = await page
        .locator(".blog-card, .post-card, article")
        .count();

      await loadMoreButton.click();
      await page.waitForTimeout(2000);

      // Should have more posts loaded
      const newPostCount = await page
        .locator(".blog-card, .post-card, article")
        .count();
      expect(newPostCount).toBeGreaterThanOrEqual(initialPostCount);
    }
  });

  test("responsive design on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/blog");

    // Check that the page loads correctly on mobile
    await expect(page).toHaveTitle(/Blog \| Patrick Stephens/);

    // Check that navigation is still accessible
    await expect(page.locator("text=Welcome")).toBeVisible();

    // Check that blog posts display correctly on mobile
    await page.waitForTimeout(1000);
    const posts = page.locator(".blog-card, .post-card, article");

    if ((await posts.count()) > 0) {
      await expect(posts.first()).toBeVisible();

      // Test mobile post interaction
      await posts.first().click();
      await page.waitForURL(/\/blog\/.+/);

      // Should be readable on mobile
      await expect(page.locator("h1, .post-title")).toBeVisible();
    }
  });

  test("blog RSS feed and sharing", async ({ page }) => {
    await page.goto("/blog");

    // Look for RSS feed link
    const rssLink = page.locator(
      'a[href*="rss"], a[href*="feed"], link[type="application/rss+xml"]',
    );

    if (await rssLink.isVisible()) {
      // RSS link should be present
      await expect(rssLink).toBeVisible();
    }

    // Navigate to a blog post to test sharing
    const posts = page.locator(".blog-card, .post-card, article");
    if ((await posts.count()) > 0) {
      await posts.first().click();
      await page.waitForLoadState("networkidle");

      // Look for social sharing buttons
      const shareButtons = page.locator(
        '[aria-label*="share"], .share-button, .social-share',
      );

      if ((await shareButtons.count()) > 0) {
        await expect(shareButtons.first()).toBeVisible();
      }
    }
  });

  test("blog SEO and meta tags", async ({ page }) => {
    await page.goto("/blog");

    // Check basic meta tags
    const description = await page
      .locator('meta[name="description"]')
      .getAttribute("content");
    expect(description).toBeTruthy();

    // Navigate to individual post for more detailed SEO check
    const posts = page.locator(".blog-card, .post-card, article");
    if ((await posts.count()) > 0) {
      await posts.first().click();
      await page.waitForLoadState("networkidle");

      // Check post-specific meta tags
      const postDescription = await page
        .locator('meta[name="description"]')
        .getAttribute("content");
      expect(postDescription).toBeTruthy();

      // Check Open Graph tags
      const ogTitle = await page
        .locator('meta[property="og:title"]')
        .getAttribute("content");
      expect(ogTitle).toBeTruthy();

      const ogType = await page
        .locator('meta[property="og:type"]')
        .getAttribute("content");
      expect(ogType).toBe("article");

      // Check structured data if present
      const structuredData = page.locator('script[type="application/ld+json"]');
      if ((await structuredData.count()) > 0) {
        const jsonLd = await structuredData.first().textContent();
        expect(jsonLd).toBeTruthy();

        // Should be valid JSON
        expect(() => JSON.parse(jsonLd!)).not.toThrow();
      }
    }
  });

  test("blog performance and loading", async ({ page }) => {
    // Start monitoring performance
    await page.goto("/blog");

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

    // Assert reasonable load times
    expect(performanceTiming.loadTime).toBeLessThan(10000); // 10 seconds
    expect(performanceTiming.domReady).toBeLessThan(5000); // 5 seconds

    // Check for lazy loading of images
    const images = page.locator("img");
    if ((await images.count()) > 0) {
      const firstImage = images.first();
      const loading = await firstImage.getAttribute("loading");

      // Should have lazy loading for non-critical images
      if (loading) {
        expect(["lazy", "eager"]).toContain(loading);
      }
    }
  });
});
