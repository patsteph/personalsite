// Direct Algolia API client using fetch instead of the algoliasearch library
const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || 'BIG74MXLH5';
const ALGOLIA_API_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || '7a9ce8a20d3d485a2f7d0979acd0a6a1';
// Try both standard endpoints - first the search API, then the regular API if that fails
const ALGOLIA_SEARCH_URL = `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes`;
const ALGOLIA_REGULAR_URL = `https://${ALGOLIA_APP_ID}.algolia.net/1/indexes`;

// Generic search function for any index
export async function searchIndex(indexName: string, query: string = '', params: any = {}) {
  try {
    console.log(`Searching Algolia index '${indexName}' with query: '${query}' and params:`, params);
    
    // Create the params string for Algolia - this is the correct format they expect
    const searchParams = new URLSearchParams();
    searchParams.append('query', query);
    
    // Add other params
    if (params.hitsPerPage) searchParams.append('hitsPerPage', params.hitsPerPage.toString());
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.filters) searchParams.append('filters', params.filters);
    if (params.facets) searchParams.append('facets', JSON.stringify(params.facets));
    
    // Format request to match Algolia API requirements
    const response = await fetch(`${ALGOLIA_SEARCH_URL}/${indexName}/query`, {
      method: 'POST',
      headers: {
        'X-Algolia-API-Key': ALGOLIA_API_KEY,
        'X-Algolia-Application-Id': ALGOLIA_APP_ID,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        params: searchParams.toString()
      })
    });
    
    if (!response.ok) {
      console.error(`Algolia API error: ${response.status} ${response.statusText}`);
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

// Convenience functions for specific indices
// Use the correct index name as specified
export const booksIndex = {
  search: (query: string, params: any = {}) => searchIndex('algoSearch', query, params)
};

export const blogIndex = {
  search: (query: string, params: any = {}) => searchIndex('personal-website_blog-posts', query, params)
};