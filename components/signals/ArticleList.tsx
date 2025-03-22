// components/signals/ArticleList.tsx
import React from 'react';
import { Article } from '@/types';
import SignalCard from './SignalCard';

interface ArticleListProps {
  articles: Article[];
  onViewDetails?: (article: Article) => void;
}

export default function ArticleList({ articles, onViewDetails }: ArticleListProps) {
  if (!articles || articles.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-lg shadow">
        <h3 className="text-xl text-gray-500">No articles found</h3>
        <p className="text-gray-400 mt-2">Check back later for recommendations</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map(article => (
          <SignalCard 
            key={article.id} 
            signal={article} 
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    </div>
  );
}