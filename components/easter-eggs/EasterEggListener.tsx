import { useEffect, useRef, useState } from 'react';
import { useEasterEggs } from '@/lib/easter-eggs/manager';
import { registerAllEasterEggs } from '@/lib/easter-eggs/implementations';
import { EasterEggTrigger } from '@/lib/easter-eggs/types';

/**
 * Throttle function to limit the rate of function calls
 */
function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Component that listens for Easter egg triggers
 * This is included at the application root to detect all possible events
 */
export default function EasterEggListener() {
  const { checkTrigger } = useEasterEggs();
  const keysPressed = useRef<string[]>([]);
  const [initialized, setInitialized] = useState(false);
  const clickCounter = useRef(0);
  const clickTimer = useRef<NodeJS.Timeout | null>(null);
  const clickPosition = useRef({ x: 0, y: 0 });
  
  // Initialize all Easter eggs
  useEffect(() => {
    if (!initialized) {
      registerAllEasterEggs();
      setInitialized(true);
    }
  }, [initialized]);
  
  // Konami code listener
  useEffect(() => {
    const handleKeyDown = throttle((e: KeyboardEvent) => {
      // Add the key to the sequence
      keysPressed.current = [...keysPressed.current, e.key];
      
      // Keep only the last 10 keys (length of Konami code)
      if (keysPressed.current.length > 10) {
        keysPressed.current = keysPressed.current.slice(keysPressed.current.length - 10);
      }
      
      // Check for Konami code
      checkTrigger('konami' as EasterEggTrigger, keysPressed.current);
      
      // Check for other key combinations (like 'dev')
      if (keysPressed.current.slice(-3).join('') === 'dev') {
        checkTrigger('secret-key-combo' as EasterEggTrigger, ['d', 'e', 'v']);
      }
    }, 100);
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [checkTrigger]);
  
  // Triple-click event listener
  useEffect(() => {
    // Tracking variables for triple-click
    let tripleClickCount = 0;
    let lastTripleClickTime = 0;
    let triggerLock = false;
    let lockTimer: NodeJS.Timeout | null = null;
    
    const handleTripleClick = throttle((e: MouseEvent) => {
      if (triggerLock) return; // Prevent multiple rapid triggers
      
      const currentTime = new Date().getTime();
      
      // Reset count if too much time has passed
      if (currentTime - lastTripleClickTime > 500) {
        tripleClickCount = 0;
      }
      
      tripleClickCount++;
      lastTripleClickTime = currentTime;
      
      if (tripleClickCount === 3) {
        try {
          // Check if the triple-click happened on an element with data-easter-egg
          const element = e.target as HTMLElement;
          const parentWithAttr = element.closest('[data-easter-egg="triple-click"]');
          
          if (parentWithAttr) {
            // Lock to prevent multiple rapid activations
            triggerLock = true;
            if (lockTimer) clearTimeout(lockTimer);
            lockTimer = setTimeout(() => { triggerLock = false; }, 2000);
            
            checkTrigger('triple-click' as EasterEggTrigger, []);
          }
        } catch (error) {
          console.error('Error handling triple click:', error);
        }
        
        tripleClickCount = 0;
      }
    }, 50);
    
    document.addEventListener('click', handleTripleClick);
    
    return () => {
      document.removeEventListener('click', handleTripleClick);
      if (lockTimer) clearTimeout(lockTimer);
    };
  }, [checkTrigger]);
  
  // Rapid click detection
  useEffect(() => {
    let activationLock = false;
    let lockTimer: NodeJS.Timeout | null = null;
    
    const handleRapidClick = throttle((e: MouseEvent) => {
      if (activationLock) return; // Prevent multiple rapid activations
      
      clickCounter.current += 1;
      
      // Track position of clicks to ensure they're in roughly the same spot
      const { clientX, clientY } = e;
      const isCloseToLastClick = 
        Math.abs(clientX - clickPosition.current.x) < 20 && 
        Math.abs(clientY - clickPosition.current.y) < 20;
      
      if (!isCloseToLastClick) {
        // Reset the counter if clicked in a different area
        clickCounter.current = 1;
      }
      
      // Update the position
      clickPosition.current = { x: clientX, y: clientY };
      
      // Clear existing timer
      if (clickTimer.current) {
        clearTimeout(clickTimer.current);
      }
      
      // Set a new timer to reset the counter after 2 seconds of inactivity
      clickTimer.current = setTimeout(() => {
        clickCounter.current = 0;
      }, 2000);
      
      // Check if we've reached the rapid click threshold
      if (clickCounter.current >= 10) {
        try {
          // Lock to prevent multiple rapid activations
          activationLock = true;
          if (lockTimer) clearTimeout(lockTimer);
          lockTimer = setTimeout(() => { activationLock = false; }, 3000);
          
          checkTrigger('rapid-clicks' as EasterEggTrigger, []);
          clickCounter.current = 0;
        } catch (error) {
          console.error('Error handling rapid clicks:', error);
        }
      }
    }, 50); // Throttle to 50ms (20 clicks per second max)
    
    document.addEventListener('click', handleRapidClick);
    
    return () => {
      document.removeEventListener('click', handleRapidClick);
      if (clickTimer.current) clearTimeout(clickTimer.current);
      if (lockTimer) clearTimeout(lockTimer);
    };
  }, [checkTrigger]);
  
  // URL hash change listener (throttled to prevent excessive history API calls)
  useEffect(() => {
    // Throttle to max once per second
    const checkUrlForEasterEggs = throttle(() => {
      try {
        const hash = window.location.hash;
        
        // Check for birthday Easter egg
        if (hash.includes('birthday')) {
          checkTrigger('url-hash' as EasterEggTrigger, ['birthday']);
        }
      } catch (error) {
        console.error('Error checking URL for Easter eggs:', error);
      }
    }, 1000);
    
    // Check on init (with a delay to ensure the page is fully loaded)
    const initTimeout = setTimeout(checkUrlForEasterEggs, 1000);
    
    // Check when hash changes
    window.addEventListener('hashchange', checkUrlForEasterEggs);
    
    return () => {
      clearTimeout(initTimeout);
      window.removeEventListener('hashchange', checkUrlForEasterEggs);
    };
  }, [checkTrigger]);
  
  // This component doesn't render anything visible
  return null;
}
