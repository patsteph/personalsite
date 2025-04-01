import { GetStaticProps } from 'next';
import Layout from '@/components/layout/Layout';
import { getSignalsServerSide } from '@/lib/firebase-admin';
import { Signal, Newsletter, Article } from '@/types';

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
          <h1 className="text-3xl font-bold mb-8">Signals</h1>
          <p className="text-red-500">Error loading signals: {error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Signals - Recommendations" section="signals">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Signals</h1>
        
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Newsletters</h2>
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
                        Added {new Date(newsletter.dateAdded).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})}
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
          <h2 className="text-2xl font-semibold mb-4">Articles</h2>
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
                        Added {new Date(article.dateAdded).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})}
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

export const getStaticProps: GetStaticProps = async () => {
  console.log('signals.tsx getStaticProps: Fetching signals...');
  try {
    console.log('signals.tsx getStaticProps: Calling getSignalsServerSide...');
    const allSignals: Signal[] = await getSignalsServerSide(); // Fetch all signals
    console.log(`signals.tsx getStaticProps: Received ${allSignals.length} signals.`);

    if (allSignals.length === 0) {
      console.log('signals.tsx getStaticProps: WARNING - No signals received from getSignalsServerSide');
    } else {
      // Log the first signal for debugging
      console.log('signals.tsx getStaticProps: First signal:', JSON.stringify(allSignals[0], null, 2));
    }

    // Filter signals into newsletters and articles
    const newsletters: Newsletter[] = allSignals.filter(
      (signal): signal is Newsletter => signal.type === 'newsletter'
    );
    const articles: Article[] = allSignals.filter(
      (signal): signal is Article => signal.type === 'article'
    );
    console.log(`signals.tsx getStaticProps: Filtered into ${newsletters.length} newsletters and ${articles.length} articles.`);

    return {
      props: {
        newsletters, // Pass the filtered newsletters
        articles,    // Pass the filtered articles
      },
      revalidate: 10, // Reduced revalidation time for testing (e.g., every 10 seconds)
    };
  } catch (error) {
    console.error('signals.tsx getStaticProps: Error fetching signals:', error);
    return {
      props: {
        newsletters: [], // Return empty on error
        articles: [],
        error: 'Failed to load signals'
      },
      revalidate: 5, // Revalidate very soon if error occurred
    };
  }
};