// components/signals/NewsletterList.tsx
import React from 'react';
import { Newsletter } from '@/types';
import SignalCard from './SignalCard';

interface NewsletterListProps {
  newsletters: Newsletter[];
  onViewDetails?: (newsletter: Newsletter) => void;
}

export default function NewsletterList({ newsletters, onViewDetails }: NewsletterListProps) {
  if (!newsletters || newsletters.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-lg shadow">
        <h3 className="text-xl text-gray-500">No newsletters found</h3>
        <p className="text-gray-400 mt-2">Check back later for recommendations</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {newsletters.map(newsletter => (
          <SignalCard 
            key={newsletter.id} 
            signal={newsletter} 
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    </div>
  );
}