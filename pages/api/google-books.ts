import type { NextApiResponse } from "next";
import { withCORSAuth, AuthenticatedRequest } from "@/lib/api/middleware";

// Define the structure for the API response
type GoogleBooksApiResponse = {
  success: boolean;
  data?: any[]; // Array of found books
  error?: string;
};

// Helper function to map Google Books API item to our Book structure (simplified)
// TODO: Enhance this mapping to match your exact `Book` type fields
function mapGoogleBookToBook(item: any): any {
  const volumeInfo = item.volumeInfo || {};
  return {
    googleBooksId: item.id,
    title: volumeInfo.title,
    authors: volumeInfo.authors || [],
    publisher: volumeInfo.publisher,
    publishedDate: volumeInfo.publishedDate,
    description: volumeInfo.description,
    pageCount: volumeInfo.pageCount,
    categories: volumeInfo.categories || [],
    averageRating: volumeInfo.averageRating,
    imageLinks: volumeInfo.imageLinks,
    // You might need to derive status, notes, etc., or leave them for the user to add
  };
}

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<GoogleBooksApiResponse>,
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, error: "Method Not Allowed" });
  }

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (!apiKey) {
    console.error(
      "Google Books API Key is missing from environment variables.",
    );
    return res
      .status(500)
      .json({
        success: false,
        error: "Server configuration error: Missing API key.",
      });
  }

  const { isbn, q } = req.query;
  let maxResultsValue = req.query.maxResults || "10"; // Default to '10'
  if (Array.isArray(maxResultsValue)) {
    maxResultsValue = maxResultsValue[0]; // Take the first element if it's an array
  }

  let googleApiUrl = "";

  if (isbn && typeof isbn === "string") {
    // ISBN Search
    googleApiUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(isbn)}&key=${apiKey}`;
  } else if (q && typeof q === "string") {
    // Query Search (Title/Author)
    googleApiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=${encodeURIComponent(maxResultsValue)}&key=${apiKey}`; // Use validated string
  } else {
    return res
      .status(400)
      .json({
        success: false,
        error: "Missing query parameter: requires isbn or q",
      });
  }

  try {
    console.log(
      `Querying Google Books API: ${googleApiUrl.replace(apiKey, "***")}`,
    ); // Don't log the key
    const googleRes = await fetch(googleApiUrl);

    if (!googleRes.ok) {
      const errorData = await googleRes.json().catch(() => ({})); // Try to get error details
      console.error(`Google Books API error: ${googleRes.status}`, errorData);
      throw new Error(
        `Google Books API request failed with status ${googleRes.status}`,
      );
    }

    const googleData = await googleRes.json();

    if (!googleData.items || googleData.items.length === 0) {
      return res.status(200).json({ success: true, data: [] }); // No results found is not an error
    }

    // Map results to our desired structure
    const books = googleData.items.map(mapGoogleBookToBook);

    return res.status(200).json({ success: true, data: books });
  } catch (error: any) {
    console.error("Error in Google Books API handler:", error);
    return res
      .status(500)
      .json({
        success: false,
        error: `Internal Server Error: ${error.message}`,
      });
  }
}

export default withCORSAuth(handler);
