import { GetStaticProps } from 'next';
import Layout from '@/components/layout/Layout';
// Removed getSignalsServerSide import. Use server-side API or stubbed logic.
import { Newsletter, Article, Signal } from '@/types';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { Timestamp, QueryDocumentSnapshot } from 'firebase-admin/firestore';

type SignalsPageProps = {
  newsletters: Newsletter[];
  articles: Article[];
  error?: string;
};

export default function SignalsPage({ newsletters, articles, error }: SignalsPageProps) {
  // Log received props in the browser console
  console.log('SignalsPage Props:', { newsletters, articles, error });

  if (error) {
    return (
      <Layout title="Signals - Recommendations" section="signals">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-accent mb-8">Signals</h1>
          <p className="text-red-500">Error loading signals: {error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Signals - Recommendations" section="signals">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-accent mb-8">Signals</h1>
        
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-accent mb-6">Newsletters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newsletters.map(newsletter => (
              <div key={newsletter.id} className="signal-card-container">
                <a 
                  href={newsletter.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-steel-blue hover:text-accent transition-colors"
                >
                  <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-steel-blue mb-1 hover:underline">
                        {newsletter.title}
                      </h3>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <div className="mb-1">
                          <span className="font-medium">Publisher:</span> {newsletter.publisher} • 
                          <span className="ml-1 capitalize">{newsletter.frequency}</span>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 text-sm mb-3">
                        {newsletter.description.length > 120 
                          ? `${newsletter.description.substring(0, 120)}...` 
                          : newsletter.description}
                      </p>
                      
                      {newsletter.tags && newsletter.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {newsletter.tags.slice(0, 3).map(tag => (
                            <span 
                              key={tag} 
                              className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {newsletter.dateAdded && newsletter.dateAdded !== 'null' && newsletter.dateAdded !== 'undefined'
                          ? `Added ${new Date(newsletter.dateAdded).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})}`
                          : 'Recently added'
                        }
                      </span>
                      <span className="text-steel-blue text-sm hover:underline">
                        View Newsletter →
                      </span>
                    </div>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </section>
        
        <section>
          <h2 className="text-2xl font-bold text-accent mb-6">Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map(article => (
              <div key={article.id} className="signal-card-container">
                <a 
                  href={article.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-steel-blue hover:text-accent transition-colors"
                >
                  <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-steel-blue mb-1 hover:underline">
                        {article.title}
                      </h3>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <div className="mb-1">
                          <span className="font-medium">By:</span> {article.author} • 
                          <span className="ml-1 font-medium">Source:</span> {article.source}
                          {article.readingTime && (
                            <span className="ml-1">• {article.readingTime} min read</span>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-gray-700 text-sm mb-3">
                        {article.description.length > 120 
                          ? `${article.description.substring(0, 120)}...` 
                          : article.description}
                      </p>
                      
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {article.tags.slice(0, 3).map(tag => (
                            <span 
                              key={tag} 
                              className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {article.dateAdded && article.dateAdded !== 'null' && article.dateAdded !== 'undefined'
                          ? `Added ${new Date(article.dateAdded).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})}`
                          : 'Recently added'
                        }
                      </span>
                      <span className="text-steel-blue text-sm hover:underline">
                        View Article →
                      </span>
                    </div>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<SignalsPageProps> = async () => {
  console.log('signals.tsx getStaticProps: Fetching signals from Firestore...');
  try {
    const firestore = getAdminFirestore();
    const signalsRef = firestore.collection('signals');
    // Fetch all signals, order by dateAdded descending
    const snapshot = await signalsRef.orderBy('dateAdded', 'desc').get();

    let newsletters: Newsletter[] = [];
    let articles: Article[] = [];

    if (!snapshot.empty) {
      snapshot.docs.forEach((doc: QueryDocumentSnapshot) => {
        // Use Record<string, any> for safer property access before specific typing
        const data = doc.data() as Record<string, any>; 
        const id = doc.id;

        // Helper function to safely convert potential Timestamp object to ISO string
        const toISOString = (dateValue: any): string | null => {
          if (!dateValue) return null;
          // Check for Firestore Timestamp structure (Admin SDK might use _seconds)
          const seconds = dateValue.seconds ?? dateValue._seconds;
          const nanoseconds = dateValue.nanoseconds ?? dateValue._nanoseconds;
          if (typeof seconds === 'number' && typeof nanoseconds === 'number') {
            return new Date(seconds * 1000 + nanoseconds / 1000000).toISOString();
          }
          // Check if it's already a Date object or ISO string
          if (dateValue instanceof Date) return dateValue.toISOString();
          if (typeof dateValue === 'string') return dateValue; // Assume it's already ISO
          return null; // Cannot convert
        };

        // Basic common serialization
        const serializedData = {
          id,
          title: data.title || 'Untitled Signal',
          url: data.url || '#',
          description: data.description || 'No description provided.',
          tags: data.tags || [],
          // Use helper for safe Timestamp conversion
          dateAdded: toISOString(data.dateAdded),
          featured: data.featured || false,
          type: data.type || 'article', // Default to article if type is missing
        };

        // Type-specific data and casting
        if (serializedData.type === 'newsletter') {
          newsletters.push({
            ...serializedData,
            // Access properties directly from 'data' now it's Record<string, any>
            publisher: data.publisher || 'Unknown Publisher',
            frequency: data.frequency || 'unknown',
            subscriptionUrl: data.subscriptionUrl,
            type: 'newsletter', // Ensure type is correct
          } as Newsletter);
        } else if (serializedData.type === 'article') {
          articles.push({
            ...serializedData,
            author: data.author || 'Unknown Author',
            source: data.source || 'Unknown Source',
            // Use helper for safe Timestamp conversion
            publishDate: toISOString(data.publishDate),
            // Ensure readingTime is null if undefined, otherwise keep its value
            readingTime: data.readingTime === undefined ? null : data.readingTime,
            type: 'article', // Ensure type is correct
          } as Article);
        }
      });
    }

    console.log(`signals.tsx getStaticProps: Fetched ${newsletters.length} newsletters and ${articles.length} articles.`);

    return {
      props: {
        newsletters,
        articles,
      },
      revalidate: 3600, // Revalidate every hour
    };
  } catch (error: any) {
    console.error('signals.tsx getStaticProps: Error fetching signals:', error);
    return {
      props: {
        newsletters: [],
        articles: [],
        error: `Failed to load signals: ${error.message || 'Unknown error'}`, // Pass error message
      },
      revalidate: 60, // Revalidate quickly after error
    };
  }
};