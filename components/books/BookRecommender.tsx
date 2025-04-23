import React, { useState } from 'react';
import { Book } from '@/types/book';
import { BookRecommendationInput } from '@/lib/ai/book-recommender';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface BookRecommenderProps {
  books: Book[];
  onViewBook: (book: Book) => void;
}

interface Recommendation {
  book: Book;
  score: number;
  reasonShort: string;
  reasonDetailed: string;
}

const BookRecommender: React.FC<BookRecommenderProps> = ({ books, onViewBook }) => {
  // State for recommendations
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null);
  
  // Using OpenAI as the only provider
  const aiProvider = 'openai';
  
  // State for UI view
  const [currentView, setCurrentView] = useState<'input' | 'results'>('input');
  
  // State for user preferences
  const [genres, setGenres] = useState<string[]>([]);
  const [genreInput, setGenreInput] = useState('');
  const [moodInput, setMoodInput] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [similarBookId, setSimilarBookId] = useState('');
  const [maxResults, setMaxResults] = useState(5);
  
  // Extract unique genres from books
  const allGenres = React.useMemo(() => {
    const genreSet = new Set<string>();
    books.forEach(book => {
      if (book.categories) {
        book.categories.forEach(category => genreSet.add(category));
      }
      if (book.genres) {
        book.genres.forEach(genre => genreSet.add(genre));
      }
    });
    return Array.from(genreSet).sort();
  }, [books]);
  
  // Handle adding a genre to the list
  const handleAddGenre = (e: React.FormEvent) => {
    e.preventDefault();
    if (genreInput && !genres.includes(genreInput)) {
      setGenres([...genres, genreInput]);
      setGenreInput('');
    }
  };
  
  // Handle removing a genre from the list
  const handleRemoveGenre = (genre: string) => {
    setGenres(genres.filter(g => g !== genre));
  };
  
  // Handle generating recommendations
  const handleGetRecommendations = async () => {
    if (!genres.length && !moodInput && !topicInput && !similarBookId) {
      toast.error('Please provide at least one preference');
      return;
    }
    
    setLoading(true);
    
    try {
      // Get selected similar book if any
      const similarBook = similarBookId ? books.find(b => b.id === similarBookId) : undefined;
      
      // Build preferences object
      const preferences: BookRecommendationInput = {
        favoriteGenres: genres.length > 0 ? genres : undefined,
        interestTopics: topicInput ? topicInput.split(',').map(t => t.trim()) : undefined,
        specificMood: moodInput || undefined,
        similarToBook: similarBook,
        maxResults
      };
      
      // Call the AI API
      const response = await fetch('/api/ai/book-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          preferences,
          provider: aiProvider,
          temperature: 0.3
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate recommendations');
      }
      
      setRecommendations(result.recommendations);
      setCurrentView('results');
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to get recommendations');
    } finally {
      setLoading(false);
    }
  };
  
  // Reset the form and return to input view
  const handleReset = () => {
    setGenres([]);
    setGenreInput('');
    setMoodInput('');
    setTopicInput('');
    setSimilarBookId('');
    setCurrentView('input');
    setRecommendations([]);
  };
  
  // Toggle expanded view for a recommendation
  const toggleExpandRecommendation = (bookId: string) => {
    if (expandedRecommendation === bookId) {
      setExpandedRecommendation(null);
    } else {
      setExpandedRecommendation(bookId);
    }
  };
  
  return (
    <div className="my-8 max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">AI Book Recommendations</h2>
        
        {currentView === 'input' ? (
          <div>
            <p className="text-gray-600 mb-6">
              Let our AI recommend books based on your preferences. The more details you provide, the better the recommendations!
            </p>
            
            <div className="space-y-6">
              {/* Genre Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Genres You Enjoy
                </label>
                <div className="flex items-center">
                  <select
                    value={genreInput}
                    onChange={(e) => setGenreInput(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-l-md"
                  >
                    <option value="">Select a genre</option>
                    {allGenres.map((genre) => (
                      <option key={genre} value={genre}>
                        {genre}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddGenre}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    disabled={!genreInput}
                  >
                    Add
                  </button>
                </div>
                
                {genres.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {genres.map((genre) => (
                      <span
                        key={genre}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        {genre}
                        <button
                          type="button"
                          onClick={() => handleRemoveGenre(genre)}
                          className="flex-shrink-0 ml-1.5 inline-flex text-indigo-500 focus:outline-none"
                        >
                          <span className="sr-only">Remove {genre}</span>
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Mood/Theme */}
              <div>
                <label htmlFor="mood" className="block text-sm font-medium text-gray-700 mb-1">
                  Mood or Theme
                </label>
                <input
                  type="text"
                  id="mood"
                  value={moodInput}
                  onChange={(e) => setMoodInput(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g., uplifting, dark, introspective, adventurous"
                />
              </div>
              
              {/* Topics of Interest */}
              <div>
                <label htmlFor="topics" className="block text-sm font-medium text-gray-700 mb-1">
                  Topics of Interest (comma-separated)
                </label>
                <input
                  type="text"
                  id="topics"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g., time travel, philosophy, space exploration"
                />
              </div>
              
              {/* Similar to Book */}
              <div>
                <label htmlFor="similar-book" className="block text-sm font-medium text-gray-700 mb-1">
                  Similar to a Book You Enjoyed
                </label>
                <select
                  id="similar-book"
                  value={similarBookId}
                  onChange={(e) => setSimilarBookId(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Select a book (optional)</option>
                  {books
                    .filter(book => book.status === 'read' && book.userRating && book.userRating >= 4)
                    .sort((a, b) => a.title.localeCompare(b.title))
                    .map((book) => (
                      <option key={book.id} value={book.id}>
                        {book.title} by {book.authors.join(', ')}
                      </option>
                    ))}
                </select>
              </div>
              

              
              {/* Number of Recommendations */}
              <div>
                <label htmlFor="max-results" className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Recommendations
                </label>
                <input
                  type="number"
                  id="max-results"
                  value={maxResults}
                  onChange={(e) => setMaxResults(Math.max(1, Math.min(10, parseInt(e.target.value))))}
                  min="1"
                  max="10"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleGetRecommendations}
                  disabled={loading || (!genres.length && !moodInput && !topicInput && !similarBookId)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    'Get Recommendations'
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Your Personalized Recommendations</h3>
              <button
                type="button"
                onClick={handleReset}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Start Over
              </button>
            </div>
            
            {recommendations.length === 0 ? (
              <p className="text-gray-600">No recommendations found. Please try different preferences.</p>
            ) : (
              <div className="space-y-6">
                {recommendations.map((rec) => (
                  <div key={rec.book.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row">
                        {/* Book Cover */}
                        <div className="flex-shrink-0 sm:mr-6 mb-4 sm:mb-0">
                          <div className="w-full sm:w-32 h-48 bg-gray-200 rounded overflow-hidden">
                            {rec.book.imageLinks?.thumbnail ? (
                              <img
                                src={rec.book.imageLinks.thumbnail}
                                alt={`Cover for ${rec.book.title}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                No Cover
                              </div>
                            )}
                          </div>
                          <div className="mt-2 flex justify-center">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                              Match: {rec.score}%
                            </span>
                          </div>
                        </div>
                        
                        {/* Book Info */}
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900">{rec.book.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">by {rec.book.authors.join(', ')}</p>
                          
                          {rec.book.categories && rec.book.categories.length > 0 && (
                            <div className="mb-3 flex flex-wrap gap-1">
                              {rec.book.categories.slice(0, 3).map((category) => (
                                <span key={category} className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                                  {category}
                                </span>
                              ))}
                              {rec.book.categories.length > 3 && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800">
                                  +{rec.book.categories.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                          
                          <p className="text-sm text-gray-700 mb-3">{rec.reasonShort}</p>
                          
                          <div className={`${expandedRecommendation === rec.book.id ? 'block' : 'hidden'} mt-2`}>
                            <p className="text-sm text-gray-600 mb-3">{rec.reasonDetailed}</p>
                            
                            {rec.book.description && (
                              <div className="mt-3">
                                <h5 className="text-sm font-semibold text-gray-700 mb-1">Description</h5>
                                <p className="text-xs text-gray-600">
                                  {rec.book.description.length > 200 
                                    ? `${rec.book.description.substring(0, 200)}...`
                                    : rec.book.description
                                  }
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-4 flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => toggleExpandRecommendation(rec.book.id)}
                              className="text-xs text-indigo-600 hover:text-indigo-800"
                            >
                              {expandedRecommendation === rec.book.id ? 'Show Less' : 'Show More'}
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => onViewBook(rec.book)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookRecommender;
