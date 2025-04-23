import { useCallback, CSSProperties } from 'react';

/**
 * Type definitions for Easter egg trigger props
 */
type EasterEggTriggerProps = {
  'data-egg': string;
  style?: Partial<CSSProperties>;
};

/**
 * A custom hook to easily make any element an Easter egg trigger
 * 
 * Usage:
 * 1. Import this hook: import { useEasterEggTrigger } from '@/lib/easter-eggs/useEasterEggTrigger';
 * 2. Use it in your component: const tripleClickProps = useEasterEggTrigger('triple-click');
 * 3. Spread the props on your element: <div {...tripleClickProps}>Content</div>
 */
export function useEasterEggTrigger(triggerType: 'triple-click' | 'rapid-clicks' | 'hidden-button'): EasterEggTriggerProps {
  // Return different props based on trigger type
  const getProps = useCallback((): EasterEggTriggerProps => {
    switch (triggerType) {
      case 'triple-click':
        return { 'data-egg': 'triple-click' };
      case 'rapid-clicks':
        return { 'data-egg': 'rapid-clicks' };
      case 'hidden-button':
        return { 
          'data-egg': 'hidden-button',
          'style': { 
            position: 'absolute', 
            opacity: 0, 
            pointerEvents: 'none' as const  // Type assertion to satisfy TypeScript
          }
        };
      default:
        return { 'data-egg': 'unknown' };
    }
  }, [triggerType]);

  return getProps();
}
