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
  const handleReaction = async (type: ReactionType, event?: React.MouseEvent) => {
    // Prevent event propagation to parent elements
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Reset all reactions if changing reaction
    const hasReactedBefore = Object.values(userReacted).some(value => value === true);
    
    // Different behavior based on whether user has already reacted
    if (hasReactedBefore) {
      // If already reacted with this type, do nothing
      if (userReacted[type]) {
        return;
      }
      
      // Figure out which reaction type was used before
      let previousType: ReactionType | null = null;
      for (const [key, value] of Object.entries(userReacted)) {
        if (value === true) {
          previousType = key as ReactionType;
          break;
        }
      }
      
      // Reset the previous reaction
      if (previousType) {
        // Update UI to remove previous reaction
        setReactions(prev => ({
          ...prev,
          [previousType as ReactionType]: Math.max(0, (prev[previousType as ReactionType] || 0) - 1)
        }));
      }
    }

    // Update UI for new reaction
    setReactions(prev => ({
      ...prev,
      [type]: (prev[type] || 0) + 1
    }));
    
    // Reset all reactions and set the new one
    setUserReacted({
      thumbsUp: false,
      celebrate: false,
      brain: false,
      meh: false,
      [type]: true
    });

    // Store reaction in localStorage with one reaction at a time
    const localStorageKey = `blog-reaction-${slug}`;
    localStorage.setItem(localStorageKey, JSON.stringify({
      thumbsUp: false,
      celebrate: false,
      brain: false,
      meh: false,
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
          reaction: type,
          // If changing reaction, indicate the previous one to remove
          previousReaction: hasReactedBefore ? 
            Object.entries(userReacted).find(([, value]) => value === true)?.[0] : 
            undefined
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
      
      // Revert user reaction state on error
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
      
      // Track unique visit for analytics
      const visitKey = `blog-visit-${slug}`;
      const hasVisited = localStorage.getItem(visitKey);
      
      if (!hasVisited) {
        // First visit to this post in this session
        localStorage.setItem(visitKey, new Date().toISOString());
        
        // Track visitor count through the API
        try {
          fetch('/api/blog-post', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              postId,
              action: 'visit'
            })
          });
        } catch (error) {
          console.error('Error logging visit:', error);
        }
      }
      
      if (savedReactions) {
        try {
          const parsed = JSON.parse(savedReactions);
          setUserReacted(parsed);
        } catch (e) {
          console.error('Error parsing saved reactions:', e);
        }
      }
    }
  }, [slug, postId]);

  // Prevent event propagation for the entire reactions section
  const preventPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="my-6 border-t border-gray-200 pt-4" onClick={preventPropagation}>
      <h3 className="text-base font-medium text-gray-700 mb-2">What did you think?</h3>
      <div className="flex flex-wrap gap-2">
        {Object.entries(reactionEmojis).map(([type, emoji]) => (
          <button
            key={type}
            onClick={(e) => handleReaction(type as ReactionType, e)}
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