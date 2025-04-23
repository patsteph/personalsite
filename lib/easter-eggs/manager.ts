import { useState, useEffect, useCallback } from 'react';
import { EasterEgg, EasterEggTrigger } from './types';

/**
 * Manages the Easter eggs in the application
 */
class EasterEggManager {
  private static instance: EasterEggManager;
  private eggs: EasterEgg[] = [];
  private discoveredEggs: Set<string> = new Set();

  private constructor() {
    // Private constructor for singleton pattern
    this.loadDiscoveredEggsFromStorage();
  }

  /**
   * Get the singleton instance of the EasterEggManager
   */
  public static getInstance(): EasterEggManager {
    if (!EasterEggManager.instance) {
      EasterEggManager.instance = new EasterEggManager();
    }
    return EasterEggManager.instance;
  }

  /**
   * Register a new Easter egg
   */
  public registerEgg(egg: EasterEgg): void {
    // Check if egg with same ID already exists
    if (this.eggs.some(e => e.id === egg.id)) {
      console.warn(`Easter egg with ID ${egg.id} already registered.`);
      return;
    }
    
    this.eggs.push({
      ...egg,
      discovered: this.discoveredEggs.has(egg.id)
    });
  }

  /**
   * Register multiple Easter eggs at once
   */
  public registerEggs(eggs: EasterEgg[]): void {
    eggs.forEach(egg => this.registerEgg(egg));
  }

  /**
   * Get all registered Easter eggs
   */
  public getAllEggs(): EasterEgg[] {
    return [...this.eggs];
  }

  /**
   * Get Easter eggs by trigger type
   */
  public getEggsByTrigger(trigger: EasterEggTrigger): EasterEgg[] {
    return this.eggs.filter(egg => egg.trigger === trigger && egg.enabled);
  }

  /**
   * Trigger an Easter egg by its ID
   */
  public triggerEggById(id: string): boolean {
    const egg = this.eggs.find(e => e.id === id && e.enabled);
    
    if (!egg) {
      console.warn(`No enabled Easter egg found with ID ${id}.`);
      return false;
    }
    
    return this.activateEgg(egg);
  }

  /**
   * Check if a trigger pattern matches and activate matching eggs
   */
  public checkAndTrigger(trigger: EasterEggTrigger, pattern: string | string[] | number): boolean {
    const matchingEggs = this.getEggsByTrigger(trigger).filter(egg => {
      if (!egg.triggerPattern) return false;
      
      if (typeof egg.triggerPattern === 'number' && typeof pattern === 'number') {
        return egg.triggerPattern === pattern;
      }
      
      if (Array.isArray(egg.triggerPattern) && Array.isArray(pattern)) {
        return JSON.stringify(egg.triggerPattern) === JSON.stringify(pattern);
      }
      
      return egg.triggerPattern === pattern;
    });
    
    let activated = false;
    
    matchingEggs.forEach(egg => {
      if (this.activateEgg(egg)) {
        activated = true;
      }
    });
    
    return activated;
  }

  /**
   * Activate an Easter egg's effect
   */
  private activateEgg(egg: EasterEgg): boolean {
    try {
      egg.effect.action();
      
      // Mark as discovered if not already
      if (!egg.discovered) {
        this.discoveredEggs.add(egg.id);
        egg.discovered = true;
        this.saveDiscoveredEggsToStorage();
      }
      
      return true;
    } catch (error) {
      console.error(`Error activating Easter egg ${egg.id}:`, error);
      return false;
    }
  }

  /**
   * Save discovered eggs to local storage
   */
  private saveDiscoveredEggsToStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('discoveredEasterEggs', JSON.stringify([...this.discoveredEggs]));
    }
  }

  /**
   * Load discovered eggs from local storage
   */
  private loadDiscoveredEggsFromStorage(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('discoveredEasterEggs');
      if (stored) {
        try {
          const eggIds = JSON.parse(stored) as string[];
          this.discoveredEggs = new Set(eggIds);
        } catch (error) {
          console.error('Error loading discovered Easter eggs:', error);
        }
      }
    }
  }

  /**
   * Reset all discovered Easter eggs
   */
  public resetDiscoveredEggs(): void {
    this.discoveredEggs.clear();
    this.eggs.forEach(egg => {
      egg.discovered = false;
    });
    this.saveDiscoveredEggsToStorage();
  }
}

/**
 * React hook for using Easter eggs in components
 */
export function useEasterEggs() {
  const manager = EasterEggManager.getInstance();
  const [discoveredCount, setDiscoveredCount] = useState(0);
  
  // Update discovered count
  const updateDiscoveredCount = useCallback(() => {
    const eggs = manager.getAllEggs();
    setDiscoveredCount(eggs.filter(egg => egg.discovered).length);
  }, []);
  
  // Trigger an egg by ID
  const triggerEgg = useCallback((id: string) => {
    const result = manager.triggerEggById(id);
    updateDiscoveredCount();
    return result;
  }, [updateDiscoveredCount]);
  
  // Check for a trigger pattern and activate matching eggs
  const checkTrigger = useCallback((trigger: EasterEggTrigger, pattern: string | string[] | number) => {
    const result = manager.checkAndTrigger(trigger, pattern);
    updateDiscoveredCount();
    return result;
  }, [updateDiscoveredCount]);
  
  // Get all eggs
  const getAllEggs = useCallback(() => {
    return manager.getAllEggs();
  }, []);
  
  // Register a new egg
  const registerEgg = useCallback((egg: EasterEgg) => {
    manager.registerEgg(egg);
    updateDiscoveredCount();
  }, [updateDiscoveredCount]);
  
  // Get discovered egg count
  const getDiscoveredCount = useCallback(() => {
    return discoveredCount;
  }, [discoveredCount]);
  
  const getTotalCount = useCallback(() => {
    return manager.getAllEggs().length;
  }, []);
  
  useEffect(() => {
    updateDiscoveredCount();
  }, [updateDiscoveredCount]);
  
  return {
    triggerEgg,
    checkTrigger,
    getAllEggs,
    registerEgg,
    getDiscoveredCount,
    getTotalCount
  };
}

// Export singleton instance
export const easterEggManager = EasterEggManager.getInstance();
