import { useEffect, useRef, useState } from 'react';
import { useEasterEggs } from '@/lib/easter-eggs/manager';
import { registerAllEasterEggs } from '@/lib/easter-eggs/implementations';

/**
 * Component that listens for Easter egg triggers
 * This should be included at the application root to catch all events
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
    const handleKeyDown = (e: KeyboardEvent) => {
      // Add the key to the sequence
      keysPressed.current = [...keysPressed.current, e.key];
      
      // Keep only the last 10 keys (length of Konami code)
      if (keysPressed.current.length > 10) {
        keysPressed.current = keysPressed.current.slice(keysPressed.current.length - 10);
      }
      
      // Check for Konami code
      checkTrigger('konami', keysPressed.current);
      
      // Check for other key combinations (like 'dev')
      if (keysPressed.current.slice(-3).join('') === 'dev') {
        checkTrigger('secret-key-combo', ['d', 'e', 'v']);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [checkTrigger]);
  
  // Click listener for triple-click and rapid-click Easter eggs
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Check for triple clicks on elements with data-egg="triple-click"
      const target = e.target as HTMLElement;
      if (target.closest('[data-egg="triple-click"]')) {
        clickCounter.current += 1;
        
        if (clickCounter.current === 3) {
          checkTrigger('triple-click', 3);
          clickCounter.current = 0;
        }
        
        // Reset counter after a short delay
        if (clickTimer.current) {
          clearTimeout(clickTimer.current);
        }
        
        clickTimer.current = setTimeout(() => {
          clickCounter.current = 0;
        }, 500);
      }
      
      // Check for rapid clicks in the same area
      const isSameArea = Math.abs(e.clientX - clickPosition.current.x) < 20 && 
                         Math.abs(e.clientY - clickPosition.current.y) < 20;
      
      if (isSameArea) {
        clickCounter.current += 1;
        
        if (clickCounter.current >= 10) {
          checkTrigger('rapid-clicks', 10);
          clickCounter.current = 0;
        }
      } else {
        clickCounter.current = 1;
        clickPosition.current = { x: e.clientX, y: e.clientY };
      }
      
      // Reset rapid click counter after a delay
      if (clickTimer.current) {
        clearTimeout(clickTimer.current);
      }
      
      clickTimer.current = setTimeout(() => {
        clickCounter.current = 0;
      }, 2000);
    };
    
    window.addEventListener('click', handleClick);
    
    return () => {
      window.removeEventListener('click', handleClick);
    };
  }, [checkTrigger]);
  
  // URL hash change listener for special URL Easter eggs
  useEffect(() => {
    const checkUrlEasterEggs = () => {
      const hash = window.location.hash.replace('#', '');
      
      if (hash) {
        checkTrigger('special-url', hash);
      }
    };
    
    // Check on component mount
    checkUrlEasterEggs();
    
    // Listen for hash changes
    window.addEventListener('hashchange', checkUrlEasterEggs);
    
    return () => {
      window.removeEventListener('hashchange', checkUrlEasterEggs);
    };
  }, [checkTrigger]);
  
  // This component doesn't render anything visible
  return null;
}
