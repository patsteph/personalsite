// lib/site-content.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
// Use require instead of import for better compatibility
const remark = require('remark');
const html = require('remark-html');

/**
 * Represents the structure of site content
 */
export interface SiteContent {
  title: string;
  subtitle?: string;
  contentHtml: string;
  contentMarkdown: string;
}

/**
 * Get content for a specific section of the site
 * @param section The section name (welcome, books, blog, cv, signals, contact)
 * @returns The parsed content or null if not found
 */
export async function getSiteContent(section: string): Promise<SiteContent | null> {
  try {
    const filePath = path.join(process.cwd(), 'content/site', `${section}.md`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.warn(`Content file not found for section: ${section}`);
      return null;
    }
    
    // Read markdown file
    const fileContents = fs.readFileSync(filePath, 'utf8');
    
    // Parse title and subtitle from markdown
    const contentLines = fileContents.split('\n');
    let title = section.charAt(0).toUpperCase() + section.slice(1);
    let subtitle = '';
    let contentMarkdown = fileContents;
    
    // Extract title from H1 if present
    if (contentLines[0] && contentLines[0].startsWith('# ')) {
      title = contentLines[0].substring(2);
      contentMarkdown = contentLines.slice(1).join('\n');
    }
    
    // Extract subtitle from H2 if present (after title)
    if (contentLines[1] && contentLines[1].startsWith('## ')) {
      subtitle = contentLines[1].substring(3);
      contentMarkdown = contentLines.slice(2).join('\n');
    }
    
    // Process the markdown content to HTML
    const processedContent = await remark()
      .use(html, { sanitize: false }) // Allow HTML in markdown
      .process(contentMarkdown.trim());
    const contentHtml = processedContent.toString();
    
    return {
      title,
      subtitle,
      contentHtml,
      contentMarkdown: contentMarkdown.trim()
    };
  } catch (error) {
    console.error(`Error getting site content for ${section}:`, error);
    return null;
  }
}

/**
 * Get content for multiple sections at once
 * @param sections Array of section names
 * @returns Object with section content
 */
export async function getMultipleSiteContent(sections: string[]): Promise<Record<string, SiteContent | null>> {
  const contentPromises = sections.map(async (section) => {
    const content = await getSiteContent(section);
    return { section, content };
  });
  
  const contentResults = await Promise.all(contentPromises);
  
  return contentResults.reduce((acc, { section, content }) => {
    acc[section] = content;
    return acc;
  }, {} as Record<string, SiteContent | null>);
}