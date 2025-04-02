// lib/site-content.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
// Removing remark and remark-html dependencies since they're ESM-only
// We'll use a simpler approach for HTML conversion

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
    
    // Simple markdown to HTML conversion for basic formatting
    // This is a very basic implementation that handles the most common markdown elements
    const contentHtml = markdownToHtml(contentMarkdown.trim());
    
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
 * Basic markdown to HTML converter
 * Handles common markdown elements without external dependencies
 */
function markdownToHtml(markdown: string): string {
  // Replace headings (## Heading -> <h2>Heading</h2>)
  let html = markdown
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>');
  
  // Replace bold and italic
  html = html
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>');
  
  // Replace links [text](url)
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
  
  // Replace unordered lists
  html = html.replace(/^\s*[-*+]\s+(.*$)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gm, '<ul>$1</ul>');
  
  // Replace ordered lists (simple)
  html = html.replace(/^\s*\d+\.\s+(.*$)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gm, '<ol>$1</ol>');
  
  // Replace paragraphs (lines with content)
  html = html.replace(/^(?!<[a-z][a-z0-9]*>)(.*$)/gm, function(m) {
    if (m.trim() === '') return '';
    return '<p>' + m + '</p>';
  });
  
  // Replace line breaks
  html = html.replace(/\n\s*\n/g, '<br>');
  
  return html;
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