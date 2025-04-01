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
            {/* Simplified Rendering for Debugging */}
            {newsletters.map(newsletter => (
              <p key={newsletter.id}>Newsletter: {newsletter.title}</p>
            ))}
          </div>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4">Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Simplified Rendering for Debugging */}
            {articles.map(article => (
              <p key={article.id}>Article: {article.title}</p>
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