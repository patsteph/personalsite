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
    
    // Build the params string for Algolia in their required format
    const searchParams: Record<string, any> = {
      query: query
    };
    
    // Add pagination params
    if (params.hitsPerPage) searchParams.hitsPerPage = params.hitsPerPage;
    if (params.page) searchParams.page = params.page;
    
    // Add filters - this needs special handling
    if (params.filters && params.filters.trim() !== '') {
      searchParams.filters = params.filters;
    }
    
    // Add facets if present
    if (params.facets && Array.isArray(params.facets) && params.facets.length > 0) {
      searchParams.facets = params.facets;
    }

    // Create the request body in Algolia's expected format
    const requestBody = {
      params: new URLSearchParams(searchParams).toString()
    };
    
    // Format request to match Algolia API requirements
    // This is the correct format for Algolia API
    const response = await fetch(`${ALGOLIA_SEARCH_URL}/${indexName}/query`, {
      method: 'POST',
      headers: {
        'X-Algolia-API-Key': ALGOLIA_API_KEY,
        'X-Algolia-Application-Id': ALGOLIA_APP_ID,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      console.error(`Algolia API error: ${response.status} ${response.statusText}`);
      // Try with the regular URL if search URL fails
      console.log('Retrying with regular Algolia URL...');
      const retryResponse = await fetch(`${ALGOLIA_REGULAR_URL}/${indexName}/query`, {
        method: 'POST',
        headers: {
          'X-Algolia-API-Key': ALGOLIA_API_KEY,
          'X-Algolia-Application-Id': ALGOLIA_APP_ID,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!retryResponse.ok) {
        throw new Error(`Algolia API error: ${retryResponse.statusText}`);
      }
      
      const retryResult = await retryResponse.json();
      console.log(`Algolia retry returned ${retryResult.hits?.length || 0} results`);
      return retryResult;
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