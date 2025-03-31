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
              <div key={newsletter.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold mb-2">{newsletter.title}</h3>
                <p className="text-gray-600 mb-3">{newsletter.description}</p>
                <a href={newsletter.url} target="_blank" rel="noopener noreferrer" 
                   className="text-blue-600 hover:text-blue-800 block mt-2">
                  Subscribe
                </a>
              </div>
            ))}
          </div>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4">Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map(article => (
              <div key={article.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold mb-2">{article.title}</h3>
                <p className="text-gray-600 mb-1">{article.source}</p>
                <p className="text-gray-600 mb-3">{article.description}</p>
                <a href={article.url} target="_blank" rel="noopener noreferrer" 
                   className="text-blue-600 hover:text-blue-800 block mt-2">
                  Read Article
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
    const allSignals: Signal[] = await getSignalsServerSide(); // Fetch all signals
    console.log(`signals.tsx getStaticProps: Received ${allSignals.length} signals.`);

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
      revalidate: 60, // Revalidate every 60 seconds
    };
  } catch (error) {
    console.error('signals.tsx getStaticProps: Error fetching signals:', error);
    return {
      props: {
        newsletters: [], // Return empty on error
        articles: [],
        error: 'Failed to load signals'
      },
      revalidate: 10, // Revalidate sooner if error occurred
    };
  }
};