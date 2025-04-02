// pages/api/site-content.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '@/lib/firebase-admin';
// Use require instead of import for better compatibility
const { Octokit } = require('@octokit/rest');

// Define response type
type SiteContentResponse = {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

// Define allowed content pages/sections
const ALLOWED_SECTIONS = ['welcome', 'books', 'blog', 'cv', 'signals', 'contact'];

// Map sections to their file paths in the repository
const SECTION_FILE_PATHS: Record<string, string> = {
  welcome: 'content/site/welcome.md',
  books: 'content/site/books.md',
  blog: 'content/site/blog.md',
  cv: 'content/site/cv.md',
  signals: 'content/site/signals.md',
  contact: 'content/site/contact.md'
};

// GitHub repository information - use environment variables in production
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'patsteph';
const GITHUB_REPO = process.env.GITHUB_REPO || 'personal-website';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // This must be set in environment variables

// Initialize Octokit (GitHub API client)
const octokit = new Octokit({
  auth: GITHUB_TOKEN
});

// Authenticate and authorize the request
async function authenticateRequest(req: NextApiRequest) {
  try {
    // Get the auth token from the request headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No authentication token provided');
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    // You can add additional authorization checks here
    // For example, checking if the user has admin privileges
    
    return decodedToken;
  } catch (error) {
    console.error('Authentication error:', error);
    throw new Error('Authentication failed');
  }
}

// Get content for a specific section from GitHub repository
async function getContent(section: string) {
  try {
    if (!ALLOWED_SECTIONS.includes(section)) {
      throw new Error('Invalid section');
    }

    if (!GITHUB_TOKEN) {
      throw new Error('GitHub token is not configured');
    }

    const filePath = SECTION_FILE_PATHS[section];
    
    try {
      // Try to get the file from GitHub
      const response = await octokit.repos.getContent({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        path: filePath,
        ref: GITHUB_BRANCH
      });
      
      // GitHub API returns file content as base64 encoded string
      if ('content' in response.data && 'encoding' in response.data) {
        const data = response.data as { content: string; encoding: string; sha: string };
        if (data.encoding === 'base64') {
          const content = Buffer.from(data.content, 'base64').toString('utf8');
          
          // Get commit information for last modified date
          const commits = await octokit.repos.listCommits({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            path: filePath,
            per_page: 1
          });
          
          const lastModified = commits.data.length > 0 && commits.data[0].commit.author?.date 
            ? new Date(commits.data[0].commit.author.date) 
            : null;
            
          return {
            content,
            lastModified,
            sha: data.sha
          };
        }
      }
      
      throw new Error('Invalid response format from GitHub API');
    } catch (error: any) {
      // If file doesn't exist (404), create a default content
      if (error.status === 404) {
        // Create default content
        const defaultContent = `# ${section.charAt(0).toUpperCase() + section.slice(1)}\n\nAdd content here.`;
        
        // Create the file in the repository
        await octokit.repos.createOrUpdateFileContents({
          owner: GITHUB_OWNER,
          repo: GITHUB_REPO,
          path: filePath,
          message: `Create default ${section} content`,
          content: Buffer.from(defaultContent).toString('base64'),
          branch: GITHUB_BRANCH
        });
        
        return {
          content: defaultContent,
          lastModified: new Date(),
          sha: '' // New file doesn't have a sha yet
        };
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Error getting content:', error);
    throw error;
  }
}

// Update content for a specific section in GitHub repository
async function updateContent(section: string, content: string, title: string, subtitle?: string, sha?: string) {
  try {
    if (!ALLOWED_SECTIONS.includes(section)) {
      throw new Error('Invalid section');
    }

    if (!GITHUB_TOKEN) {
      throw new Error('GitHub token is not configured');
    }

    const filePath = SECTION_FILE_PATHS[section];
    
    // Format content with title and subtitle
    let formattedContent = `# ${title}\n`;
    if (subtitle) {
      formattedContent += `## ${subtitle}\n`;
    }
    formattedContent += `\n${content}`;
    
    // If we don't have the sha, try to get it first
    if (!sha) {
      try {
        const fileInfo = await octokit.repos.getContent({
          owner: GITHUB_OWNER,
          repo: GITHUB_REPO,
          path: filePath,
          ref: GITHUB_BRANCH
        });
        
        if ('sha' in fileInfo.data) {
          sha = fileInfo.data.sha as string;
        }
      } catch (error) {
        // File doesn't exist yet, that's ok
      }
    }
    
    // Update the file in the repository
    await octokit.repos.createOrUpdateFileContents({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: filePath,
      message: `Update ${section} content`,
      content: Buffer.from(formattedContent).toString('base64'),
      sha, // Required for updating existing files
      branch: GITHUB_BRANCH
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating content:', error);
    throw error;
  }
}

// Create a pull request for the changes
async function createPullRequest(message: string) {
  try {
    if (!GITHUB_TOKEN) {
      throw new Error('GitHub token is not configured');
    }

    // Generate a unique branch name for this set of changes
    const timestamp = new Date().getTime();
    const branchName = `content-update-${timestamp}`;
    
    // Get the reference to the current branch
    const reference = await octokit.git.getRef({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      ref: `heads/${GITHUB_BRANCH}`
    });
    
    // Create a new branch
    await octokit.git.createRef({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      ref: `refs/heads/${branchName}`,
      sha: reference.data.object.sha
    });
    
    // Create a pull request
    const pullRequest = await octokit.pulls.create({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      title: message,
      head: branchName,
      base: GITHUB_BRANCH,
      body: `Content updates from the admin dashboard.
      
Changes include updates to site content files in the content/site directory.

This PR was automatically generated by the site content management system.`,
    });
    
    return { 
      success: true, 
      message: 'Pull request created successfully', 
      data: {
        pullRequestUrl: pullRequest.data.html_url,
        pullRequestNumber: pullRequest.data.number
      }
    };
  } catch (error) {
    console.error('Error creating pull request:', error);
    throw error;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SiteContentResponse>
) {
  try {
    // Check if GitHub token is configured
    if (!GITHUB_TOKEN) {
      return res.status(500).json({ 
        success: false, 
        error: 'GitHub token is not configured. Please set the GITHUB_TOKEN environment variable.' 
      });
    }
    
    // Authenticate the request
    await authenticateRequest(req);
    
    // GET request to retrieve content
    if (req.method === 'GET') {
      const { section } = req.query;
      
      if (!section || typeof section !== 'string') {
        return res.status(400).json({ success: false, error: 'Section parameter is required' });
      }
      
      const data = await getContent(section);
      return res.status(200).json({ success: true, data });
    }
    
    // POST request to update content
    else if (req.method === 'POST') {
      const { section, content, title, subtitle, sha } = req.body;
      
      if (!section || !content || !title) {
        return res.status(400).json({ success: false, error: 'Section, content, and title are required' });
      }
      
      await updateContent(section, content, title, subtitle, sha);
      return res.status(200).json({ success: true, message: 'Content updated successfully' });
    }
    
    // PUT request to create a pull request
    else if (req.method === 'PUT') {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ success: false, error: 'Commit message is required' });
      }
      
      const result = await createPullRequest(message);
      return res.status(200).json({ 
        success: true, 
        message: result.message,
        data: result.data
      });
    }
    
    // Method not allowed
    else {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('API error:', error);
    return res.status(500).json({ success: false, error: error.message || 'An error occurred' });
  }
}