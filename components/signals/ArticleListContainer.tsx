// components/signals/ArticleListContainer.tsx
import React, { useState } from 'react';
import { Signal, Article } from '@/types';
import ArticleList from './ArticleList';
import useSignals from '@/lib/hooks/useSignals';
import { notifyError } from '@/lib/utils/error-handler';
import SignalDetail from './SignalDetail';

interface ArticleListContainerProps {
  initialArticles?: Article[];
  tag?: string;
  featured?: boolean;
}

export default function ArticleListContainer({ 
  initialArticles = [], 
  tag, 
  featured 
}: ArticleListContainerProps) {
  // Use our custom hook for signal management
  const { signals: articles, loading, hasMore, loadMore, error } = useSignals({
    initialSignals: initialArticles,
    type: 'article',
    tag,
    featured
  });

  // UI state
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [showDetail, setShowDetail] = useState<boolean>(false);

  // Handle errors
  if (error) {
    notifyError(error, 'ArticleListContainer');
  }

  // Handle viewing signal details
  const handleViewDetails = (signal: Signal) => {
    setSelectedSignal(signal);
    setShowDetail(true);
  };

  // Handle closing the detail view
  const handleCloseDetail = () => {
    setShowDetail(false);
    setTimeout(() => setSelectedSignal(null), 300); // Clear after animation
  };

  // Handle loading more articles
  const handleLoadMore = async () => {
    if (!loading && hasMore) {
      await loadMore();
    }
  };

  return (
    <div>
      {/* Main Article List */}
      <ArticleList 
        articles={articles as Article[]} 
        onViewDetails={handleViewDetails} 
      />

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center my-6">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      )}

      {/* Load More Button */}
      {hasMore && !loading && (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleLoadMore}
            className="bg-steel-blue hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
          >
            Load More Articles
          </button>
        </div>
      )}

      {/* End of List Message */}
      {!hasMore && articles.length > 0 && (
        <p className="text-center text-gray-500 mt-8">
          You've reached the end of the list
        </p>
      )}

      {/* Detail Modal */}
      {selectedSignal && showDetail && (
        <SignalDetail 
          signal={selectedSignal} 
          onClose={handleCloseDetail} 
        />
      )}
    </div>
  );
}
