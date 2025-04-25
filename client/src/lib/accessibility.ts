
// Keyboard navigation helper
export const handleKeyboardNavigation = (
  event: React.KeyboardEvent,
  onEnter?: () => void,
  onSpace?: () => void,
  onEscape?: () => void
) => {
  if (event.key === 'Enter' && onEnter) {
    event.preventDefault();
    onEnter();
  }
  if (event.key === ' ' && onSpace) {
    event.preventDefault();
    onSpace();
  }
  if (event.key === 'Escape' && onEscape) {
    event.preventDefault();
    onEscape();
  }
};

// Focus trap for modals and dialogs
export const setupFocusTrap = (containerRef: React.RefObject<HTMLElement>) => {
  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !containerRef.current) return;
    
    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    // If shift+tab and on first element, move to last element
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } 
    // If tab and on last element, move to first element
    else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  };
  
  return {
    activate: () => {
      document.addEventListener('keydown', handleTabKey);
      // Focus the first element when activated
      setTimeout(() => {
        if (containerRef.current) {
          const firstFocusable = containerRef.current.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) as HTMLElement;
          if (firstFocusable) firstFocusable.focus();
        }
      }, 0);
    },
    deactivate: () => {
      document.removeEventListener('keydown', handleTabKey);
    }
  };
};

// ARIA helper for screen readers
export const srOnly = "absolute w-px h-px p-0 -m-px overflow-hidden clip whitespace-nowrap border-0";

// Skip to content link generator
export const SkipToContentLink = () => (
  <a 
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:p-2 focus:bg-green-600 focus:text-white focus:outline-none"
  >
    Skip to main content
  </a>
);
