import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc,
  deleteDoc,
  Timestamp,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { Book, BookFilter, BookSortOption } from '@/types/book';

const BOOKS_COLLECTION = 'books';

/**
 * Get filtered and sorted books from Firestore
 */
export async function getBooks(
  filter: BookFilter = 'all',
  sortBy: BookSortOption = 'title',
  limitCount?: number
): Promise<Book[]> {
  // Reference to books collection
  const booksCollection = collection(db, BOOKS_COLLECTION);
  
  // Start building the query
  let baseQuery = query(booksCollection);
  
  // Apply status filter if not 'all'
  if (filter !== 'all') {
    baseQuery = query(baseQuery, where('status', '==', filter));
  }
  
  // Apply sorting
  switch (sortBy) {
    case 'author':
      baseQuery = query(baseQuery, orderBy('authors'));
      break;
    case 'genre':
      baseQuery = query(baseQuery, orderBy('categories'));
      break;
    case 'rating':
      baseQuery = query(baseQuery, orderBy('averageRating', 'desc'));
      break;
    default:
      baseQuery = query(baseQuery, orderBy('title'));
  }
  
  // Apply limit if specified
  if (limitCount) {
    baseQuery = query(baseQuery, limit(limitCount));
  }
  
  // Execute query
  const snapshot = await getDocs(baseQuery);
  
  // Convert the documents to Book objects
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      dateAdded: data.dateAdded?.toDate?.() 
        ? data.dateAdded.toDate().toISOString() 
        : data.dateAdded
    } as Book;
  });
}

/**
 * Get a single book by ID
 */
export async function getBookById(id: string): Promise<Book | null> {
  const docRef = doc(db, BOOKS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    dateAdded: data.dateAdded?.toDate?.() 
      ? data.dateAdded.toDate().toISOString() 
      : data.dateAdded
  } as Book;
}

/**
 * Get a book by ISBN
 */
export async function getBookByISBN(isbn: string): Promise<Book | null> {
  const booksCollection = collection(db, BOOKS_COLLECTION);
  const q = query(booksCollection, where('isbn', '==', isbn));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }
  
  const doc = snapshot.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    dateAdded: data.dateAdded?.toDate?.() 
      ? data.dateAdded.toDate().toISOString() 
      : data.dateAdded
  } as Book;
}

/**
 * Fetch book information from Google Books API
 * This is the function that was missing!
 */
export async function fetchBookByISBN(isbn: string): Promise<Partial<Book> | null> {
  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return null;
    }
    
    const bookInfo = data.items[0].volumeInfo;
    
    return {
      title: bookInfo.title,
      authors: bookInfo.authors || ['Unknown'],
      publisher: bookInfo.publisher,
      publishedDate: bookInfo.publishedDate,
      description: bookInfo.description,
      pageCount: bookInfo.pageCount,
      categories: bookInfo.categories,
      averageRating: bookInfo.averageRating,
      ratingsCount: bookInfo.ratingsCount,
      imageLinks: bookInfo.imageLinks,
      isbn
    };
  } catch (error) {
    console.error('Error fetching book from Google Books API:', error);
    return null;
  }
}

/**
 * Add a new book to the collection
 */
export async function addBook(bookData: Omit<Book, 'id'>): Promise<string> {
  const dataToAdd = {
    ...bookData,
    dateAdded: bookData.dateAdded ? new Date(bookData.dateAdded) : new Date()
  };
  
  const docRef = await addDoc(collection(db, BOOKS_COLLECTION), dataToAdd);
  return docRef.id;
}

/**
 * Update an existing book
 */
export async function updateBook(id: string, updates: Partial<Book>): Promise<void> {
  const docRef = doc(db, BOOKS_COLLECTION, id);
  
  // Remove the id field as it's not needed for the update
  const { id: _, ...updatesWithoutId } = updates;
  
  await updateDoc(docRef, updatesWithoutId);
}

/**
 * Delete a book from the collection
 */
export async function deleteBook(id: string): Promise<void> {
  const docRef = doc(db, BOOKS_COLLECTION, id);
  await deleteDoc(docRef);
}

/**
 * Get book statistics by status
 */
export async function getBookStats(): Promise<{total: number, read: number, reading: number, toRead: number}> {
  const booksRef = collection(db, BOOKS_COLLECTION);
  
  // Get total count
  const totalSnapshot = await getDocs(booksRef);
  const total = totalSnapshot.size;
  
  // Get read count
  const readQuery = query(booksRef, where('status', '==', 'read'));
  const readSnapshot = await getDocs(readQuery);
  const read = readSnapshot.size;
  
  // Get reading count
  const readingQuery = query(booksRef, where('status', '==', 'reading'));
  const readingSnapshot = await getDocs(readingQuery);
  const reading = readingSnapshot.size;
  
  // Get toRead count
  const toReadQuery = query(booksRef, where('status', '==', 'toRead'));
  const toReadSnapshot = await getDocs(toReadQuery);
  const toRead = toReadSnapshot.size;
  
  return {
    total,
    read,
    reading,
    toRead
  };
}