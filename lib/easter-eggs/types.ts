/**
 * Types for the Easter Egg system
 */

export type EasterEggTrigger = 
  | 'konami' 
  | 'triple-click'
  | 'secret-key-combo'
  | 'special-url'
  | 'rapid-clicks'
  | 'hidden-button'
  | 'custom';

export type EasterEggEffect = {
  id: string;
  name: string;
  description: string;
  action: () => void;
  cooldown?: number; // Time in ms before the egg can be triggered again
};

export type EasterEgg = {
  id: string;
  trigger: EasterEggTrigger;
  triggerPattern?: string | string[] | number; // Pattern, key sequence, or click count
  effect: EasterEggEffect;
  enabled: boolean;
  discoveredBy?: string[]; // List of user IDs or session IDs that have found this egg
  discovered?: boolean; // Whether the egg has been discovered in the current session
};
