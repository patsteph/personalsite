# Site Content Management Guide

This document explains how the site content management system works and how to set it up.

## Overview

The site content management system allows you to edit page content directly from the admin dashboard. It uses:

1. **Content Files**: Markdown files stored in the `content/site/` directory
2. **GitHub API**: API to read/write content and create pull requests
3. **UI Editor**: A rich text editor in the admin dashboard

## Setup Requirements for Vercel Deployment

Since this site is deployed on Vercel, which uses serverless functions that can't interact directly with git commands, we use the GitHub API instead:

### 1. GitHub Personal Access Token

You need to create a GitHub Personal Access Token with appropriate permissions:

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Create a new token with the following permissions:
   - For private repositories: `repo` scope
   - For public repositories: `public_repo` scope
3. The token should have permissions to read/write repository contents and create pull requests

### 2. Environment Variables in Vercel

Add the following environment variables in your Vercel project settings:

```
GITHUB_TOKEN=your-personal-access-token
GITHUB_OWNER=patsteph
GITHUB_REPO=personal-website
GITHUB_BRANCH=main
```

### 3. Content Directory Structure

The content is stored in the following directory structure:

```
/content
  /site
    welcome.md
    books.md
    blog.md
    cv.md
    signals.md
    contact.md
```

Each markdown file represents content for a specific section of the website.

## Authentication

The API endpoints use Firebase Authentication to validate requests. The authentication flow is:

1. User logs in through the admin interface
2. The auth token is stored in localStorage
3. API requests include the token in the Authorization header
4. Server verifies the token with Firebase Admin SDK

## GitHub API Integration

The site content management system uses the GitHub API (via Octokit) to:

1. **Read content**: Fetches content files from the GitHub repository
2. **Write content**: Updates content files directly in the repository 
3. **Create pull requests**: Creates pull requests for content changes

### Flow for Editing Content

1. User selects a section to edit in the admin dashboard
2. System fetches the content from GitHub via API
3. User edits the content using the rich text editor
4. When user saves, the content is written directly to the repository
5. When user clicks "Create Pull Request", a new branch is created with all changes and a PR is opened

### Benefits of this Approach

1. **Works with serverless environments** like Vercel
2. **Code review workflow**: Changes go through pull requests that can be reviewed
3. **Audit trail**: All content changes are tracked in Git history
4. **No direct server access needed**: Everything works through the GitHub API

## Content Structure

Content files are stored in the `content/site/` directory:

- `welcome.md` - Home page content
- `books.md` - Books page content
- `blog.md` - Blog page content
- `cv.md` - CV page content
- `signals.md` - Signals page content
- `contact.md` - Contact page content

## API Endpoints

### GET /api/site-content

Gets content for a specific section.

Query parameters:
- `section`: The section name (welcome, books, blog, cv, signals, contact)

### POST /api/site-content

Updates content for a specific section.

Request body:
```json
{
  "section": "welcome",
  "title": "Welcome to My Site",
  "subtitle": "Optional subtitle",
  "content": "Your markdown or HTML content here"
}
```

### PUT /api/site-content

Commits and pushes changes to the git repository.

Request body:
```json
{
  "message": "Your commit message here"
}
```

## Security Considerations

1. **Authentication**: Only authenticated users can access the API endpoints
2. **Input Validation**: Request parameters are validated to prevent unauthorized access
3. **Error Handling**: Errors are caught and logged properly

## Rendering Content

To display the content on your site, you'll need to:

1. Add API functions to fetch content
2. Update your page components to display the content
3. Add appropriate fallbacks if content cannot be loaded

## Troubleshooting

If you encounter issues with git operations:

1. Check server logs for detailed error messages
2. Ensure the server has proper git credentials
3. Verify permissions on directories
4. Try running git commands manually as the same user that runs the web server

For content loading issues:

1. Check network requests in browser dev tools
2. Verify the authentication token is being passed correctly
3. Check API response for error details