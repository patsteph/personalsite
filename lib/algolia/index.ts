// Use dynamic import for Algolia to avoid build issues
// This approach works better with Next.js
const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || 'BIG74MXLH5';
const ALGOLIA_API_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || '7a9ce8a20d3d485a2f7d0979acd0a6a1';

// We'll use direct REST API calls - simplest approach that works reliably
const ALGOLIA_API_URL = `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes`;

/**
 * Wrapper for Algolia search with better error handling and logging
 * @param indexName - Name of the Algolia index to search
 * @param query - Search query string
 * @param params - Additional search parameters
 * @returns Search results or empty object on error
 */
export async function searchIndex(indexName: string, query: string = '', params: any = {}) {
  try {
    console.log(`Searching Algolia index '${indexName}' with query: '${query}' and params:`, params);
    
    // Build the search params object in a format Algolia expects
    const searchParams: Record<string, string | number> = {
      query: query
    };
    
    // Add pagination params
    if (params.hitsPerPage) searchParams.hitsPerPage = params.hitsPerPage;
    if (params.page) searchParams.page = params.page;
    
    // Add filters - parse the filter syntax correctly
    if (params.filters && params.filters.trim() !== '') {
      // Algolia expects filters in a specific format
      searchParams.filters = params.filters;
    }
    
    // Convert the params object to a URL parameter string
    const urlParams = new URLSearchParams();
    urlParams.append('x-algolia-api-key', ALGOLIA_API_KEY);
    urlParams.append('x-algolia-application-id', ALGOLIA_APP_ID);
    
    // Correctly format the API request to Algolia using fetch
    const response = await fetch(`${ALGOLIA_API_URL}/${indexName}/query`, {
      method: 'POST',
      headers: {
        'X-Algolia-API-Key': ALGOLIA_API_KEY,
        'X-Algolia-Application-Id': ALGOLIA_APP_ID,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        params: Object.keys(searchParams)
          .map(key => `${key}=${encodeURIComponent(String(searchParams[key]))}`)
          .join('&')
      })
    });
    
    if (!response.ok) {
      throw new Error(`Algolia API error: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`Algolia returned ${result.hits?.length || 0} results`);
    return result;
  } catch (error) {
    console.error('Algolia search error:', error);
    // Return empty results instead of crashing
    return { hits: [], nbHits: 0 };
  }
}

// Convenience functions for specific indices with correct index names
export const booksIndex = {
  search: (query: string, params: any = {}) => searchIndex('algoSearch', query, params)
};

export const blogIndex = {
  search: (query: string, params: any = {}) => searchIndex('personal-website_blog-posts', query, params)
};