// components/signals/SignalDetail.tsx
import React from 'react';
import Image from 'next/image';
import { Signal, Newsletter, Article } from '@/types';

interface SignalDetailProps {
  signal: Signal;
  onClose: () => void;
}

export default function SignalDetail({ signal, onClose }: SignalDetailProps) {
  // Helper to determine if this is a newsletter or article
  const isNewsletter = (signal: Signal): signal is Newsletter => signal.type === 'newsletter';
  const isArticle = (signal: Signal): signal is Article => signal.type === 'article';

  // Handle visit/subscribe button click
  const handleActionClick = () => {
    const url = isNewsletter(signal) ? signal.subscriptionUrl : signal.url;
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  // Handle sample view (for newsletters)
  const handleViewSample = () => {
    if (isNewsletter(signal) && signal.sampleUrl) {
      window.open(signal.sampleUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header with image */}
        <div className="relative w-full h-48 md:h-64">
          {signal.imageUrl ? (
            <Image
              src={signal.imageUrl}
              alt={signal.title}
              fill
              className="object-cover rounded-t-lg"
              sizes="(max-width: 768px) 100vw, 720px"
            />
          ) : (
            <div className="w-full h-full bg-steel-blue bg-opacity-20 flex items-center justify-center rounded-t-lg">
              <span className="text-steel-blue text-xl font-medium">
                {isNewsletter(signal) ? 'Newsletter' : 'Article'}
              </span>
            </div>
          )}
          
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Type Badge */}
          <div className={`absolute top-4 left-4 text-white px-3 py-1 rounded-full ${
            isNewsletter(signal) ? 'bg-indigo-600' : 'bg-amber-600'
          }`}>
            {isNewsletter(signal) ? 'Newsletter' : 'Article'}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <h2 className="text-2xl font-bold text-steel-blue mb-2">{signal.title}</h2>
          
          {/* Metadata */}
          <div className="mb-4 text-gray-600">
            {isNewsletter(signal) && (
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <div><span className="font-medium">Publisher:</span> {signal.publisher}</div>
                <div><span className="font-medium">Frequency:</span> <span className="capitalize">{signal.frequency}</span></div>
              </div>
            )}
            
            {isArticle(signal) && (
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <div><span className="font-medium">Author:</span> {signal.author}</div>
                <div><span className="font-medium">Source:</span> {signal.source}</div>
                <div><span className="font-medium">Published:</span> {new Date(signal.publishDate).toLocaleDateString()}</div>
                {signal.readingTime && (
                  <div><span className="font-medium">Reading time:</span> {signal.readingTime} min</div>
                )}
              </div>
            )}
          </div>
          
          {/* Description */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-gray-700 whitespace-pre-line">{signal.description}</p>
          </div>
          
          {/* Tags */}
          {signal.tags && signal.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {signal.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={handleActionClick}
              className={`px-6 py-3 rounded-lg text-white font-medium ${
                isNewsletter(signal) ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-amber-600 hover:bg-amber-700'
              } transition-colors flex-grow`}
            >
              {isNewsletter(signal) ? 'Subscribe to Newsletter' : 'Read Article'}
            </button>
            
            {isNewsletter(signal) && signal.sampleUrl && (
              <button
                onClick={handleViewSample}
                className="px-6 py-3 rounded-lg border border-indigo-600 text-indigo-600 font-medium hover:bg-indigo-50 transition-colors"
              >
                View Sample Issue
              </button>
            )}
          </div>
          
          {/* Info about affiliate links if applicable */}
          {signal.affiliateCode && (
            <p className="text-xs text-gray-500 mt-4">
              Note: This link includes an affiliate code. If you subscribe/purchase through this link, I may receive a small commission at no extra cost to you.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}