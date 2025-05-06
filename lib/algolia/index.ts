// Direct Algolia API client using fetch instead of the algoliasearch library
const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || 'BIG74MXLH5';
const ALGOLIA_API_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || '7a9ce8a20d3d485a2f7d0979acd0a6a1';
// Changed from -dsn to just standard endpoint
const ALGOLIA_BASE_URL = `https://${ALGOLIA_APP_ID}.algolia.net/1/indexes`;

// Generic search function for any index
export async function searchIndex(indexName: string, query: string = '', params: any = {}) {
  try {
    // Create a params object with all search parameters
    const requestParams = {
      query,
      ...params
    };
    
    // Algolia expects the request format to be different
    const response = await fetch(`${ALGOLIA_BASE_URL}/${indexName}/query`, {
      method: 'POST',
      headers: {
        'X-Algolia-API-Key': ALGOLIA_API_KEY,
        'X-Algolia-Application-Id': ALGOLIA_APP_ID,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        params: new URLSearchParams(requestParams).toString()
      })
    });
    
    if (!response.ok) {
      console.error(`Algolia API error: ${response.status} ${response.statusText}`);
      throw new Error(`Algolia API error: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Algolia search error:', error);
    // Return empty results instead of crashing
    return { hits: [], nbHits: 0 };
  }
}

// Convenience functions for specific indices
export const booksIndex = {
  search: (query: string, params: any = {}) => searchIndex('books', query, params)
};

export const blogIndex = {
  search: (query: string, params: any = {}) => searchIndex('blog-posts', query, params)
};