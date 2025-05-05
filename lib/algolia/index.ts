// Direct Algolia API client using fetch instead of the algoliasearch library
const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || 'BIG74MXLH5'; // Hardcode for reliability
const ALGOLIA_API_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || '7a9ce8a20d3d485a2f7d0979acd0a6a1'; // Hardcode for reliability
const ALGOLIA_BASE_URL = `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes`;

// Generic search function for any index
export async function searchIndex(indexName: string, query: string = '', params: any = {}) {
  const queryParams = new URLSearchParams({
    query,
    ...params
  }).toString();
  
  const response = await fetch(`${ALGOLIA_BASE_URL}/${indexName}/query`, {
    method: 'POST',
    headers: {
      'X-Algolia-API-Key': ALGOLIA_API_KEY,
      'X-Algolia-Application-Id': ALGOLIA_APP_ID,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      params: queryParams
    })
  });
  
  if (!response.ok) {
    throw new Error(`Algolia API error: ${response.statusText}`);
  }
  
  return response.json();
}

// Convenience functions for specific indices
export const booksIndex = {
  search: (query: string, params: any = {}) => searchIndex('books', query, params)
};

export const blogIndex = {
  search: (query: string, params: any = {}) => searchIndex('blog-posts', query, params)
};