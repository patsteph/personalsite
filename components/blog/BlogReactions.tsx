import { useState, useEffect } from 'react';
import { Reactions, ReactionType } from '@/types/blog';

interface BlogReactionsProps {
  postId: string;
  slug: string;
  initialReactions?: Reactions;
  onReact?: (type: ReactionType) => void;
}

const defaultReactions: Reactions = {
  thumbsUp: 0,
  celebrate: 0,
  brain: 0,
  meh: 0
};

const reactionEmojis: Record<ReactionType, string> = {
  thumbsUp: '👍',
  celebrate: '🎉',
  brain: '🧠',
  meh: '😐'
};

const reactionLabels: Record<ReactionType, string> = {
  thumbsUp: 'Like',
  celebrate: 'Celebrate',
  brain: 'Insightful',
  meh: 'Meh'
};

export default function BlogReactions({ postId, slug, initialReactions = defaultReactions, onReact }: BlogReactionsProps) {
  const [reactions, setReactions] = useState<Reactions>(initialReactions);
  const [userReacted, setUserReacted] = useState<Record<ReactionType, boolean>>({
    thumbsUp: false,
    celebrate: false,
    brain: false,
    meh: false
  });

  // Handle reaction click
  const handleReaction = async (type: ReactionType) => {
    // If user already reacted, do nothing (could toggle off in a future version)
    if (userReacted[type]) {
      return;
    }

    // Optimistically update UI
    setReactions(prev => ({
      ...prev,
      [type]: (prev[type] || 0) + 1
    }));
    
    setUserReacted(prev => ({
      ...prev,
      [type]: true
    }));

    // Store reaction in localStorage to prevent multiple reactions from same user
    const localStorageKey = `blog-reaction-${slug}`;
    localStorage.setItem(localStorageKey, JSON.stringify({
      ...userReacted,
      [type]: true
    }));

    // Call API to update reaction count
    try {
      const response = await fetch('/api/blog-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          postId,
          reaction: type
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update reaction');
      }

      // Call onReact callback if provided
      if (onReact) {
        onReact(type);
      }
    } catch (error) {
      console.error('Error updating reaction:', error);
      
      // Revert UI changes on error
      setReactions(prev => ({
        ...prev,
        [type]: Math.max(0, (prev[type] || 0) - 1)
      }));
      
      setUserReacted(prev => ({
        ...prev,
        [type]: false
      }));
    }
  };

  // Load previously selected reactions from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const localStorageKey = `blog-reaction-${slug}`;
      const savedReactions = localStorage.getItem(localStorageKey);
      
      if (savedReactions) {
        try {
          const parsed = JSON.parse(savedReactions);
          setUserReacted(parsed);
        } catch (e) {
          console.error('Error parsing saved reactions:', e);
        }
      }
    }
  }, [slug]);

  return (
    <div className="my-6 border-t border-gray-200 pt-4">
      <h3 className="text-base font-medium text-gray-700 mb-2">What did you think?</h3>
      <div className="flex flex-wrap gap-2">
        {Object.entries(reactionEmojis).map(([type, emoji]) => (
          <button
            key={type}
            onClick={() => handleReaction(type as ReactionType)}
            disabled={userReacted[type as ReactionType]}
            className={`flex flex-col items-center px-2 py-1 rounded-md transition-colors ${
              userReacted[type as ReactionType]
                ? 'bg-blue-50 text-blue-600 border border-blue-200'
                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
            }`}
            aria-label={`React with ${reactionLabels[type as ReactionType]}`}
          >
            <span className="text-lg mb-0.5">{emoji}</span>
            <span className="text-xs font-medium">
              {reactionLabels[type as ReactionType]}
              {reactions[type as ReactionType] > 0 && ` (${reactions[type as ReactionType]})`}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}