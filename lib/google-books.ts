// Google Books API client
const GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes';

/**
 * Search Google Books API for a book by title and author
 * @param title The book title to search for
 * @param author Optional author name to narrow results
 * @returns Book details from Google Books API
 */
export async function searchBook(title: string, author?: string) {
  try {
    let query = `intitle:${encodeURIComponent(title)}`;
    if (author) {
      query += `+inauthor:${encodeURIComponent(author)}`;
    }
    
    const response = await fetch(`${GOOGLE_BOOKS_API_URL}?q=${query}&maxResults=1`);
    
    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.items && data.items.length > 0 ? data.items[0] : null;
  } catch (error) {
    console.error('Error searching Google Books:', error);
    return null;
  }
}

/**
 * Get detailed book information from Google Books API by ID
 * @param bookId Google Books volume ID
 * @returns Detailed book information
 */
export async function getBookById(bookId: string) {
  try {
    const response = await fetch(`${GOOGLE_BOOKS_API_URL}/${bookId}`);
    
    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching book details:', error);
    return null;
  }
}

/**
 * Extract key book information from Google Books API response
 * @param googleBook The Google Books API response
 * @returns Formatted book details
 */
export function formatGoogleBookData(googleBook: any) {
  if (!googleBook || !googleBook.volumeInfo) {
    return null;
  }
  
  const volumeInfo = googleBook.volumeInfo;
  
  return {
    id: googleBook.id,
    title: volumeInfo.title,
    subtitle: volumeInfo.subtitle,
    authors: volumeInfo.authors,
    publisher: volumeInfo.publisher,
    publishedDate: volumeInfo.publishedDate,
    description: volumeInfo.description,
    pageCount: volumeInfo.pageCount,
    categories: volumeInfo.categories,
    averageRating: volumeInfo.averageRating,
    ratingsCount: volumeInfo.ratingsCount,
    imageLinks: volumeInfo.imageLinks,
    language: volumeInfo.language,
    infoLink: volumeInfo.infoLink,
    previewLink: volumeInfo.previewLink
  };
}
