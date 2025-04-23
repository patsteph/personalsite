import { EasterEgg } from './types';
import { easterEggManager } from './manager';
import confetti from 'canvas-confetti';

/**
 * Implementation of specific Easter eggs for the website
 */

// Helper for confetti effect
const launchConfetti = () => {
  if (typeof window !== 'undefined') {
    const duration = 3 * 1000;
    const end = Date.now() + duration;
    
    const colors = ['#4C4CFF', '#00FFFF', '#FC73FF'];
    
    (function frame() {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });
      
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }
};

// Helper for matrix effect
const matrixRainEffect = () => {
  if (typeof document === 'undefined') return;
  
  // Create canvas overlay
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '9999';
  canvas.style.pointerEvents = 'none';
  
  document.body.appendChild(canvas);
  
  // Set canvas size
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  
  window.addEventListener('resize', resize);
  resize();
  
  // Matrix characters
  const characters = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
  const charSize = 14;
  const columns = Math.floor(canvas.width / charSize);
  const drops: number[] = Array(columns).fill(1);
  
  // Animation
  let frameId: number | null = null;
  const draw = () => {
    if (!ctx) return;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#0F0';
    ctx.font = `${charSize}px monospace`;
    
    for (let i = 0; i < drops.length; i++) {
      const text = characters.charAt(Math.floor(Math.random() * characters.length));
      
      ctx.fillText(text, i * charSize, drops[i] * charSize);
      
      if (drops[i] * charSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      
      drops[i]++;
    }
    
    frameId = requestAnimationFrame(draw);
  };
  
  // Start animation
  frameId = requestAnimationFrame(draw);
  
  // Stop after 10 seconds
  setTimeout(() => {
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
    }
    document.body.removeChild(canvas);
    window.removeEventListener('resize', resize);
  }, 10000);
};

// Helper for spinning page effect
const spinPage = () => {
  if (typeof document === 'undefined') return;
  
  const mainContent = document.getElementById('__next') || document.body;
  
  mainContent.style.transition = 'transform 5s ease-in-out';
  mainContent.style.transformOrigin = 'center center';
  
  // Apply rotation
  mainContent.style.transform = 'rotate(360deg)';
  
  // Reset after animation
  setTimeout(() => {
    mainContent.style.transition = 'transform 0.5s ease-out';
    mainContent.style.transform = 'rotate(0deg)';
    
    // Remove styles completely after transition
    setTimeout(() => {
      mainContent.style.transition = '';
      mainContent.style.transform = '';
      mainContent.style.transformOrigin = '';
    }, 500);
  }, 5000);
};

// Helper to show a hidden message
const showSecretMessage = (message: string) => {
  if (typeof document === 'undefined') return;
  
  // Create message element
  const messageEl = document.createElement('div');
  messageEl.style.position = 'fixed';
  messageEl.style.top = '50%';
  messageEl.style.left = '50%';
  messageEl.style.transform = 'translate(-50%, -50%)';
  messageEl.style.background = 'rgba(0, 0, 0, 0.8)';
  messageEl.style.color = '#fff';
  messageEl.style.padding = '20px';
  messageEl.style.borderRadius = '10px';
  messageEl.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.5)';
  messageEl.style.zIndex = '9999';
  messageEl.style.maxWidth = '80%';
  messageEl.style.textAlign = 'center';
  messageEl.style.fontFamily = 'monospace';
  messageEl.style.fontSize = '16px';
  
  // Add message content
  messageEl.innerHTML = message.replace(/\n/g, '<br>');
  
  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.innerText = 'Close';
  closeBtn.style.marginTop = '15px';
  closeBtn.style.padding = '8px 16px';
  closeBtn.style.background = '#4C4CFF';
  closeBtn.style.border = 'none';
  closeBtn.style.borderRadius = '5px';
  closeBtn.style.color = 'white';
  closeBtn.style.cursor = 'pointer';
  
  closeBtn.onclick = () => {
    document.body.removeChild(messageEl);
  };
  
  messageEl.appendChild(closeBtn);
  
  // Add to document
  document.body.appendChild(messageEl);
};

// Define the Easter Eggs
export const konamiCodeEgg: EasterEgg = {
  id: 'konami-code',
  trigger: 'konami',
  triggerPattern: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'],
  effect: {
    id: 'confetti-burst',
    name: 'Konami Code Discovered!',
    description: 'The classic cheat code triggers a shower of celebratory confetti!',
    action: () => {
      launchConfetti();
      showSecretMessage('You discovered the Konami Code!\n\nUP UP DOWN DOWN LEFT RIGHT LEFT RIGHT B A');
    }
  },
  enabled: true
};

export const tripleClickEgg: EasterEgg = {
  id: 'triple-click-logo',
  trigger: 'triple-click',
  triggerPattern: 3,
  effect: {
    id: 'matrix-rain',
    name: 'Matrix Mode',
    description: 'Triple-clicking the logo reveals the Matrix',
    action: () => {
      matrixRainEffect();
      showSecretMessage('Wake up, Neo...\nThe Matrix has you...');
    }
  },
  enabled: true
};

export const secretKeyComboEgg: EasterEgg = {
  id: 'dev-mode',
  trigger: 'secret-key-combo',
  triggerPattern: ['d', 'e', 'v'],
  effect: {
    id: 'dev-mode-activate',
    name: 'Developer Mode',
    description: 'Typing "dev" activates a special developer mode',
    action: () => {
      // Add a console message for developers
      console.log('%c🔍 Developer Mode Activated!', 'color: #00ff00; font-size: 20px; font-weight: bold;');
      console.log('%cWelcome to the developer console of my website.', 'font-size: 14px;');
      console.log('%cFeel free to explore, but remember: with great power comes great responsibility!', 'font-size: 14px;');
      
      showSecretMessage('Developer Mode Activated! 👨‍💻\n\nCheck the console for more information.');
    }
  },
  enabled: true
};

export const rapidClicksEgg: EasterEgg = {
  id: 'rapid-clicks',
  trigger: 'rapid-clicks',
  triggerPattern: 10, // 10 rapid clicks
  effect: {
    id: 'page-spin',
    name: 'Spin Cycle',
    description: 'Rapidly clicking the same spot makes the page spin',
    action: spinPage,
    cooldown: 15000 // 15 seconds cooldown
  },
  enabled: true
};

export const birthdayEgg: EasterEgg = {
  id: 'birthday-surprise',
  trigger: 'special-url',
  triggerPattern: 'birthday',
  effect: {
    id: 'birthday-celebration',
    name: 'Birthday Surprise',
    description: 'A special surprise when visiting on a birthday',
    action: () => {
      launchConfetti();
      
      // Birthday message
      const message = `
        🎂 Happy Birthday! 🎂
        
        Thanks for visiting my website on this special day!
        Here's a little celebration just for you.
      `;
      
      showSecretMessage(message);
    }
  },
  enabled: true
};

// Register all Easter eggs
export function registerAllEasterEggs() {
  easterEggManager.registerEggs([
    konamiCodeEgg,
    tripleClickEgg,
    secretKeyComboEgg,
    rapidClicksEgg,
    birthdayEgg
  ]);
}
