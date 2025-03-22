// components/signals/SignalCard.tsx
import React from 'react';
import Image from 'next/image';
import { Signal, Newsletter, Article } from '@/types';

interface SignalCardProps {
  signal: Signal;
  onViewDetails?: (signal: Signal) => void;
}

export default function SignalCard({ signal, onViewDetails }: SignalCardProps) {
  // Helper to determine if this is a newsletter or article
  const isNewsletter = (signal: Signal): signal is Newsletter => signal.type === 'newsletter';
  const isArticle = (signal: Signal): signal is Article => signal.type === 'article';

  // Create preview text from description (truncate if needed)
  const previewText = signal.description?.length > 120 
    ? `${signal.description.substring(0, 120)}...` 
    : signal.description;
  
  // Handle click on card
  const handleClick = () => {
    if (onViewDetails) {
      onViewDetails(signal);
    } else {
      // Direct to URL if no handler provided
      window.open(signal.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
      onClick={handleClick}
    >
      {/* Card Header with Image */}
      <div className="relative w-full h-40">
        {signal.imageUrl ? (
          <Image
            src={signal.imageUrl}
            alt={signal.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-steel-blue bg-opacity-20 flex items-center justify-center">
            <span className="text-steel-blue font-medium">
              {isNewsletter(signal) ? 'Newsletter' : 'Article'}
            </span>
          </div>
        )}
        {/* Featured Badge */}
        {signal.featured && (
          <div className="absolute top-2 right-2 bg-accent text-white text-xs px-2 py-1 rounded-full">
            Featured
          </div>
        )}
        {/* Type Badge */}
        <div className={`absolute top-2 left-2 text-white text-xs px-2 py-1 rounded-full ${
          isNewsletter(signal) ? 'bg-indigo-600' : 'bg-amber-600'
        }`}>
          {isNewsletter(signal) ? 'Newsletter' : 'Article'}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-steel-blue mb-1">{signal.title}</h3>
        
        <div className="text-sm text-gray-600 mb-2">
          {isNewsletter(signal) && (
            <div className="mb-1">
              <span className="font-medium">Publisher:</span> {signal.publisher} • 
              <span className="ml-1 capitalize">{signal.frequency}</span>
            </div>
          )}
          
          {isArticle(signal) && (
            <div className="mb-1">
              <span className="font-medium">By:</span> {signal.author} • 
              <span className="ml-1 font-medium">Source:</span> {signal.source}
              {signal.readingTime && (
                <span className="ml-1">• {signal.readingTime} min read</span>
              )}
            </div>
          )}
        </div>
        
        <p className="text-gray-700 text-sm mb-3">{previewText}</p>
        
        {/* Tags */}
        {signal.tags && signal.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {signal.tags.slice(0, 3).map(tag => (
              <span 
                key={tag} 
                className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
            {signal.tags.length > 3 && (
              <span className="text-xs text-gray-500">+{signal.tags.length - 3} more</span>
            )}
          </div>
        )}
      </div>
      
      {/* Card Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
        <span className="text-xs text-gray-500">
          Added {new Date(signal.dateAdded).toLocaleDateString()}
        </span>
        <button className="text-steel-blue text-sm hover:underline">
          View {isNewsletter(signal) ? 'Newsletter' : 'Article'} →
        </button>
      </div>
    </div>
  );
}